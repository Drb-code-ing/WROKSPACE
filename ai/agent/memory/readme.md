# Memory 管理

Agent = LLM + Harness(tool + RAG + memory + ...)
个模型扩展Tool，不只是回答问题，干活
RAG，基于query 获取向量数据库的相关知识放入prompt
都依赖**Memory**

大模型是无状态的，基于上次的问答继续问，回答
之前已经通过chatMessage 数组？ 做了简单的Memory 管理

- 持久化
- 上下文窗口大小 200k ? 开销
- /compact /clear

Agent 执行流程 React、message 数组 -> Memory

上下文大小、开销、持久化
Memory 截断(slice(-4))、总结、检索
临时记忆
长期记忆

用InMemoryChatMessageHistory 来管理message，放到内存里
用addMessage 来添加HumanMessage, AIMMessage, ToolMessage
调用大模型，返回(AIMMessage) 直接添加到history
getMessages 来获取所有message 每个message 对象
HumanMessage/AIMMessage/ToolMessage, 实例 type content 等属性