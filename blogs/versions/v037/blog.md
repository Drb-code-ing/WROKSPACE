# 从工具调用到上下文编排：MCP Resource、多 Server 协作与远程工作流排障

## 引言

v036 已经解决了 Agent 如何跨进程调用工具。第三十三天继续增加三类能力：用 Resource 补充模型上下文，把多个 Server 组合进同一工作流，并为连接关闭和故障排查留下可验证的证据。

下半部分把“查找酒店候选、在浏览器中展示、再把结果写入文件”设为目标流程，但提交中的运行记录停在地图工具这一步。因此，酒店流程只是待验证的目标，不能当作已经完成的结果。

## 一、MCP Resource：让 Server 不只提供动作，也提供知识

### Tool 与 Resource 的职责边界

同一个 MCP Server 可以同时暴露 Tool 和 Resource，但二者解决的问题不同：

| 能力 | 回答的问题 | 典型内容 |
|------|------------|----------|
| **Tool** | Agent 能执行什么动作？ | 查询用户、地理编码、读写文件 |
| **Resource** | Agent 可以读取什么上下文？ | 使用指南、规则说明、静态文档 |

Tool 的重点是“执行”，Resource 的重点是“读取”。例如，本地 Server 已经有查询用户的工具，还可以再注册一份使用指南，让 Client 在调用工具前知道这项能力应该怎样使用。

```javascript
server.registerResource(
  '使用指南',
  'docs://guide',
  { description: 'MCP Server 使用指南', mimeType: 'text/plain' },
  async () => ({
    contents: [{ uri: 'docs://guide', mimeType: 'text/plain', text: '功能：提供用户查询等工具。使用：通过 MCP Client 读取本指南。' }],
  }),
)
```

这段注册代码包含四个关键点：

- `使用指南` 是资源名，供 Client 和开发者识别资源。
- `docs://guide` 是资源 URI，用来稳定定位并读取这份内容。
- `description` 与 `mimeType` 是资源元数据；这里声明内容是纯文本。
- 最后的异步回调负责返回资源，返回值中的 `contents` 是内容数组，每一项都带有自己的 `uri`、MIME 类型和正文。

因此，Server 不再只告诉 Agent“我能做什么”，还可以提供“使用这些能力前需要知道什么”。

## 二、从 Resource 到 SystemMessage：上下文注入的数据流

### 注册只是起点，读取后才进入模型上下文

Resource 不会因为注册就自动出现在消息列表里。当前学习代码走的是一条显式数据流：

```text
registerResource
  → listResources
  → Object.entries
  → readResource(serverName, resource.uri)
  → 拼接 resourceContent
  → SystemMessage
```

对应的 Client 代码如下：

```javascript
const resourcesByServer = await mcpClient.listResources()
let resourceContent = ''
for (const [serverName, resources] of Object.entries(resourcesByServer)) {
  for (const resource of resources) {
    const content = await mcpClient.readResource(serverName, resource.uri)
    resourceContent += content[0].text
  }
}
const messages = [new SystemMessage(resourceContent || '(无资源)'), new HumanMessage(query)]
```

`listResources()` 返回的是“Server 名 → 资源列表”的对象。当天在 `1.js` 中练习的 `Object.entries()` 正好把这个对象转换为可遍历的 `[key, value]`：这里的 `key` 是 `serverName`，`value` 是该 Server 的 `resources`。内层循环再使用 `readResource(serverName, resource.uri)` 逐项读取，把当前纯文本资源的内容拼进 `resourceContent`，最终放在用户问题之前，形成 `SystemMessage`。

### 直接注入与 RAG 的边界

**只有本地或自建、来源可信、内容经过审查的短静态 Resource，才适合直接注入 `SystemMessage`。** 例如已审核的使用指南、少量规则或固定约束，可以在每轮任务开始前一次性进入上下文，路径简单，也容易确认模型实际看到了什么。

**第三方 Resource 必须保留来源，并按不可信数据处理。** Client 至少要记录 Server 名、资源 URI 等来源信息，对内容做验证并与高优先级指令隔离；未经审查的第三方文本不能直接提升为 system 指令，否则其中的提示注入内容可能获得不应有的控制权。

**长文档或多文档集合更适合先做 RAG，但 RAG 不是安全过滤器。** RAG 解决的是“选哪些片段”的检索问题，被命中的内容仍可能包含恶意或错误指令。如果把所有内容无差别拼接进 `SystemMessage`，还会持续消耗上下文窗口并稀释相关信息。因此，Resource 是否注入既取决于规模与相关性，也必须经过独立的来源校验、内容审查和信任隔离。

## 三、从单 Server 到多 Server：本地与远程能力编排

### 四类 Server，一套 Client 配置

第三十三天的下半部分不再只连接一个本地 Server，而是尝试把四类能力交给同一个 `MultiServerMCPClient`：

