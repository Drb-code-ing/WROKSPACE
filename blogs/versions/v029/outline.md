# v029 博客大纲

**标题**：从 LLM 到 Agent：一个 AI Native 开发者的智能体核心概念启蒙
**日期**：2026-06-17
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源笔记 |
|------|------|---------|
| 引言 | 回顾 v025-v028（多模态→Canvas→算法→CSS 3D），引出今天回归 AI 核心——Agent 概念 | 综合 |
| 一、Agent 是什么 | 智能体定义、Agent 工程师取代传统软件工程师、市面上的 Agent 产品（Cursor/Claude Code/Codex等）、Agent 能力公式 | ai/agent/concepts/readme.md |
| 二、LLM：Agent 的大脑 | LLM 只负责推理和生成、真正行动能力来自 Tools、大脑+工具+信息=Agent | ai/agent/concepts/readme.md |
| 三、Tools：Agent 的手和脚 | 为什么 LLM 需要工具、Tool Calling 机制、OpenAI tools 接口格式、函数描述的重要性 | ai/agent/concepts/readme.md + reason-demo/index.mjs |
| 四、Reasoning：LLM 是怎么"想"的 | reasoning_effort 推理深度、reasoning_content 思考过程、多轮对话 messages 结构 | ai/agent/concepts/readme.md + reason-demo/main.mjs |
| 五、实战：Tool Calling 全流程 | 股票查询 demo 逐行解读、tool 声明→LLM 推理→函数执行→结果返回→生成回答 | reason-demo/index.mjs + clint.mjs |
| 六、实战：Reasoning 深度体验 | 足球问答 demo、reasoning_content 输出、system prompt 设定角色 | reason-demo/main.mjs |
| 结语 | Agent 三要素总结、从 v025 到 v029 的 AI 线回顾、Agent 是 AI Native 开发者的终极方向 | - |
