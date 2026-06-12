# v024 博客大纲

**标题**：AJAX 与 HTTP 底层机制：一个 AI Native 开发者的前后端通信原理理解
**日期**：2026-06-12
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源笔记 |
|------|------|---------|
| 引言 | 回顾 v023（Bun RESTful API），引出从现代工具链回到 Node.js 底层——理解底层机制 | 综合 |
| 一、JSON.stringify | 序列化的三个参数（value/replacer/space），前后端通信的数据打包 | backend/ajax/readme.md |
| 二、CommonJS 模块化 | require + module.exports vs ESM import/export，Node.js 早期模块方案 | backend/ajax/backend/index.js |
| 三、http 模块 | http.createServer、伺服状态、req/res 对象、listen 端口监听 | backend/ajax/backend/index.js |
| 四、响应头 | CORS（Access-Control-Allow-Origin）、Content-Type（JSON + UTF-8） | backend/ajax/backend/index.js |
| 五、路由 | req.url 路径匹配，if 判断的本质，框架只是 DSL 包装 | backend/ajax/backend/index.js |
| 六、完整后端代码走读 | 从 require 到 listen，逐行解读后端服务器 | backend/ajax/backend/index.js |
| 七、前端 AJAX：XMLHttpRequest | XHR 是 fetch 的前辈，Web 2.0 基石，open/send/onreadystatechange | backend/ajax/frontend/index.html |
| 八、DOM 动态渲染 | JSON.parse 反序列化 → innerHTML 动态渲染，数据到页面的最后一公里 | backend/ajax/frontend/index.html |
| 九、JS 异步处理 | Event Loop、callback → Promise → async/await 三阶段演变 | backend/ajax/readme.md |
| 结语 | 前后端通信的完整链路，会用+理解=真正掌握 | - |
