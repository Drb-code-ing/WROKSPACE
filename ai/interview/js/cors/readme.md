# 跨域
- nginx 反向代理
  - 前端项目  index.html nginx
  - 发出请求 /api
  - :3001/
- vite + mockjs dev
- websocket
  后端sse  server-sent-events
  服务器**单向**流式输出
- jsonp json with padding
- cors 跨域资源共享(Cross-Origin Resource Sharing)

- http 之外的协议
  **单向**传输
  用户发起请求，服务器反馈，一般服务器是不可以主动向用户发送数据的
  server 伺服状态 等着

  **sse流式**，服务器可以不断地向浏览器推送数据
   响应头
  Content-Type: text/event-stream
  Cache-Control: no-cache// 不缓存
  Connection: keep-alive// 保持连接

  - websocket
    qq, wechat
    实时聊天
    **双工通信**，两边都可以发送数据，平等
    不再是http 那种 只有浏览器发送数据，服务器也可以
    在线状态

    Socket 实时通信，聊天，直播
    Client 端
    当它来到web端，WebSocket 协议
    抖音、哔哩哔哩、腾讯  弹幕

- ws 库
  websocket 协议 实现
  1XX 连接中
  2XX 成功
  3XX 重定向
  4XX 客户端错误
  5XX 服务器错误
- 基于事件机制 双向通信

websocket 协议可以跨域
跨域：不同域名，不同端口，不同协议 浏览器因为安全问题，同源策略，拦截请求
websocket 协议 不需要遵守同源策略，可以直接跨域通信

## websocket 双工 为何不用于llm 流式输出
一边输出一边生成，socket 也可以