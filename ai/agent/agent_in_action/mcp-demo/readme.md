# MCP

 - 这里的tool 有什么问题？
   1. 只能在我们这个项目用
   2. node 写的，如果java/python/rust 写的tool呢？

 tool 独立于llm，本地/远程 跨进程、跨语言可用

## MCP 协议
 Model Context Protocol
 - 标准化llm 与tool 和资源之间的通信
   llm 和 tool 解耦
 - 基于stdio 标准输入输出流，键盘输入输出，当一个进程(agent)
   调用一个子进程(node_child_process)或其他语言进程时，可以通过stdio 标准输入输出流进行通信
 - http 远程通信MCP 掌管

 不管是本地工具还是远程工具，agent 想**跨进程**调用某个工具，通过MCP 协议就行
 是给Model 扩展Context 上下文，让它能做的更多(tool)，知道的更多(resource)的Protocol 协议

 ## MCP 特点
  MCP 最大的特点就是**跨进程**调用工具
  跨本地的进程调用，就是stdio
  跨远程的进程调用，就是http
  
  AI Agent 是MCP客户端（host），
  可以通过MCP协议调用各种MCP Server，client 配置添加，实现**跨进程**工具调用
  它和fetch 不同 不是接口调用，它是要扩展 Context（tool&resource）