# 从 fetch 到 HTTP：一个 AI Native 开发者的前后端通信实战

## 引言

v014 学了 Coze 平台零代码搭建智能体——AI Agent、知识库、可视化配置。今天切换方向，回到技术底层，学了一件更基础的事：**前端怎么发 HTTP 请求，怎么和服务器通信。**

学习笔记来自 `ai/aigc/http-demo/readme.md`，内容围绕 LLM HTTP 接口展开。核心问题只有一个：**前端怎么调用后端 API？**

v014 是"AI 应用层"，v015 是"技术底层"。看似不相关，但有一个共同点：**不管用什么框架、什么平台，底层都是 HTTP 请求。** Coze 平台看起来是零代码，但它背后也是 HTTP 请求在和 LLM 服务器通信。

## 一、前端发送 HTTP 请求的两种方式

前端和服务器通信，本质上就是发 HTTP 请求。有两种主流方式：

### 1. fetch（推荐）

fetch 是现代浏览器原生提供的 API，基于 Promise，语法简洁：

```javascript
const response = await fetch('https://api.example.com/data');
const data = await response.json();
```

特点：
- **原生支持**：不需要引入第三方库
- **基于 Promise**：可以用 async/await
- **语法简洁**：两行代码搞定请求 + 解析

### 2. XMLHttpRequest（传统）

XMLHttpRequest 是更早期的方式，回调风格：

```javascript
const xhr = new XMLHttpRequest();
xhr.open('GET', 'https://api.example.com/data');
xhr.onload = function() {
  const data = JSON.parse(xhr.responseText);
};
xhr.send();
```

特点：
- **兼容性好**：支持所有浏览器
- **回调风格**：代码嵌套多，容易形成"回调地狱"
- **手动解析**：需要自己 JSON.parse

**实际开发中优先使用 fetch。** 除非需要兼容 IE（现在已经很少了），否则 fetch 是更好的选择。

## 二、编程模式：前后端分离

现代 Web 开发的主流架构是**前后端分离**：

### 架构类型

- **Browser/Server（B/S）**：浏览器直接访问服务器
  - 前端：HTML/CSS/JS，运行在浏览器
  - 后端：Java/Node.js/Python，运行在服务器
  - 通信：HTTP 请求

- **Client/Server（C/S）**：客户端访问服务器
  - 客户端：App（Android/iOS）
  - 后端：同上
  - 通信：HTTP 请求（或 WebSocket）

### 前后端分离的好处

- **独立开发**：前端专注 UI，后端专注逻辑
- **独立部署**：前端可以单独上线
- **接口复用**：同一个 API 可以给 Web、App、小程序用

### 异步编程：async/await

网络请求需要时间，不能阻塞主线程。所以用异步编程：

```javascript
async function fetchData() {
  // 1. 先等到请求完数据接口
  const response = await fetch('https://api.example.com/users');
  const users = await response.json();
  
  // 2. JSON 数组 => 字符串数组（map 方法）
  const names = users.map(user => user.name);
  
  return names;
}
```

关键点：
- **async**：声明函数是异步的
- **await**：等待 Promise 完成，拿到结果
- **执行流程**：先等到请求完，再处理数据

## 三、服务器基础概念

前端发请求，后端收请求。那"服务器"到底是什么？

### 硬件 vs 软件

- **硬件**：物理机器，放在机房里
- **软件**：运行在硬件上的程序（Java、Node.js 等）

### 网络定位

- **IP 地址**：唯一标识，如 `192.168.1.1`
- **域名**：好记的别名，如 `www.baidu.com`
- **DNS 解析**：将域名转换为 IP 地址
- **端口号**：区分同一服务器上的不同服务，如 `3000`、`8080`

访问 `http://127.0.0.1:3000`：
- `127.0.0.1`：本机 IP 地址
- `3000`：端口号，Node.js 服务默认端口

### 服务器收到请求后

1. 根据 IP 地址找到服务器
2. 根据端口号找到对应进程
3. 进程处理请求
4. 返回响应

## 四、API 请求规范

前端和后端通过 API 通信。API 有规范：

### URL/Endpoint

```
https://api.example.com/users
```

- `https`：协议
- `api.example.com`：域名
- `/users`：路径（endpoint）

### 请求方法

- **GET**：获取数据（查询）
- **POST**：提交数据（创建）
- **PUT**：更新数据
- **DELETE**：删除数据

### 请求头（Headers）

```javascript
headers: {
  'Content-Type': 'application/json',  // 数据格式
  'Authorization': 'Bearer xxx'        // 权限验证
}
```

### 请求体（Body）

```javascript
body: JSON.stringify({
  name: '张三',
  age: 25
})
```

## 五、async/await：控制异步执行流程

为什么需要异步？因为网络请求需要时间。

### 同步 vs 异步

```javascript
// 同步：阻塞，等请求完成才执行下一行
const data = fetchData();  // 假设需要 2 秒
console.log(data);         // 2 秒后才执行

// 异步：不阻塞，请求发出后继续执行
async function main() {
  const data = await fetchData();  // 等待 2 秒
  console.log(data);               // 拿到数据后执行
}
console.log('其他操作');            // 立即执行
```

### 实际应用

```javascript
async function getUsers() {
  try {
    // 1. 发送请求
    const response = await fetch('https://api.example.com/users');
    
    // 2. 检查响应状态
    if (!response.ok) {
      throw new Error('请求失败');
    }
    
    // 3. 解析 JSON
    const users = await response.json();
    
    // 4. 处理数据
    return users.map(user => ({
      name: user.name,
      email: user.email
    }));
  } catch (error) {
    console.error('错误:', error);
  }
}
```

## 六、从 HTTP 到 LLM 调用

v012 学过 JavaScript 调用 LLM（Node.js + OpenAI SDK）：
```javascript
const completion = await openai.chat.completions.create({
  messages: [{ role: 'user', content: '你好' }],
  model: 'gpt-3.5-turbo'
});
```

v014 学过 Coze 平台（可视化搭建 Agent）：零代码配置 Prompt + 知识库。

v015 学的 HTTP 请求是底层基础。不管用什么方式调用 LLM，底层都是 HTTP 请求：

```javascript
// 原始 HTTP 请求调用 LLM
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: '你好' }]
  })
});
```

**OpenAI SDK 只是封装了 HTTP 请求。** 理解了 HTTP，就理解了所有 API 调用的底层原理。

## 结语

今天学了三件事：
1. **fetch** 是现代前端的 HTTP 请求方式，比 XMLHttpRequest 更简洁
2. **前后端分离**是主流架构，前端专注 UI，后端专注逻辑
3. **async/await** 控制异步流程，让网络请求不阻塞主线程

v014 学了 AI 应用层（Coze 平台），v015 学了技术底层（HTTP 通信）。看似不相关，但有一个共同点：**从"会用工具"到"理解原理"。**

Coze 平台让你零代码搭建 Agent，但底层还是 HTTP 请求。理解了 HTTP，就理解了所有 API 调用的底层原理。这是 AI Native 开发者的基本功。

下篇见。
