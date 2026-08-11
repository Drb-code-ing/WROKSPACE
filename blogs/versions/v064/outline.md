# v064 博客大纲

**标题**：WebGPU 端侧推理推进：??= 空值赋值、异步下载进度与思考/回答流式状态机  
**日期**：2026-08-11  
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源 |
| --- | --- | --- |
| 引言 | 开门见山：端模型从"能跑"到"好用"的工程推进——加载、进度、流式、区分思考与回答 | 综合 |
| 一、??= 空值合并赋值 | 只在 null/undefined 时赋值，false/0/"" 不触发；用于单例懒加载避免重复赋值 | readme.md / worker.js |
| 二、异步下载与进度回调 | from_pretrained 返回 Promise、大文件 chunk 慢慢到达、progress_callback 上报进度 | readme.md / worker.js |
| 三、Promise.all 并行等待 | tokenizer 与 model 两个 Promise 一起等，getInstance 返回两者 | worker.js |
| 四、Progress 组件 | formatBytes 格式化字节、percentage ??= 0 兜底、isNaN(total) 处理 | Progress.tsx |
| 五、KV Cache 多轮加速 | 缓存上一轮 key/value、跳过已计算前缀，TODO 未启用 | worker.js |
| 六、思考/回答状态机 | R1 的 think 标签、151648/151649 token、state 切换、TPS 统计、answerIndex 区分 | worker.js / App.tsx |
| 七、工程打磨 | StrictMode 移除（避免 dev 双创建）、useRef 类型化、消除级联渲染、textarea 自适应 | main.tsx / App.tsx |
| 八、面试问答 | ??= 与 ||=、下载进度、KV Cache、流式状态机、级联渲染 | 综合 |
| 结语 | 端模型体验工程化；检查清单 | 综合 |

## 核心结论

- `??=` 空值合并赋值：只在变量为 `null`/`undefined` 时赋值，`false`/`0`/`""` 等 falsy 值不会触发——与 `||=` 的区别，适合"首次初始化、后续复用"的单例懒加载；
- 端模型加载是异步下载：`from_pretrained` 返回 Promise，模型文件大、chunk 分块到达，通过 `progress_callback` 上报下载进度，主线程据此渲染进度条；
- `Promise.all([tokenizer, model])` 并行等待两个最贵的异步资源就绪；
- KV Cache：把上一轮的 key/value 缓存下来，多轮对话可跳过已算前缀加速生成（当前 TODO 未启用）；
- DeepSeek-R1 思考/回答状态机：模型输出被 `<think>…</think>` 包裹，编码出思考结束 token（151648/151649），在 `token_callback` 里检测到结束标记就把 `state` 从 `thinking` 切到 `answering`，UI 用 `answerIndex` 区分思考过程与最终回答；同时用 `numTokens/耗时` 实时算 TPS；
- 工程细节：移除 `StrictMode` 避免开发模式下 worker 双创建、`useRef<Worker | null>` 类型化、移除 effect 里重复的 `setTps(null)` 消除级联渲染、textarea 高度自适应。

## 引用说明

- 全部基于第五十五天提交 `06ec8e9`（"第五十五天 端模型webgpu 推进"）：
  - `ai/webgpu-deepseek/readme.md`（新增 load 段：??=、异步下载、进度回调）；
  - `ai/webgpu-deepseek/deepseek-r1-webgpu/src/worker.js`（原 work.js 重命名 + 全量中文注释）；
  - `ai/webgpu-deepseek/deepseek-r1-webgpu/src/App.tsx`（状态机注释、answerIndex、移除级联渲染）；
  - `ai/webgpu-deepseek/deepseek-r1-webgpu/src/components/Progress.tsx`（新增：formatBytes + ??= 兜底）；
  - `ai/webgpu-deepseek/deepseek-r1-webgpu/src/main.tsx`（移除 StrictMode）。