| Server | 启动或连接方式 | 提供的能力 | 在目标流程中的角色 |
|--------|----------------|------------|----------------------|
| 本地 Node | `node` 启动本地脚本 | 用户查询 + 使用指南 Resource | 提供自建业务能力与上下文 |
| 高德远程 HTTP | 远程 HTTP | 地理编码、附近地点 | 生成位置与酒店候选 |
| Chrome DevTools | `npx` 启动 | 浏览器标签页、页面检查 | 展示并检查候选页面 |
| FileSystem | `npx` 启动，限定根目录 | 根目录内的文件操作 | 持久化流程结果 |

下面代码只是**文章中的脱敏学习示意与建议形式**，不是 Day33 提交源码的逐字现状，也不是可以直接复制的生产配置。Day33 提交源码曾把敏感连接参数硬编码；本文不回显这些内容，相关凭据应立即吊销或轮换，再迁移到环境变量或受管密钥系统。

```javascript
const mcpClient = new MultiServerMCPClient({
  localGuide: { command: 'node', args: ['./mcp-demo/my-mcp-server.mjs'] },
  amapMaps: { transport: 'http', url: process.env.AMAP_MCP_URL },
  chromeDevtools: { command: 'npx', args: ['-y', 'chrome-devtools-mcp@latest'] },
  filesystem: { command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()] },
})
```

即使采用这份脱敏形式，仍有三项启动与权限风险：

- 相对的本地脚本路径和 `process.cwd()` 都依赖启动目录，换一个入口启动就可能指向不同位置。生产代码应基于 `import.meta.url` 解析确定路径。
- `npx -y ...@latest` 没有锁定依赖版本，远端最新版本发生变化时，行为也会随之变化。生产环境应固定并验证精确版本。
- 把 `process.cwd()` 作为 FileSystem 根目录，可能开放超出任务需要的文件范围。生产环境应显式传入最小允许目录，并在启动前校验解析后的根路径与授权范围一致。

这份配置表达的是能力组合关系，而不是执行结果：

```text
地图候选 → 浏览器展示 → 文件持久化
```

酒店场景的目标是先通过地图能力得到候选，再让浏览器展示相关页面，最后按需写入文件。但提交中的运行记录停在地图步骤，没有留下浏览器展示或文件持久化的执行证据。

## 四、工程闭环：结果适配、异常可观察与资源释放

### 学习代码的基础适配不是完整安全加固

当前学习代码已经考虑了两类常见返回值：字符串，以及带 `text` 字段的对象；它也会捕获工具异常并把错误文本送回消息列表。下面按学习计划补上 JSON 兜底，忠实展示这一步的基础结果适配，但它只解决常见返回形态和错误可见性，不能称为完整的安全加固：

```javascript
let contentStr
try {
  const toolResult = await foundTool.invoke(toolCall.args)
  contentStr = typeof toolResult === 'string'
    ? toolResult
    : toolResult?.text ?? JSON.stringify(toolResult)
} catch (error) {
  contentStr = `工具 ${toolCall.name} 调用失败：${error.message}`
}
messages.push(new ToolMessage({ content: contentStr, tool_call_id: toolCall.id }))
```

这段基础适配让常见的字符串、`text` 对象和其他可序列化对象进入下一轮。`ToolMessage` 仍须携带原调用的 `tool_call_id`，模型才能把结果与请求对应起来；这项机制 v034 已经讲过，这里只负责沿用。

安全边界的问题在 `catch`：原始异常可能携带端点查询参数、本地路径、认证信息或请求细节，不能把 `error.message` 直接送进模型上下文，也不能原样写入普通日志。JSON 兜底同样只是结果形态适配，不会自动完成脱敏或信任校验。

下面是一个**精简的生产错误边界伪代码**。它用具体正则先清理常见敏感片段，完整异常只供受控调试链路使用；模型只接收稳定错误码、通用摘要和用于关联的 `errorId`：

```javascript
import { randomUUID } from 'node:crypto'

function redactDebugDetail(value) {
  return String(value)
    .replace(/([?&](?:key|token|secret|credential)=)[^&\s]+/gi, '$1[REDACTED]')
    .replace(/\bBearer\s+\S+/gi, 'Bearer [REDACTED]')
    .replace(/(?:[A-Za-z]:\\|\/)[^\s"'`]+/g, '[REDACTED_PATH]')
}

