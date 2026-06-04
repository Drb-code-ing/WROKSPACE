# v015 大纲

## 标题
从 fetch 到 HTTP：一个 AI Native 开发者的前后端通信实战

## 结构

### 引言
- v014 学了 Coze 平台零代码搭建智能体（AI Agent + 知识库）
- v015 切换到技术底层：理解 HTTP 请求和前后端通信
- 核心观点：不管用什么框架、什么平台，底层都是 HTTP 请求
- 学习笔记来自 ai/aigc/http-demo/readme.md

### 一、前端发送 HTTP 请求的两种方式
- **fetch**：现代浏览器原生 API，基于 Promise
- **XMLHttpRequest**：传统方式，回调风格
- 对比：fetch 更简洁、更现代，XMLHttpRequest 兼容性更好
- 实际开发中优先使用 fetch

### 二、编程模式：前后端分离
- **Browser/Server 架构**：浏览器直接访问服务器
- **Client/Server 架构**：客户端（App）访问服务器
- **前后端分离**：前端负责 UI，后端负责数据，通过 API 通信
- 异步编程：async/await 控制执行流程
  - 先等到请求完数据接口
  - JSON 数组 => 字符串数组（map 方法）

### 三、服务器基础概念
- **硬件**：物理服务器
- **软件**：运行在服务器上的程序（Java、Node.js 等）
- **IP 地址**：唯一标识，定位服务器
- **域名**：好记的别名（如 www.baidu.com）
- **DNS 解析**：将域名转换为 IP 地址
- **端口号**：区分同一服务器上的不同服务（如 3000、8080）

### 四、API 请求规范
- **URL/Endpoint**：API 的访问地址
- **请求方法**：GET（获取）、POST（提交）、PUT（更新）、DELETE（删除）
- **请求头**：Authorization（权限验证）、Content-Type（数据格式）
- **请求体**：发送的数据（JSON 格式）

### 五、async/await：控制异步执行流程
- 为什么需要异步：网络请求需要时间，不能阻塞主线程
- async/await 语法：让异步代码看起来像同步
- 执行流程：先等到请求完成，再处理数据
- 实际应用：fetch + async/await + JSON 解析

### 六、从 HTTP 到 LLM 调用
- v012 学过 JavaScript 调用 LLM（Node.js + OpenAI SDK）
- v014 学过 Coze 平台（可视化搭建 Agent）
- v015 学的 HTTP 请求是底层基础
- 不管用什么方式调用 LLM，底层都是 HTTP 请求

### 结语
- 三件事：① fetch 是现代前端的 HTTP 请求方式 ② 前后端分离是主流架构 ③ async/await 控制异步流程
- v014 学了 AI 应用层（Coze 平台），v015 学了技术底层（HTTP 通信）
- 从"会用工具"到"理解原理"：AI Native 开发者需要懂底层
- 下篇见。
