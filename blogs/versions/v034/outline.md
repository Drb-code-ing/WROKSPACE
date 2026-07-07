# v034 大纲

## 标题
Promise 与 LangChain 的完美结合：用 ReAct Loop 打造第一个编程助手 Agent

## 主题
第三十天学习——Agent ReAct 工作框架 + Promise 异步编程 + LangChain 工具调用循环（while + Promise.all）

## 核心线索
Promise 和 LangChain 的结合：Promise 解决"快"的问题（并行），LangChain 解决"对"的问题（类型安全 + 自动编排）

## 章节结构

1. **引言** — 从第二十九天的 PRD 到第三十天的"让 AI 自己写代码"
2. **Agent 与普通 AI 的差别** — 结构决定工作方式，自动终止条件
3. **ReAct 框架** — Reason → Act → Observe，竞品分析实战推演，Tool Use 是核心
4. **Promise 基础** — 三种状态、Promise.all 并行、async 函数本质
5. **LangChain 核心概念速览** — ChatOpenAI、tool()、bindTools()、四种 Message
6. **核心实战** — Promise.all 驱动 Agent 的并行工具调用（三层深度解析）
7. **向 Claude Code 看齐** — Node child_process、编程 Agent 蓝图
8. **AI 工程化思维** — 目录结构、四层抽象
9. **结语** — ReAct 是心跳、Promise × LangChain 是引擎、从学概念到造轮子

## 核心代码
- tool.mjs 完整 ReAct 循环（while + Promise.all + ToolMessage）
- Node child_process spawn 概念
- Promise 状态机与 Promise.all 时序图

## 情感线
从"学概念"到"造轮子"：今天的 while 循环、Promise.all 并行、ToolMessage 关联——这些不是知识点，是手艺。
