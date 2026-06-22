# v031 博客大纲

**标题**：从无状态到多智能体协作：一个 AI Native 开发者的 Agent 工程化实践
**日期**：2026-06-22
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源笔记 |
|------|------|---------|
| 引言 | 回顾 v029（Agent 核心概念）和 v030（Loop），引出今天的问题：Agent 的代码怎么写？多个 Agent 怎么协作？ | 综合 |
| 一、LLM 的无状态本质 | HTTP 无状态协议、每次请求独立、手动带 chatHistory、chatHistory 的三个问题（Token 增长、窗口限制、取舍权衡） | ai/agent/stateless/readme.md + index.mjs |
| 二、工程化思维的四级跃迁 | Prompt Engineering → Context Engineering → Loop Engineering → Harness Engineering，每一级包含上一级 | ai/agent/stateless/readme.md |
| 三、用 LangGraph 构建搜索 Agent | StateGraph/Node/Edge/State 核心概念、搜索 Agent 五步实现（初始化→判断→调用→构建→运行）、shouldContinue 条件路由、ToolNode 自动执行 | searchAgent.ts |
| 四、多智能体协作：Supervisor 模式 | TeamState 共享状态、角色映射与消息格式、Supervisor 节点（决策者）、专家节点（执行者）、路由函数、报告编译、完整协作流程图 | Coordinator.ts |
| 五、从单 Agent 到多 Agent 的思维跃迁 | 三个层次对比（无状态/单Agent/多Agent）、设计模式演进、分工的本质 | 综合 |
| 六、Agent 工程化的核心设计原则 | 约束输出格式、角色分离、共享状态独立推理、始终有刹车 | 综合 |
| 结语 | 从 v029 到 v031 的认知升级、Agent 工程化的终极目标 | - |
