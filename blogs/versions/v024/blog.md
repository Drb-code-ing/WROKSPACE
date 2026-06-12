# AJAX 与 HTTP 底层机制：一个 AI Native 开发者的前后端通信原理理解

## 引言

v023 用 Bun + TypeScript 搭建了第一个 RESTful Todo API——那是站在现代工具链的肩膀上看后端。

今天换个角度：**把 Bun 摘掉，把 TypeScript 摘掉。** 回到 Node.js 最原始的状态——用内置的 `http` 模块手写服务器，用最原始的 `XMLHttpRequest` 发请求。不是倒退，而是**理解底层**。

为什么？因为 Bun.serve、Express、Hono——这些框架本质上都是对 Node.js `http` 模块的封装。fetch API 本质上是对 `XMLHttpRequest` 的现代化包装。**理解了底层机制，上层框架就只是语法糖。**

今天学习的内容横跨前后端：后端用 CommonJS + http 模块搭服务器，前端用 XHR 发 AJAX 请求，中间通过 JSON 序列化传输数据。一条完整的 HTTP 通信链路，从底层搞清楚。

## 一、JSON.stringify：数据的"快递包装"

前后端通信，数据要能在网络上传输。JS 对象是内存里的数据结构，不能直接"塞进" HTTP 报文。需要**序列化**——把对象变成字符串。

```javascript
const todo = {
    id: 1,
    title: '过四六级',
    completed: false
}

// 序列化：对象 → JSON 字符串
const jsonStr = JSON.stringify(todo)
// '{"id":1,"title":"过四六级","completed":false}'
```

### JSON.stringify(value, replacer?, space?)

三个参数，各有用处：

| 参数 | 含义 | 常用值 |
|------|------|--------|
| `value` | 要序列化的对象 | JS 对象 |
| `replacer` | 取舍——控制哪些字段被序列化 | `null`（原样）或数组/函数 |
| `space` | 缩进空格数 | `2`（团队规范，可读性好） |

```javascript
// replacer = null：全部字段原样序列化
JSON.stringify(todo, null, 2)
// {
//   "id": 1,
//   "title": "过四六级",
//   "completed": false
// }

// replacer = ['id', 'title']：只序列化指定字段
JSON.stringify(todo, ['id', 'title'], 2)
// {
//   "id": 1,
//   "title": "过四六级"
// }
```

**后端用 `JSON.stringify()` 把数据打包发送，前端用 `JSON.parse()` 拆包还原。** 这就是 HTTP 通信中最基础的数据转换链路。

## 二、CommonJS：Node.js 的模块化基因

在写服务器之前，先搞清楚 Node.js 怎么组织代码。

```
早期前端 JS → 没有模块化 → <script> 标签顺序加载 → 全局变量污染

Node.js 出现 → CommonJS 模块化 → require + module.exports
           → ESM 升级版 → import + export default
```

### 两种模块化方案对比

| | CommonJS | ESM |
|---|---|---|
| **语法** | `require()` + `module.exports` | `import` + `export default` |
| **时代** | Node.js 早期方案 | ES6 标准升级版 |
| **加载时机** | 运行时动态加载 | 编译时静态分析 |
| **使用场景** | 老项目、Node.js 脚本 | 现代项目、TypeScript、Bun |

```javascript
// CommonJS 方式（今天的后端代码）
const http = require('http')  // 引入 Node.js 内置模块

// ESM 方式（v023 的 Bun 代码）
// import { serve } from 'bun'
```

**为什么今天学 CommonJS？** 因为 Node.js 生态里海量的老代码、npm 包、内部工具都用 CommonJS。你不可能永远只写新项目。理解 `require` 和 `module.exports`，才能读懂和维护存量代码。

## 三、http 模块：Node.js 的原生服务器

Bun 用 `Bun.serve()`，Node.js 用 `http.createServer()`。本质一样——创建一个 HTTP 服务，进入**伺服状态**。

### 服务器的本质：伺服状态

