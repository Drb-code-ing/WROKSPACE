# v033 博客大纲

**标题**：从概念到框架：用 LangChain 打造第一个 Agent
**日期**：2026-07-06
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源笔记 |
|------|------|---------|
| 引言 | 回顾 v029（Agent 概念）→ v030（Loop）→ v031（工程化）→ v032（Token/Embedding）。v032 沉到了 LLM 底层，今天带着底层认知回到应用层——用 LangChain 框架真正动手写 Agent | 综合 |
| 一、Agent 的完整图景 | Agent = LLM + Memory + Tool + RAG + MCP + Skills、LLM 四大短板及对应解决方案、为什么 Claude Code 不只是一个大模型 | ai/agent/agent_in_action/readme.md |
| 二、Agent 的工作流程 | Planner/Reasoning → Memory → Tools → RAG → Response、从用户提需求到任务完成的全链路 | ai/agent/agent_in_action/readme.md |
| 三、LangChain 框架：为什么需要它 | 技术栈（nest.js + langchain + langgraph）、原生 vs LangChain 对比、框架解决了什么问题 | ai/agent/agent_in_action/readme.md + hello-langchain/index.mjs |
| 四、LangChain 的核心抽象 | ChatOpenAI 统一接口、tool() + zod 定义工具、bindTools() 注册、HumanMessage/SystemMessage/ToolMessage/AIMessage | hello-langchain/tool.mjs + hello-langchain/package.json |
| 五、实战：Hello LangChain | 最简 demo——用 LangChain 调用 DeepSeek，invoke() 方法，与原生 OpenAI SDK 对比 | hello-langchain/index.mjs |
| 六、实战：文件读取 Agent | tool.mjs 逐行解读——定义工具→绑定模型→构建消息→调用 LLM→处理工具调用结果 | hello-langchain/tool.mjs |
| 七、Promise.all：让 Agent 快起来 | 串行 vs 并行性能对比、Promise 三种状态、async/await、Agent 多工具并行调用的实际应用 | hello-langchain/1.html + ai/agent/agent_in_action/readme.md |
| 结语 | Agent 六要素 + LangChain 框架 = 完整的 Agent 开发能力、从 v029 概念到 v033 框架的螺旋上升、FDE 技能树 | - |
