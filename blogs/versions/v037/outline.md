# v037 大纲

## 标题
从工具调用到上下文编排：MCP Resource、多 Server 协作与远程工作流排障

## 主题
第三十三天学习——上篇补全 MCP Resource 的注册、读取与上下文注入；下篇把本地、远程和 npx 启动的 MCP Server 接入同一个 Agent，并如实记录一次尚未结束的远程工具排障。

## 核心线索
v036 解决“Agent 如何跨进程调用工具”，v037 继续回答两个问题：Server 如何向模型提供知识，多种 Server 如何组成可观察、可释放、可排障的真实工作流。

## 章节结构

1. **引言** — 从“工具已经跨进程”推进到“工具与资源如何共同组成上下文”
2. **一、MCP Resource** — registerResource、资源 URI、MIME 类型、Tool 与 Resource 的职责边界
3. **二、从 Resource 到 SystemMessage** — listResources、readResource、Object.entries、直接注入与 RAG 的边界
4. **三、从单 Server 到多 Server** — 本地自建、高德 HTTP、Chrome DevTools、FileSystem 四类能力的统一编排
5. **四、工程闭环** — 工具结果归一化、异常回传、ToolMessage 关联与 mcpClient.close 生命周期
6. **五、真实排障** — maps_geo 调用挂起的现象、假设和后续验证顺序，明确状态仍为 OPEN
7. **六、AI 工程化认知升级** — 从调用工具到编排上下文，从展示成功到保留失败证据
8. **结语** — Resource、多 Server 与可观测排障构成第三十三天的新增能力

## 核心代码

- my-mcp-server.mjs：registerResource 注册 docs://guide 静态资源
- langchain-mcp-test.mjs：listResources/readResource + Object.entries + SystemMessage 注入
- remote-mcp/src/mcp-test.mjs：四类 MCP Server 配置、工具结果适配、异常回传与连接关闭
- debug-map-tool-hang.md：未解决挂起问题的症状和假设记录

## 面试要点

- MCP Tool 与 Resource 的职责差异
- Resource 直接注入上下文与 RAG 检索的适用边界
- 本地 stdio、远程 HTTP 与 npx Server 在同一客户端中的生命周期管理
- 多工具工作流出现挂起时的隔离、超时、日志和逐层恢复策略

## 情感线
真正的工程能力不只体现在 Demo 跑通，也体现在失败发生时能留下证据、缩小变量并诚实标记未知。