```javascript
const http = require('http')

http.createServer((req, res) => {
    // 用户服务函数 —— 每个请求都会触发这个回调
}).listen(5000, () => {
    console.log('server is running at http://localhost:5000')
})
```

**伺服状态**就是"持续监听，随时待命"。服务器启动后不会退出，而是无限循环等待客户端请求。有请求进来→执行回调→返回响应→继续等待。

```
客户端                          服务器（伺服状态）
  │                               │
  │  ──── GET /todos ──────────→  │  http.createServer 监听到请求
  │                               │  执行 (req, res) => {...}
  │  ←──── JSON 数据 ───────────  │  res.end(jsonStr)
  │                               │  回到等待状态
  │  ──── GET / ──────────────→  │  又一次触发回调
  │  ←──── "hello world" ──────  │
  │                               │  ...
```

### req 与 res：请求和响应的抽象

- **`req`（IncomingMessage）**——用户请求对象，包含 `req.url`（请求路径）、`req.method`（GET/POST）、`req.headers`
- **`res`（ServerResponse）**——响应对象，`res.setHeader()` 设置响应头，`res.end()` 结束响应并返回数据

```javascript
http.createServer((req, res) => {
    // req.url —— 用户访问的路径
    console.log(req.url)  // '/todos' 或 '/'

    // res —— 控制返回什么给用户
    res.end("hello world")  // 响应体 + 结束响应
})
```

> **`res.end()` 只能调用一次**——它标记 HTTP 响应的结束。调完再调会报错。

## 四、响应头：CORS 与 Content-Type

在返回数据之前，必须先设置好响应头——告诉浏览器"这个数据是什么、谁可以访问"。

### CORS：跨域资源共享

```javascript
res.setHeader('Access-Control-Allow-Origin', '*')
```

- **同源策略**：浏览器默认禁止跨域请求——`http://127.0.0.1:5500` 的前端不能直接访问 `http://localhost:5000` 的接口
- **CORS** 就是服务器告诉浏览器："我允许xxx来源访问我"
- `*` 表示允许所有域名（开发阶段图方便，上线后要收紧到具体域名）

### Content-Type：数据格式声明

```javascript
res.setHeader('Content-Type', 'application/json; charset=utf-8')
```

告诉浏览器两件事：
- `application/json` —— 返回的是 JSON 格式数据，不是 HTML
- `charset=utf-8` —— 编码是 UTF-8，中文不会乱码

**没有这个头会怎样？** 浏览器可能把 JSON 当纯文本渲染，中文可能变成乱码。

## 五、路由：最简单的路径匹配

```javascript
http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', 'application/json; charset=utf-8')

    // 路由匹配
    if (req.url === '/') {
        res.end("hello world")      // 根路径 → 纯文本
    }

    if (req.url === '/todos') {
        res.end(JSON.stringify(todos))  // /todos → JSON 数据
    }
}).listen(5000)
```

**路由的本质就是 `if` 判断 `req.url`。** v023 里 Bun 的路由是一堆 `if (req.method === 'GET' && url.pathname === '/todos')`，今天 Node.js 原生写法是一堆 `if (req.url === '/todos')`。

```
请求进来
  │
  ├── req.url === '/'      → res.end("hello world")
  ├── req.url === '/todos' → res.end(JSON.stringify(todos))
  └── 都不匹配              → 404（我们这个简易版没写）
```

框架（Express、Hono、Elysia）只是把这些 `if` 包装成了 `router.get('/todos', handler)` 的 DSL。理解了原生的 `if` 路由，框架就只是语法糖。

## 六、完整后端代码走读

把上面的知识串起来，就是一个完整的 Todo API 服务器：

```javascript
const http = require('http')

http.createServer((req, res) => {
    // 数据（暂时用内存数组）
    const todos = [{
        id: 1,
        title: '过四六级',
        completed: false
    }, {
        id: 2,
        title: '回家过节',
        completed: false
    }]

    // 响应头
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', 'application/json; charset=utf-8')

    // 路由
    if (req.url === '/') {
        res.end("hello world")
    }
    if (req.url === '/todos') {
        res.end(JSON.stringify(todos))  // 对象 → JSON 字符串 → 二进制流
    }
}).listen(5000, () => {
    console.log('server is running at http://localhost:5000')
})
```

