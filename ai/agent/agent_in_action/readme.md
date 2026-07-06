# Agent

最值钱的agent开发
如何打造自己的agent?

## 不是直接调用大模型接口
llm 有些问题
- 你上周和它聊过的消息,它能记住吗?
  llm stateless
  数据库 前端存储 redis
  llm + 后端
  Memory 模块
- 让llm 帮访问一个网页,做一些事情,llm 只能告诉你思路 让我们自己做
  Tool Use 模块
- 访问内部私有文档 llm 不知道
  RAG 模块
- 最新的世界杯新闻，不在训练数据中
  MCP(第三方Tool，llm 协议) Tool
- 做ppt，分析股市并自动买卖
  skills 技能 蒸馏

Agent 就是围绕以上问题 给llm 加上Memory记忆模块，Tool工具调用能力，RAG，MCP，skills 等
Agent = llm + Memory + Tool + RAG + MCP + skills

Claude Code, Codex Coding Agent
小龙虾，Manus 自动化任务

## Agent 工作流程
 user 以prompt 的形式提出一个任务(复杂) 交给Agent 智能体
 llm planing / Reasioning(规划，推理) -> 要不要加载memory -> 有必要调用工具(分步骤多个工具) -> RAG(查询出来的内容 Prompt Template)
 -> response -> user(任务完成)

## Agent 开发框架 Langchain
node(nest.js) + langchain(单智能体开发框架) + langgraph(多智能体开发框架)

结合后端技术，开发AI 全栈Agent产品，让AI技术通过Harness Engineering 落地，实现AI技术的商业价值(FDE)

Agent 其实也不复杂，llm本身也可以思考，规划，给它用Tool 扩展能力，能自己做事情了，用memory 管理记忆能力，就能记住之前的事情了

这样一个知道内部知识、能思考、规划，能够帮你做事情的扩展后的大模型，就是一个Agent
- nest.js
- langchain
- langgraph
- MCP\RAG\Skill

## langchain
- LLM
  统一且兼容 chatOpenAI 
  @langchain/openai
  按需加载的llm 模型
- Tool
  langchain 又来接管 @langchain/core zod 验证工具
  tool openai 接口 里有描述和格式的约束
  - 2个部分 （异步）处理函数
    函数描述对象
    description 详细功能，覆盖场景
    schema 参数约束 tool 与 llm 要调用此工具，必须提供此参数
  - tool 的返回格式
    - llm有自知之明，当要调用工具的时候，不生成，停下来告诉用户tool_call 要调用的工具列表
      id, name, argument 多个工具id 关联等下tool 函数调用结果 需要历史会话列表才能组成完整的任务上下文
      llm 基于自然语言

## llm TOOL 性能优化
 - llm 任务复杂 可能调用多个tool，或每个tool 调用多次
 - Promise.all static方法 **并行调用** 多个Promise，等待所有Promise 都完成，才返回结果
 - Promise ES6提供的异步语法 三种状态
   - Pending 等待中...
   - resolved() 成功 Pending -> Fullfilled
   - rejected() 失败 Pending -> Rejected
   状态只能从Pending 变化到Fullfilled 或 Rejected 之一，而且不能再变化
   - async/await ES8 最优雅的异步变同步的语法
   - Promise.all([promise数组]) 并行执行多个Promise，等待所有Promise 都完成，才返回结果，结果顺序与promise数组顺序一

   即将打造高性能的第一个Agent