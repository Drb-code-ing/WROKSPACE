# v044 大纲

## 标题
浏览器端侧AI推理：DeepSeek R1 WebGPU 实战——从 React 组件化到 Transformers.js 浏览器内模型加载

## 主题
第四十天学习 React + TypeScript + WebGPU 端侧模型部署——基于 `fe/React/deepseek-r1-webgpu/webgpu-demo` 实践（React 19 + Vite + Tailwind CSS + Transformers.js + ONNX Runtime Web），系统梳理：端侧AI vs 云端API的架构抉择、WebGPU 浏览器加速原理、React Hooks 状态驱动 UI 范式、Tailwind 原子化 CSS 工程哲学、JSX 模板语法本质，以及一条"用户打开浏览器→模型下载→本地推理→离线可用"的完整链路。

## 与相邻版本的边界
- **V039**：流式输出的客户端视角——SSE 协议、ReadableStream。
- **V042**：Agent Skills 的能力封装与治理。
- **V043**：流式输出的架构视角——BFF 层引入、演进与生产化。
- **V044（本篇）**：端侧AI推理——浏览器内运行 LLM 的完整链路。从 React 组件化思维、Tailwind 原子化CSS、到 WebGPU 加速原理与 Transformers.js 模型加载。不重复 SSE/BFF 话题，聚焦"端侧推理"这一新范式。
- 不重复 v039 的 SSE 协议细节、不重复 v043 的 BFF 架构。专注于浏览器端侧模型部署的全流程。

## 核心线索
一条"从云端到端侧"的范式迁移线：过去调 DeepSeek API → BFF 代理保安全 → 现在模型直接在浏览器里跑。Day 40 的学习笔记通过一个 WebGPU Demo 项目，覆盖了端侧 AI 推理的完整技术栈：React + TS 组件化、Tailwind 原子CSS、WebGPU 浏览器 API、Transformers.js 模型加载、ONNX Runtime Web 推理引擎。前端工程师不再只是"调 API 的人"——他们变成了"在用户设备上运行 AI 模型的人"。

## 章节结构

1. **引言** — v043 把模型藏在 BFF 后面，v044 把模型搬到浏览器里：端侧推理是 AI 应用架构的又一次范式跃迁
2. **一、端侧AI vs 云端API：一场架构抉择** — 成本、安全、延迟、离线四大维度的对比。Ollama 本地部署 → 浏览器端推理的演进路线
3. **二、项目骨架：React + TypeScript + Vite 技术栈选型** — 为什么 AI 时代前端首选这套组合？React vs Vue 在大型项目中的差异
4. **三、Tailwind CSS：原子化 CSS 的工程哲学** — Vite 插件原理、className 而非 class 的 JSX 原因、原子类语义化编程与 Vibe UI
5. **四、React 组件化：数据驱动 UI 的核心范式** — useState、useEffect、组件生命周期、JSX 模板语法本质。从 DOM 编程到状态声明式的思维转变
6. **五、WebGPU：把 GPU 能力带进浏览器** — navigator.gpu 检测、WebGPU vs WebGL、浏览器 GPU 加速原理、ONNX Runtime Web 的角色
7. **六、Transformers.js：HuggingFace 模型的前端加载方案** — Transformers.js 架构、DeepSeek-R1-Distill-Qwen-1.5B 模型介绍、蒸馏与 Reasoning 能力
8. **七、完整链路：从浏览器打开到离线推理** — 模型下载 → ONNX Runtime Web 加载 → WebGPU 推理 → 全离线可用。一行代码都不发到服务器
9. **八、端侧AI 的应用场景与局限** — 手机端、车载端、Agent 任务划分、小参数模型的适用边界
10. **九、从"调 API 的前端"到"跑 AI 的前端"：前端工程师的能力跃迁** — 技术栈全景图、学习路径
11. **十、面试题库** — 端侧AI 定义、WebGPU 原理、Transformers.js、React Hooks、Tailwind 工程化
12. **结语** — 当模型跑到浏览器里，前端不再是 AI 的"外壳"，而是 AI 的"宿主"

## 核心来源
- `fe/React/deepseek-r1-webgpu/readme.md`：端侧模型概念、WebGPU、React+TS 选型、Tailwind 原理、JSX、组件化
- `fe/React/deepseek-r1-webgpu/webgpu-demo/src/App.tsx`：React 组件完整代码（useState、WebGPU 检测、条件渲染、错误处理、Tailwind 样式）
- `fe/React/deepseek-r1-webgpu/webgpu-demo/src/main.tsx`：React 入口渲染
- `fe/React/deepseek-r1-webgpu/webgpu-demo/src/index.css`：Tailwind CSS 导入
- `fe/React/deepseek-r1-webgpu/webgpu-demo/package.json`：依赖配置（React 19、Vite 8、TypeScript 6、@webgpu/types）
- `fe/React/deepseek-r1-webgpu/webgpu-demo/eslint.config.js`：ESLint 代码规范配置
- `fe/React/deepseek-r1-webgpu/webgpu-demo/index.html`：HTML 入口

## 面试要点
- 端侧AI vs 云端API 的架构权衡（成本、安全、延迟、离线）
- WebGPU 是什么，与 WebGL 的区别
- Transformers.js 与 ONNX Runtime Web 的分工
- React Hooks（useState、useEffect）的数据驱动 UI 思想
- Tailwind CSS 的原子化哲学与 className 原理
- JSX 的本质（JavaScript with XML，编译为原生 DOM 操作）
- 蒸馏模型（Distillation）与 Reasoning 模型的概念
- 浏览器端侧推理的离线能力与适用场景
- navigator.gpu 的 WebGPU 可用性检测
- 小参数模型在端侧的任务划分（手机端、车载端、Agent 子任务）

## 情感线
从"调 API 的前端"到"跑 AI 的前端"——当 15 亿参数的推理模型在浏览器里安静运行，不需要服务器、不需要 API Key、不需要网络请求，前端工程师的边界被彻底重画。端侧推理不是"替代云端"，而是在正确的场景选择正确的架构——就像十年前从服务端渲染走向前端 SPA，今天我们从"云端调模型"走向"浏览器跑模型"。