```
CommonJS 引入模块 → 创建 HTTP 服务 → 准备数据 → 设置响应头 → 路由分发 → 序列化返回
     ↑                                                                    ↑
  require('http')                                                  JSON.stringify()
```

## 七、前端 AJAX：XMLHttpRequest —— fetch 的前辈

后端搭好了，现在看前端怎么请求数据。

### 为什么需要 AJAX？

传统网页交互模式：用户操作 → 整页刷新 → 等待 → 看到新页面。每一次交互都需要完整的 HTTP 往返，体验割裂。

**AJAX（Asynchronous JavaScript And XML）**改变了这一切：**JS 主动发起 HTTP 请求，拿到数据后动态更新页面，不刷新整页。** 这就是 Web 2.0 的基石。

### XMLHttpRequest：fetch 的前辈

```javascript
// 1. 创建 XHR 实例
const xhr = new XMLHttpRequest()

// 2. 打开一个 HTTP 通道
xhr.open('GET', 'http://localhost:5000/todos', true)
//                                      ↑ true = 异步 | false = 同步

// 3. 监听状态变化（回调函数 callback）
xhr.onreadystatechange = function() {
    if (xhr.status === 200 && xhr.readyState === 4) {
        // 请求成功，数据到手
        const todos = JSON.parse(xhr.responseText)  // JSON 字符串 → JS 对象
        console.log(todos)
    }
}

// 4. 发送请求
xhr.send()
```

### readyState：XHR 的生命周期

| readyState | 含义 |
|------------|------|
| 0 | UNSENT —— `open()` 还没调用 |
| 1 | OPENED —— `open()` 已调用 |
| 2 | HEADERS_RECEIVED —— 收到响应头 |
| 3 | LOADING —— 正在接收响应体（分块下载） |
| 4 | DONE —— 响应接收完毕 |

**`readyState === 4` 代表数据全部到手，`status === 200` 代表 HTTP 层面成功。** 两个条件都满足，才能安全使用 `responseText`。

### fetch：现代替代方案

```javascript
// 同样的功能，fetch 写法简洁太多：
fetch("http://localhost:5000/todos")
    .then(res => res.json())
    .then(data => console.log(data))
    .catch(err => console.log(err))
```

**fetch 就是 XHR 的现代化包装**——Promise 风格、链式调用、更易读。但 XHR 仍然值得学：理解底层机制、维护老代码、需要监听上传进度时 XHR 是唯一选择。

## 八、DOM 动态渲染：数据到页面的最后一公里

拿到了数据，怎么展示在页面上？

```html
<!-- 占位容器 -->
<ul id="Todos"></ul>

<script>
    const Todos = document.getElementById('Todos')

    const xhr = new XMLHttpRequest()
    xhr.open('GET', 'http://localhost:5000/todos', true)
    xhr.onreadystatechange = function() {
        if (xhr.status === 200 && xhr.readyState === 4) {
            const todos = JSON.parse(xhr.responseText)
            // 数据 → HTML 字符串 → 插入 DOM
            Todos.innerHTML = todos.map(t => `<li>${t.title}</li>`).join('')
        }
    }
    xhr.send()
</script>
```

**数据流的完整链路：**

```
服务器内存中的 JS 对象
    │ JSON.stringify()
    ▼
JSON 字符串（HTTP 响应体）
    │ 网络传输
    ▼
xhr.responseText（字符串）
    │ JSON.parse()
    ▼
前端 JS 对象
    │ todos.map(...).join('')
    ▼
HTML 字符串
    │ innerHTML =
    ▼
页面 DOM（用户看到的列表）
```

这个链路涵盖了前后端通信的全部核心动作：**序列化 → 传输 → 反序列化 → 渲染。**

