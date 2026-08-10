import {
  AutoTokenizer,
  AutoModelForCausalLM,
  TextStreamer,
  InterruptableStoppingCriteria,
} from "@huggingface/transformers";

/**
 * 辅助函数：检测浏览器是否支持 WebGPU
 */
// let fp16_supported = false;
async function check() {
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error("WebGPU is not supported (no adapter found)");
    }
    // fp16_supported = adapter.features.has("shader-f16")
  } catch (e) {
    self.postMessage({
      status: "error",
      data: e.toString(),
    });
  }
}

/**
 * 单例模式：懒加载文本生成管道（tokenizer + model）
 * 避免重复加载模型，节省内存和时间
 */
class TextGenerationPipeline {
  static model_id = "onnx-community/DeepSeek-R1-Distill-Qwen-1.5B-ONNX";

  static async getInstance(progress_callback = null) {
    // ??= 空值赋值：首次调用时初始化，后续复用
    this.tokenizer ??= AutoTokenizer.from_pretrained(this.model_id, {
      progress_callback,
    });

    this.model ??= AutoModelForCausalLM.from_pretrained(this.model_id, {
      dtype: "q4f16",       // 4 比特量化 + fp16，减小模型体积
      device: "webgpu",     // 使用 WebGPU 加速推理
      progress_callback,
    });

    return Promise.all([this.tokenizer, this.model]);
  }
}

// 可中断的停止条件（用于用户点「停止」时打断生成）
const stopping_criteria = new InterruptableStoppingCriteria();

// KV Cache：缓存上一轮的 key/value，加速多轮对话
let past_key_values_cache = null;
async function generate(messages) {
  // 获取文本生成管道（tokenizer + model）
  const [tokenizer, model] = await TextGenerationPipeline.getInstance();

  // 应用聊天模板，把 messages 数组转成模型输入
  const inputs = tokenizer.apply_chat_template(messages, {
    add_generation_prompt: true,  // 加上助手角色的开头标记
    return_dict: true,
  });

  // 思考开始/结束标记的 token id（DeepSeek-R1 用 think 标签包裹思考过程）
  // 151648 是思考开始 token，151649 是思考结束 token
  const thinkEnd = String.fromCharCode(0x3C, 0x2F, 0x74, 0x68, 0x69, 0x6E, 0x6B, 0x3E);
  const [START_THINKING_TOKEN_ID, END_THINKING_TOKEN_ID] = tokenizer.encode(
    thinkEnd,
    { add_special_tokens: false },
  );

  let state = "thinking"; // 当前状态：thinking(思考中) 或 answering(回答中)
  let startTime;
  let numTokens = 0;
  let tps;
  // 每生成一个 token 的回调：统计 token 数和 TPS（每秒生成 token 数）
  const token_callback_function = (tokens) => {
    startTime ??= performance.now();

    if (numTokens++ > 0) {
      tps = (numTokens / (performance.now() - startTime)) * 1000;
    }
    // 遇到思考结束标记，从思考阶段切换到回答阶段
    if (tokens[0] == END_THINKING_TOKEN_ID) {
      state = "answering";
    }
  };
  // 每段文本输出的回调：实时推送给主线程显示
  const callback_function = (output) => {
    self.postMessage({
      status: "update",
      output,
      tps,
      numTokens,
      state,
    });
  };

  // 文本流式输出器：边生成边输出，不用等全部完成
  const streamer = new TextStreamer(tokenizer, {
    skip_prompt: true,              // 不重复输出输入的 prompt
    skip_special_tokens: true,      // 跳过特殊 token（如 think 标签）
    callback_function,
    token_callback_function,
  });

  // 通知主线程：开始生成
  self.postMessage({ status: "start" });

  const { past_key_values, sequences } = await model.generate({
    ...inputs,
    // TODO: 修复后启用 KV Cache 复用
    // past_key_values: past_key_values_cache,

    // 采样参数
    do_sample: false,           // 贪心解码：每步选概率最高的 token
    // repetition_penalty: 1.1, // 重复惩罚
    // top_k: 3,                 // Top-K 采样
    // temperature: 0.2,         // 温度（越低越确定）

    max_new_tokens: 2048,       // 最多生成 2048 个新 token
    streamer,
    stopping_criteria,
    return_dict_in_generate: true,
  });
  past_key_values_cache = past_key_values;

  // 把完整的 token 序列解码成文本
  const decoded = tokenizer.batch_decode(sequences, {
    skip_special_tokens: true,
  });

  // 通知主线程：生成完成，返回最终结果
  self.postMessage({
    status: "complete",
    output: decoded,
  });
}

async function load() {
  self.postMessage({
    status: "loading",
    data: "Loading model...",
  });

  // 加载管道（tokenizer + model），并保存供后续使用
  const [tokenizer, model] = await TextGenerationPipeline.getInstance((x) => {
    // 进度回调：把模型下载进度转发给主线程显示
    self.postMessage(x);
  });

  self.postMessage({
    status: "loading",
    data: "Compiling shaders and warming up model...",// 编译 shader 并预热模型
  });

  // 用假输入跑一次模型，提前编译 shader（预热，避免首次推理卡顿）
  const inputs = tokenizer("a");
  await model.generate({ ...inputs, max_new_tokens: 1 });
  self.postMessage({ status: "ready" });
}

// 监听主线程发来的消息
self.addEventListener("message", async (e) => {
  const { type, data } = e.data;

  switch (type) {
    case "check":
      // 检测 WebGPU 支持
      check();
      break;

    case "load":
      // 加载模型
      load();
      break;

    case "generate":
      // 生成文本（先重置停止条件）
      stopping_criteria.reset();
      generate(data);
      break;

    case "interrupt":
      // 中断生成
      stopping_criteria.interrupt();
      break;

    case "reset":
      // 重置状态：清空 KV Cache 和停止条件
      past_key_values_cache = null;
      stopping_criteria.reset();
      break;
  }
});
