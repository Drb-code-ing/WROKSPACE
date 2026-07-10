# Debug Session: map-tool-hang

Status: [OPEN]

## Symptom
运行 `src/mcp-test.mjs` 后，终端输出“第1次迭代 / 工具调用：maps_geo”并停止继续输出。

## Hypotheses
1. 高德 MCP 的 HTTP 工具调用未返回。
2. `maps_geo` 的输入参数不符合服务端预期。
3. 高德工具已返回，但 Agent 对工具返回值的处理未完成。
4. MCP 客户端中其他 Server 的初始化或通信影响了本次调用。

## Evidence
待收集。