## 九、JS 异步处理：从回调到 async/await

上面的 XHR 代码为什么不这样写？

```javascript
// ❌ 这样写拿不到数据
xhr.send()
console.log(xhr.responseText)  // undefined！send 还没返回
```

因为 **JS 是单线程的，异步任务不能阻塞主线程。** 网络请求需要时间（百毫秒到秒级），如果同步等待，整个页面会卡死。

### Event Loop：JS 的异步心脏

```
调用栈（Call Stack）
    │
    │  遇到异步任务（xhr.send、setTimeout、fetch...）
    │  丢到 Web API / Node.js API 去处理
    ▼
Event Loop
    │  异步任务完成后，回调进入任务队列
    │  调用栈清空后，从队列取回调执行
    ▼
回调执行
```

### 三种异步处理方式

```javascript
// 方式一：回调函数 callback（XHR 使用的方案）
xhr.onreadystatechange = function() {
    // 数据到了才执行这里的代码
}

// 方式二：Promise + then（fetch 使用的方案）
fetch(url)
    .then(res => res.json())
    .then(data => { /* 处理数据 */ })
    .catch(err => { /* 处理错误 */ })

// 方式三：async/await（最推荐的现代方案）
async function getTodos() {
    try {
        const res = await fetch(url)
        const data = await res.json()
        // 处理数据——看起来像同步代码！
    } catch (err) {
        // 处理错误
    }
}
```

| | callback | Promise | async/await |
|---|---|---|---|
| **可读性** | 回调地狱（嵌套太深） | 链式调用，比回调好 | 像同步代码，最清晰 |
| **错误处理** | 每个回调自己处理 | `.catch()` 统一捕获 | `try/catch` 原生语法 |
| **适用场景** | 老代码、事件监听 | 现代 API | **最推荐** |

**一句话总结异步演变史：** callback 是基础（XHR），Promise 是升级（fetch），async/await 是终极方案——用同步的写法写异步的代码。

## 结语

今天从底层搞清楚了前后端通信的完整链路——一条数据从服务器到浏览器经历了什么：

1. **JSON 序列化/反序列化** —— `JSON.stringify()` 打包，`JSON.parse()` 拆包。`replacer` 控制取舍，`space` 控制可读性
2. **CommonJS 模块化** —— `require` + `module.exports` 是 Node.js 早期的模块方案，ESM `import/export` 是现代升级版。存量代码大量使用 CommonJS，必须会读
3. **Node.js http 模块** —— `http.createServer` 是 Bun.serve 的底层原型。服务器本质是**伺服状态**——持续监听，请求到达→执行回调→返回响应→继续等待
4. **响应头** —— CORS（`Access-Control-Allow-Origin`）解决跨域，Content-Type 声明数据格式和编码
5. **路由** —— 本质是 `if` 判断 `req.url`。框架（Express/Hono/Elysia）只是 `if` 的 DSL 包装
6. **AJAX 与 XHR** —— `XMLHttpRequest` 是 fetch 的前辈。Web 2.0 的基石：JS 主动发请求，动态更新页面，不刷新整页
7. **readyState 生命周期** —— 0→1→2→3→4，`readyState === 4 && status === 200` 代表成功
8. **DOM 动态渲染** —— `innerHTML` + `map` + `join`，数据到页面的最后一公里
9. **JS 异步三阶段** —— callback（XHR）→ Promise（fetch）→ async/await（现代推荐）。理解 Event Loop 才能理解异步

v023 站在 Bun 的肩膀上看 RESTful API，**今天趴下来看底层**——Node.js 原生 http 模块怎么工作，XHR 怎么发请求，JSON 怎么序列化。v023 让你**会用**，今天让你**理解**。

**会用 + 理解 = 真正掌握。**

两条学习路线正式交汇：后端（http 模块、路由、CORS）+ 前端（XHR、DOM 操作、异步处理）+ 中间层（JSON 序列化、HTTP 协议）。全栈的"栈"就是这样一层层垒起来的。

下篇见。
