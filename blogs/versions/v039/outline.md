# v039 大纲

## 标题
从等待到流式：LLM 流式输出的原理、协议与工程实践

## 主题
第三十五天学习——从 HTTP 协议层的 chunked transfer encoding，到 SSE（Server-Sent Events）的事件格式，再到 ReadableStream API 的客户端消费，逐层深入 LLM 流式输出的完整技术链路。不止于前端 fetch 调用，而是从服务端推理、协议选择、流式解析到生产级错误处理做一次系统性工程梳理。

## 核心线索
v038 解决了"模型不知道时怎么办"（RAG 检索增强），v039 回答另一个核心体验问题：**模型在生成时，用户怎么看到过程而不是干等结果？** 答案是把 token 生成变成一条水流，用 SSE 协议一根管子从服务端接到客户端，像打字机一样实时呈现。

## 章节结构

1. **引言** — 从"等待焦虑"到"打字机体验"，流式输出是 AI 产品的第一个关键用户体验
2. **一、为什么需要流式输出** — 推理耗时的本质（Transformer 自回归解码），感知性能 vs 实际性能
3. **二、HTTP 协议层：流式传输的基建** — Content-Length vs Transfer-Encoding: chunked，HTTP 长连接与分块传输
4. **三、SSE 协议深度解析** — data: 前缀、[DONE] 终止标记、事件边界、Content-Type: text/event-stream，SSE vs WebSocket vs 轮询的工程决策
5. **四、服务端：LLM 如何 token-by-token 生成** — 自回归解码原理、stream: true 参数、服务端如何逐 token 写入响应流
6. **五、客户端：ReadableStream 的工程化消费** — getReader()、TextDecoder、buffer 管理、断行解析、JSON 增量拼接
7. **六、生产级进阶** — AbortController 取消、错误重试与断点续传、backpressure、HTTP/2 多路复用对流式的影响
8. **七、流式输出在 AI 应用架构中的位置** — 不只是 chatbot，Agent 工具调用、RAG 检索结果、MCP 通信中的流式模式
9. **八、面试要点汇总** — 从协议层到应用层的完整面试题库
10. **结语** — 流式输出不是前端特效，而是一条贯穿 HTTP 协议、LLM 推理和用户体验设计的工程链路

## 核心代码

- stream-demo/src/App.vue：Vue 3 + fetch + ReadableStream 流式消费 DeepSeek API
- readme.md：流式输出概念笔记，涵盖 SSE 协议、stream 参数、客户端 buffer 解析

## 面试要点

- HTTP 分块传输编码（Transfer-Encoding: chunked）的工作原理
- SSE 协议格式：data: 前缀、事件分隔、[DONE] 标记
- ReadableStream API：getReader、read()、TextDecoder 的 stream 模式
- buffer 管理的必要性：流数据可能从 JSON 中间截断
- SSE vs WebSocket vs 长轮询的适用场景与取舍
- LLM 自回归解码与流式输出的关系
- AbortController 与流式请求的取消
- 流式输出中的错误处理与重连策略

## 情感线
从面对"转圈等待"的焦虑，到理解 token 像水流一样从服务端流向客户端——流式输出不只是技术方案，更是从"结果导向"到"过程可见"的产品思维转变。AI 产品的好坏，往往在第一个 token 出现之前就已经决定了。
