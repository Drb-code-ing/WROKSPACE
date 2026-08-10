# v062 博客大纲

**标题**：WebGPU 端侧推理与单例模式：从 Transformers.js 把大模型装进浏览器，到 Worker 线程的流式对话  
**日期**：2026-08-10  
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源 |
| --- | --- | --- |
| 引言 | 从 React 性能优化跳到端侧 AI：浏览器里跑 1.5B 大模型 | 综合 |
| 一、模型从哪来 | HuggingFace 模型社区 + Transformers.js，选用 DeepSeek-R1-Distill-Qwen-1.5B | readme.md |
| 二、浏览器跑大模型 | 链路：模型发布 → transformers.js load → 下载到浏览器缓存 → webgpu 执行 NLP | readme.md |
| 三、两个依赖 | @huggingface/transformers（加载/推理）+ marked（Markdown→HTML） | readme.md / package.json |
| 四、Web Worker | new Worker + type:module，重活不卡 UI | App.tsx |
| 五、navigator.gpu 与 TS 类型 | `!!(navigator as any).gpu`、as 断言与 any 泛滥、@webgpu/types、tsconfig types 配置 | readme.md |
| 六、设计模式 | OOP 23 种模式、面向设计而不是实现、单例解决全局状态 | readme.md / singieton/readme.md |
| 七、单例实战 | Popup 静态属性 getInstance；TextGenerationPipeline 用 `??=` 懒加载 | singieton/index.html / work.js |
| 八、WebGPU 加载与流式生成 | q4f16 量化 + device:webgpu、progress_callback 上报、假输入预热、TextStreamer + TPS | work.js |
| 九、App.tsx 状态机 | useRef + useEffect 建 Worker、消息 switch 驱动 loading/ready/chat 三态 | App.tsx |
| 十、面试问答 | WebGPU、加载链路、Worker、TS 类型、单例、`??=`、流式输出 | 综合 |
| 结语 | 端侧 AI 的地基 + 检查清单 | 综合 |

## 核心结论

- 端侧推理链路：模型发布到 HuggingFace → Transformers.js `from_pretrained` 下载到浏览器缓存 → `device: "webgpu"` 用 GPU 执行 NLP，数据不出浏览器、离线可用；
- `@huggingface/transformers` 负责加载与推理，`marked` 把 LLM 返回的 Markdown 转成 HTML 展示；
- 模型加载/推理放在 Web Worker，主线程只收发消息、更新界面；
- `navigator.gpu` 是实验性 API，TS 类型缺失会报错：别到处 `as any`，装 `@webgpu/types` 并在 tsconfig `types` 配置补全；
- 单例模式：类全局只实例化一次，解决全局状态问题；`TextGenerationPipeline` 用 `??=` 懒加载 tokenizer/model，避免重复加载；
- 加载时 `progress_callback` 上报下载进度，用假输入预热编译 shader；生成用 TextStreamer 流式输出并统计 TPS。

## 引用说明

- 全部基于第五十四天提交 `c0bbacc`（ai/webgpu-deepseek/readme.md、deepseek-r1-webgpu/src/work.js、deepseek-r1-webgpu/src/App.tsx、singieton/readme.md 与 singieton/index.html）。
