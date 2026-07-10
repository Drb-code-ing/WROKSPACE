# 第三十三天博客 v037 设计规范

## 背景与目标

基于 `112a486`（第三十三天学习 上）和 `6097c6a`（第三十三天学习 下）两个连续提交，新增独立博客版本 v037。文章只整理第三十三天相对 v036 的知识增量，不把此前已经发布的 MCP、ReAct、Promise 或 Node.js 子进程基础重复包装为新内容。

拟定标题：**从工具调用到上下文编排：MCP Resource、多 Server 协作与远程工作流排障**。

版本元数据：

- 版本：`v037`
- 日期：`2026-07-10`
- 学习日：`33`

## 内容边界

文章围绕一条增量工程主线展开：

1. MCP Server 通过 `registerResource()` 暴露资源，客户端通过 `listResources()` 与 `readResource()` 获取内容，再注入 `SystemMessage`。
2. 使用 `Object.entries()` 遍历 Server 与 Resource 映射；对象遍历练习作为实现细节融入 Resource 数据流，不单独扩写成无关章节。
3. 同一个 `MultiServerMCPClient` 编排本地自建 Server、远程 HTTP Server，以及通过 `npx` 启动的 Chrome DevTools 和 FileSystem Server。
4. 处理不同工具返回形态、把异常转换为可观察结果，并通过 `mcpClient.close()` 释放连接和子进程。
5. 如实记录 `maps_geo` 调用挂起：只描述现象、已有假设和下一步排查方向，不宣称远程酒店工作流已经跑通。

下列内容仅允许用一小段前情回顾承接，不再系统讲解：

- v036：MCP 定义、跨进程/跨语言价值、stdio 与 HTTP、`registerTool()`、`StdioServerTransport`、`MultiServerMCPClient` 基础配置。
- v035：Mini-Cursor、Node.js 子进程和工具容错。
- v034：ReAct 循环、`ToolMessage`、`tool_call_id` 与 Promise 工具调用。

## 文章结构

`blog.md` 采用仓库现有中文技术博客格式，不添加 YAML front matter：

1. `## 引言`：用 v036 的“工具跨进程”作为一句起点，提出第三十三天的新问题——工具之外，资源如何成为上下文，多种 MCP Server 如何组成工作流。
2. `## 一、MCP Resource：让 Server 不只提供动作，也提供知识`：解释 Resource 注册、URI、MIME 类型及 Resource 与 Tool 的职责差异。
3. `## 二、从 Resource 到 SystemMessage：上下文注入的数据流`：展示枚举、读取、拼接与注入过程，并说明直接注入与 RAG 的适用边界。
4. `## 三、从单 Server 到多 Server：本地与远程能力编排`：说明四类 Server 的连接拓扑和地图、浏览器、文件系统协作意图，不重复讲 stdio/HTTP 定义。
5. `## 四、工程闭环：结果适配、异常可观察与资源释放`：聚焦返回值归一化、错误消息和 `close()` 生命周期。
6. `## 五、真实排障：为什么 maps_geo 调用后挂起`：列出现象、未验证假设和排查顺序，明确状态仍为 OPEN。
7. `## 六、AI 工程化认知升级`：总结从“连接工具”到“编排工具与上下文”、从“演示成功”到“保留失败证据”的进阶。
8. `## 结语`：收束 Resource、多 Server 与可观测排障三条新认知。

代码片段只保留支撑上述增量主题的最小部分。任何第三方密钥、token、带凭据 URL 或 remote 凭据都用环境变量或占位符替代。

## 版本文件

实施时新增：

- `blogs/versions/v037/blog.md`
- `blogs/versions/v037/outline.md`
- `blogs/versions/v037/coverage.json`

同时更新：

- `blogs/CURRENT` 为 `v037`
- `blogs/manifest.json` 的 `versions` 尾部追加唯一 v037 条目

不补修 v008、v016、v021、v033、v035 的历史索引缺口，不修改两个现有未跟踪目录。

## 内容来源

`coverage.json` 与 manifest 只登记有实际学习内容的来源：

- `ai/agent/agent_in_action/mcp-demo/1.js`
- `ai/agent/agent_in_action/mcp-demo/readme.md`
- `ai/agent/agent_in_action/mcp-demo/my-mcp-server.mjs`
- `ai/agent/agent_in_action/mcp-demo/langchain-mcp-test.mjs`
- `ai/agent/agent_in_action/remote-mcp/readme.md`
- `ai/agent/agent_in_action/remote-mcp/src/mcp-test.mjs`
- `ai/agent/agent_in_action/remote-mcp/debug-map-tool-hang.md`

锁文件和 `.dbg` 环境文件不作为博客来源。

## 验证与提交

实施完成后执行以下验证：

- 以 UTF-8 解析 `manifest.json` 与 `coverage.json`。
- 断言 CURRENT、目录版本、coverage 和 manifest 均为 v037，且 manifest 中只有一个 v037 条目。
- 核对 `blog.md` H1、`outline.md` 标题、coverage 标题和 manifest 标题完全一致。
- 核对 coverage 与 manifest 的来源路径一致且全部存在。
- 检查文章没有敏感信息、没有把 OPEN 故障描述为成功、没有大段重复 v034–v036 内容。
- 执行 `git diff --check -- blogs`，暂存后再次检查 staged diff。

博客实施采用只包含五个博客路径的原子提交，提交信息沿用 `vNNN: <标题>` 格式。推送前确认 `origin/master` 没有新提交，最终只推送到 `origin/master`。
