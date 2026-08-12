# v066 博客大纲

**标题**：WebGPU 端侧模型推理生成：聊天模板、think 标记 token 化与可中断的流式对话  
**日期**：2026-08-12  
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源 |
| --- | --- | --- |
| 引言 | 开门见山：模型加载之后，推理生成这一段——消息如何变成回答、为什么能停、为什么分两段 | 综合 |
| 一、聊天模板 | messages 数组经 apply_chat_template 排版成 ChatML 文本；add_generation_prompt 追加 assistant 开头；模板由训练定死 | worker.js |
| 二、输入张量 | return_dict 返回 input_ids（token id 序列）与 attention_mask（忽略 padding），可展开传给 generate | worker.js |
| 三、think 标记 token 化 | 从 fromCharCode 拼 `</think>` 改为 encode("<think></think>")；编码结果是按序 token 数组；add_special_tokens:false | worker.js |
| 四、生成的两个阶段 | thinking/answering 状态、token 回调切状态、TPS 统计；状态机随流式实时走 | worker.js |
| 五、可中断生成 | InterruptableStoppingCriteria 每 token 前检查；interrupt() 置位、next 边界优雅停住；generate 前 reset() | worker.js |
| 六、KV Cache | 多轮对话重算 KV 是大量算力消耗；messages 变长但前缀 KV 不变；TODO 未启用先保正确 | worker.js |
| 七、流式输出 | TextStreamer skip_prompt/skip_special_tokens；sequences 整体 batch_decode 出最终结果 | worker.js |
| 八、面试问答 | 聊天模板、add_generation_prompt、两个张量、think 标记编码、中断机制、KV Cache、skip_* 开关 | 综合 |
| 结语 | 一条消息到一段输出的完整管线；检查清单 | 综合 |

## 核心结论

- 端侧对话的输入管线：`messages` 数组 → `apply_chat_template` 按训练模板（ChatML）排版成文本 → `add_generation_prompt: true` 追加 `<|im_start|>assistant\n`（决定模型开不开口）→ `return_dict` 产出 `input_ids` + `attention_mask`；
- `input_ids` 是模型吃的 token id 序列，`attention_mask` 用来忽略 padding 占位 token；两者展开即可传给 `model.generate`；
- **think 标记编码修复**：`tokenizer.encode` 返回按文本顺序排列的 token id 数组。只编码 `</think>` 时拿不到开始 id，把 `<think></think>` 一起编码可一次解构拿齐 `[开始 id, 结束 id]`；且要 `add_special_tokens: false` 避免 BOS/EOS 挤乱位置；
- 推理模型输出分两段：思考（thinking）→ 回答（answering），在 token 回调里检测 `END_THINKING_TOKEN_ID` 切状态，状态随流式消息实时推给主线程；
- 中断是协作式的：`InterruptableStoppingCriteria` 在每生成一个 token 前被检查，`interrupt()` 置位后在下一个 token 边界优雅收尾，已生成文本保留；新生成前必须 `reset()`；
- KV Cache：每轮对话重算 KV 是大量算力消耗，messages 变长但前缀 KV 不变，缓存后可跳过已算部分；当前 TODO 未启用，先保证正确再谈性能；
- 流式输出：`TextStreamer` 的 `skip_prompt`（不重复输入）与 `skip_special_tokens`（think 标签不上屏），最终结果用 `batch_decode(sequences)` 一次性解码。

## 引用说明

- 全部基于第五十六天提交 `a41ff92`（"第五十六天学习 端模型webgpu 推进 模型推理生成"）：
  - `ai/webgpu-deepseek/deepseek-r1-webgpu/src/worker.js`（聊天模板注释、think 标记编码修复、两段生成、可中断停止条件、KV Cache 注释、流式输出注释）。
