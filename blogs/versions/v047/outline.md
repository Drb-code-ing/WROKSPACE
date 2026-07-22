# v047 大纲

## 标题
Workflow 与 Agent：确定性流水线 vs 不确定探索——AI 工程的双层能力

## 主题
第四十二天学习笔记 `ai/agent/concepts/workflow_agent/readme.md`：把 LangChain `.pipe()` / Coze 可视化编排上升为 Workflow 概念，并与 Agent 做清晰对照。核心结论：Workflow 是确定的执行，Agent 是不确定的探索；生产上常是「Workflow 骨架 + Agent 大脑」双层架构。

## 与相邻版本的边界
- **v029 / v034 / v042**：Agent 是什么、ReAct、Skills——本篇不重复六要素与实现细节。
- **v045**：Temperature / Top-K + LangChain pipe 初探——本篇不重复调参，只借用 pipe 作为 Workflow 入口例子。
- **v047（本篇）**：只做 Workflow vs Agent 概念对照、产业选型、双层架构。
- **不写**：WebGPU / React 组件（见 v044/v046/v048）。

## 核心线索
从已有 `.pipe()` 代码 → Workflow 定义 → 招聘简历流水线例子 → Agent 感知/决策/执行 → 高速公路 vs 司机 → 双层能力落地。

## 章节结构
1. 引言 — 提出「工作流也能干活，和 Agent 有何区别」
2. 一、从 `.pipe()` 重新认识 Workflow
3. 二、招聘简历 Workflow 完整例子
4. 三、Agent 的不同：开放空间与三能力
5. 四、对照表
6. 五、四个误区
7. 六、骨架 + 大脑双层架构
8. 七、与已有文章边界
9. 八、面试题
10. 结语

## 核心来源
- `ai/agent/concepts/workflow_agent/readme.md`
- （对照引用）`ai/temperature/t-demo/main.mjs` 的 pipe 片段

## 面试要点
- Workflow vs Agent 本质区别
- 节点含 LLM ≠ Agent
- 企业选型标准
- 双层架构（骨架/大脑）
- LangChain pipe 与 Coze 的关系
