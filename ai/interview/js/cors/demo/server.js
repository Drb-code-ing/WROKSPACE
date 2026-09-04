// commonjs 老的 esm 新的
// module
const WebSocket = require('ws')
const http = require('http') // node 内置的http模块

// 先要启动http server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('WebSocket Server Running')
})
// 基于http server 启动websocket server
const wss = new WebSocket.Server({ server, path: '/ws' })
// 监听websocket 连接事件
wss.on('connection', (ws) => {
  console.log('websocket connected')
  // 每个客户端连接后才创建 ws 对象，消息监听必须挂在 connection 回调里
  // node ws 库服务端用 on('message')，data 直接是消息内容（不是浏览器的 event.data）
  ws.on('message', (data) => {
    console.log('websocket received message:', data.toString())
    ws.send('hello client')
  })
})

server.listen(8080, () => {
  console.log('http server is running at http://localhost:8080')
})