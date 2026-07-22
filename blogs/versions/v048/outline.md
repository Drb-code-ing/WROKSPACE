# v048 大纲

## 标题
React 进度条组件的健壮性：props / state 分工、空值合并与受控输入

## 主题
第四十二天 WebGPU 补充提交（Progress 真实进度条、`??=`、formatBytes、input 受控 textarea、Enter 发送）。聚焦组件健壮性与数据所有权，不重复合成事件与组件树。

## 与相邻版本的边界
- **v044**：端侧 AI 架构、WebGPU / Transformers.js——本篇不重复。
- **v046**：DOM 事件演化、React 合成事件、组件树、为何抽 Progress——本篇不重复。
- **v048（本篇）**：Progress 健壮性、props vs state、受控输入与 TS 事件断言。
- **不写**：Workflow vs Agent（见 v047）。

## 核心线索
Progress 从占位到可用 → `percentage ??= 0` 与 formatBytes → state/props 分工 → 受控 textarea + Enter 发送 → 实践清单与面试题。

## 章节结构
1. 引言 — 明确只补「健壮性 / 数据分工 / 受控输入」
2. 一、这次迭代改了什么
3. 二、Progress：从占位到可用
4. 三、两种数据：state 与 props
5. 四、聊天输入框：受控组件
6. 五、放回组件化坐标
7. 六、实践清单
8. 七、面试题
9. 结语

## 核心来源
- `fe/React/deepseek-r1-webgpu/readme.md`
- `fe/React/deepseek-r1-webgpu/webgpu-demo/src/components/Progress.tsx`
- `fe/React/deepseek-r1-webgpu/webgpu-demo/src/App.tsx`

## 面试要点
- props vs state
- `??=` 空值合并赋值
- 受控组件
- TypeScript 事件 target 断言
- 展示组件是否应自持业务进度 state