try {
  const toolResult = await foundTool.invoke(toolCall.args)
  // 正常结果仍按业务规则适配
} catch (error) {
  const errorId = randomUUID()
  const rawDetail = error instanceof Error
    ? error.stack ?? error.message
    : String(error)
  const controlledDebugRecord = {
    errorId,
    detail: redactDebugDetail(rawDetail),
  }

  // 伪代码：仅将 controlledDebugRecord 写入受访问控制、限期保留的调试日志
  messages.push(new ToolMessage({
    content: `工具调用失败：TOOL_CALL_FAILED（追踪号：${errorId}）`,
    tool_call_id: toolCall.id,
  }))
}
```

这里的正则只是精简示例，不是覆盖所有敏感格式的万能过滤器。生产日志还应采用字段白名单，默认丢弃不必要的请求头和请求正文；敏感详情只能在脱敏后进入受访问控制的调试记录，普通日志和模型上下文都只保留通用摘要。

### 连接关闭也属于业务流程

源文件在 `runAgentWithTools()` 运行后调用 `mcpClient.close()`，说明已经意识到本地进程和通信连接需要主动释放。但只把 `close()` 写在正常路径末尾，一旦中途抛出异常，释放逻辑就可能被跳过。更稳妥的结构是：

```javascript
try {
  await runAgentWithTools(query)
} finally {
  await mcpClient.close()
}
```

当 `try` 正常结束或抛错退出时，`finally` 都会执行清理调用；如果某个 `await` 一直 pending，仍需要超时或取消机制先让控制流离开 `try`。对于同时管理本地进程、npx 进程和远程连接的 Client，这不是收尾装饰，而是生命周期纪律。

## 五、真实排障：为什么 maps_geo 调用后挂起

### 当前事实：状态仍是 OPEN

调试记录中的现象非常具体：程序在第 1 轮打印工具调用 `maps_geo` 后不再出现后续输出。当前状态是 **OPEN**，Evidence 仍标记为待收集。现有材料只能证明“输出停在这里”，不能证明故障发生在哪一层。

### 四个假设都尚未验证

| 假设 | 可能观察点 | 当前结论 |
|------|------------|----------|
| 远程 HTTP 调用未返回 | `foundTool.invoke()` 是否一直 pending | 未验证 |
| 参数不匹配工具 schema | 模型生成的参数与工具声明是否一致 | 未验证 |
| 返回处理没有完成 | 工具是否已返回，以及返回值结构是什么 | 未验证 |
| 其他 Server 初始化或通信造成干扰 | 移除其他 Server 后现象是否变化 | 未验证 |

这里最重要的不是挑一个最像的原因，而是避免把假设写成结论。远程请求、模型参数、结果适配和多 Server 干扰处在不同层，必须通过缩小变量逐层区分。

### 下一步验证顺序

1. **直接调用 `maps_geo`**：先绕开完整 Agent 循环，观察工具调用本身能否返回。
2. **记录 schema 与实际参数**：保存工具声明以及本次传入参数，逐字段比对类型、必填项和名称。
3. **增加显式超时**：让“长时间无输出”变成可记录的超时错误，并标出超时发生在哪一步。
4. **只保留 AMap Server**：移除本地、Chrome DevTools 和 FileSystem 配置，验证最小连接组合。
5. **逐个恢复其他 Server**：在最小组合有明确结果后一次只增加一个 Server，观察是哪次恢复改变了现象。

这条顺序遵循的是“先验证单次调用，再验证参数和返回，最后验证组合干扰”。在这些实验产生新证据之前，`maps_geo` 挂起仍是一次尚未结束的排障。

## 六、AI 工程化认知升级

第三十三天的增量可以收束为三件事：

1. **Resource 让上下文成为显式能力。** Server 除了提供动作，也能发布可列举、可定位、可读取的知识；Client 再决定直接注入还是选择性检索。
2. **多 Server 让能力组合成为编排问题。** 本地业务、远程地图、浏览器和文件系统可以进入同一个 Client，但每一段链路都需要独立证据，目标流程不等于执行事实。
3. **排障证据与生命周期形成工程纪律。** 结果需要适配，异常需要回到可观察链路，连接需要在 `finally` 中释放；未知原因则应保持 OPEN，并通过最小实验逐步收敛。

这三项变化把关注点从“Agent 能否发起工具调用”推进到“上下文和能力如何组合，以及组合失败时如何留下证据”。

## 结语

第三十三天没有重新讲一遍工具调用，而是在 v036 的基础上补齐了三个新的工程维度：Resource 作为上下文入口，多 Server 作为能力编排单元，以及证据驱动的排障与生命周期管理。

其中最值得保留的不是一个看起来完整的演示，而是对边界的诚实标注：只有本地或自建、来源可信且内容经过审查的短静态 Resource 才可直接注入；第三方或未审查内容必须保留来源并隔离处理，长文档则应选择性检索；多 Server 可以表达目标链，但每一步都要由运行证据确认；`maps_geo` 的问题仍是 OPEN，就继续按隔离、超时和逐层恢复的顺序追查。

---

*本篇内容基于第三十三天学习笔记整理，重点记录 MCP Resource、多 Server 编排与一次尚未结束的远程工具排障。*
