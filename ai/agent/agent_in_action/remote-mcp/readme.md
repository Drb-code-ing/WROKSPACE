# 远程 MCP

MCP 本质还是tool, 只不过还包了一层进程, 可以通过stdio 和 http 访问

## 应用场景
高德地图 Chrome DevTool  FileSystem

西安大唐不夜城(坐标点) 附近的酒店 amap  http
Chrome DevTool 打开网页 npx
FileSystem 写入本地文件 npx

AI 工作流

有了MCP 协议后，有个巨大的好处。
任何人都可以开发基于这个协议的MCP Server，然后可以直接复用。

- 高德MCP  可以做位置查询、路线规划等
  https://developer.amap.com/
- Chrome DevTool MCP 控制浏览器，打开关闭页面、点击元素、截图等
- FileSystem MCP 写入文件、创建目录