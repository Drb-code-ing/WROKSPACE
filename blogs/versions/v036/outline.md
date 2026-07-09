# v036 大纲

## 标题
从回调地狱到跨进程工具调用：Node.js 文件系统与 MCP 协议的工程实践

## 主题
第三十二天学习——上篇：Node.js path/fs 模块与异步进化史；下篇：MCP 协议与跨进程工具调用

## 核心线索
上篇从 path 路径处理到 fs 异步进化（同步→回调→Promise→async/await），下篇从工具局限性引出 MCP 协议（跨进程、跨语言、标准化）。两条线汇合：底层系统能力 + 上层协议标准 = AI Agent 的完整工具生态。

## 章节结构

1. **引言** — 第三十二天分上下两篇：上篇打系统基础，下篇建协议标准
2. **一、path 模块：路径处理的工程化基础** — join vs resolve 区别、dirname/basename/extname 等工具方法、工程化目录思维
3. **二、fs 模块：文件操作的异步进化史** — 同步阻塞的代价、回调地狱的成因、Promise.then 链式调用、async/await 语法糖
4. **三、JS 异步进化全景图** — 同步→异步回调→Promise→async/await 四阶段对比
5. **四、MCP 协议：让工具跨进程、跨语言** — v035 工具的局限性、MCP 概念与价值、stdio 与 HTTP 两种传输方式、MCP Server 实现、LangChain MCP Client 配置
6. **五、面试要点汇总** — path 模块 / fs 与异步 / MCP 协议 三大类
7. **六、AI 工程化认知升级** — 从单进程到跨进程、从语言绑定到协议标准
8. **结语** — 底层能力（path/fs）+ 上层协议（MCP）= Agent 工具生态的完整拼图

## 核心代码
- 1.mjs：path.join vs path.resolve 对比实验
- 2.mjs：path.dirname/basename/extname/normalize/parse 演示
- 3.mjs：fs 同步读取 + 回调地狱示例
- 4.mjs：fs/promises + async/await 优雅方案
- my-mcp-server.mjs：MCP Server 实现（注册 query_user 工具）
- langchain-mcp-test.mjs：LangChain MCP Client 配置

## 面试要点
- path：join vs resolve 区别、跨平台路径处理、工程化目录结构
- fs：同步 vs 异步适用场景、回调地狱解决方案、async/await 本质
- MCP：协议定位、stdio vs HTTP、与 LangChain tool() 的关系

## 情感线
今天是"从会用工具到理解工具"的一天——path/fs 是 Node.js 的基本功，MCP 是 AI Agent 的工业标准。两条线看似无关，实则都是"让工具更可靠、更通用"的工程追求。
