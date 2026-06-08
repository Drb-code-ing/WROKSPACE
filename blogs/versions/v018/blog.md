# Bun 与 TypeScript：一个 AI Native 开发者的后端基础设施升级

## 引言

v017 学了用 Prompt 做 NLP 任务——情感分类、信息提取、文本总结，用 DeepSeek API 把 LLM 变成生产力工具。但当时调用 API 用的是 OpenAI 的 Node.js SDK，封装在 `client.mjs` 和 `completion.mjs` 里。

今天换个角度，不封装了——**直接手写 HTTP 请求**，用 axios 发 POST 请求调 LLM。同时补两个基础：**Bun（下一代 JS 运行时）** 和 **TypeScript（类型安全的 JS 超集）**。

简单说就是：从"用什么调 API"深入到"怎么调 API"，顺便把工具链升级一下。

## 一、Bun：比 Node.js 更快的 JS/TS 运行时

### Node.js 的痛点

Node.js 很成熟，但也有几个问题：
- 包管理用 npm，安装慢、node_modules 膨胀
- 原生不支持 TypeScript，需要 tsx 或 ts-node 转译
- 启动速度一般，性能有优化空间

### Bun 是什么

**Bun 是 Node.js 的升级版**——集运行时、包管理器、打包器于一身，零配置开箱即用。

核心优势：
- **快**：启动速度比 Node.js 快好几倍，包安装也快（用 bun install 代替 npm install）
- **原生支持 TypeScript**：不用 tsx、不用 ts-node，直接 `bun run index.ts`
- **兼容 Node.js 生态**：大部分 npm 包都能直接用

更重要的是：**Anthropic 收购了 Bun，用于 Claude Code 的底层。** 你现在用的 Claude Code，底层跑的就是 Bun。

```bash
# 安装 Bun
npm install -g bun

# 用 bun 代替 npm
bun install    # 代替 npm install
bun run index.ts   # 直接跑 TS 文件，零配置
```

这就是 Bun 的哲学：**少配置，多写代码。**

## 二、TypeScript：给 JavaScript 加上类型约束

### JS 的弱类型之痛

JavaScript 是弱类型语言，写起来自由，但容易出 bug。看这个例子：

```html
<input type="text" id="ipt">

<script>
  const ipt = document.getElementById('ipt')
  ipt.addEventListener('change', (e) => {
    console.log(e.target.value)      // "123"
    console.log(typeof e.target.value) // string，不是 number！
  })
</script>
```

用户明明输入的是数字，拿到的却是字符串。如果用来做加法：

```javascript
let a = 1
let b = '2'
console.log(a + b)  // "12"，字符串拼接，不是 3！
```

**不报错，但结果完全错误。** 这种 bug 可能藏很久。

### TypeScript 怎么解决

TypeScript 是微软开发的 JS 超集——**在 JS 基础上加了一层类型系统**。

```typescript
// 变量类型约束
const nickname: string = '9527'
const age: number = 18
console.log(`我是${nickname}，我今年${age}岁`)

// 函数参数和返回值类型约束
function add(a: number, b: number): number {
  return a + b
}

add(1, '2')  // ❌ 编译报错：类型不匹配！
```

TS 在编译阶段就把类型错误揪出来，不用等到运行时才发现。

### 处理类型转换

实际开发中，总有些数据类型不确定（比如 API 返回值、用户输入）。JS 提供了三种转换方式：

```typescript
let b = '2'

add(1, parseInt(b))   // 方式1：parseInt，解析整数
add(1, Number(b))     // 方式2：Number() 强类型转换
add(1, +b)            // 方式3：一元 + 运算符，隐式转换
```

三种方式都能把 `'2'` 变成 `2`，但语义不同：
- `parseInt('12px')` → `12`，能解析部分数字
- `Number('12px')` → `NaN`，严格转换
- `+'12px'` → `NaN`，跟 Number 一样严格

**TypeScript 是大项目的标配，也是 AI Agent 开发的首选语言。** 类型系统让你在写代码时就发现问题，而不是上线后。

## 三、手写 HTTP 请求：直接调 LLM API

v017 用 OpenAI SDK 封装了 API 调用。今天拆开来看——**用 axios 手写 POST 请求调 DeepSeek**。

### 为什么不用 GET？

GET 请求有两个问题：
1. **URL 长度有限制**，长 Prompt 放不下
2. **API Key 在 URL 里明文传输**，不安全

所以调 LLM API 用 **POST**——数据放请求体，API Key 放请求头。

### 完整代码

```typescript
import axios from 'axios'
import dotenv from 'dotenv'
dotenv.config()

async function chat() {
  try {
    const res = await axios.post(
      `${process.env.DEEPSEEK_API_URL}`,  // URL
      {                                     // 请求体 body
        model: 'deepseek-v4-flash',
        messages: [
          { role: 'user', content: '你好，介绍一下Bun' }
        ]
      },
      {                                     // 请求头 headers
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`
        }
      }
    )
    console.log(res.data.choices[0].message.content)
  } catch (error: any) {
    console.log('❌ 请求失败:', error.response?.data || error.message)
  }
}
chat()
```

### HTTP 请求的三要素

| 要素 | 内容 | 说明 |
|------|------|------|
| **请求行** | URL + Method + HTTP Version | 去哪、干什么 |
| **请求头** | Content-Type, Authorization | 告诉服务器数据格式和身份 |
| **请求体** | model, messages | 真正要处理的数据（GET 没有） |

**请求头里两个关键字段：**
- `Content-Type: application/json` —— 告诉服务器"我发的是 JSON"
- `Authorization: Bearer <API_KEY>` —— 告诉服务器"我是谁"

### 错误处理

LLM 可能超时、限流、返回错误，所以必须 try/catch：

```typescript
try {
  // 调用 API
} catch (error: any) {
  console.log('❌ 请求失败:', error.response?.data || error.message)
}
```

`error.response?.data` 是服务器返回的错误详情（比如 "rate limit exceeded"），`error.message` 是网络层面的错误（比如 "connect ECONNREFUSED"）。**两种都要处理。**

## 四、异步编程：封装一个 sleep 函数

JS 是异步的，`setTimeout` 不会阻塞代码。但有时候我们需要"等一会儿再执行"。

Promise 是 ES6 提供的异步解决方案：

```javascript
async function sleep(ms) {
  await new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms)
  })
}

sleep(2000).then(() => {
  console.log('2秒后执行')
})
```

关键点：
- `new Promise((resolve, reject) => {...})` —— 创建一个"诺言"
- `setTimeout(() => resolve(), ms)` —— ms 毫秒后兑现诺言
- `await` —— 等待诺言兑现再往下走
- `.then()` —— 诺言兑现后做什么

**Promise 是 JS 异步编程的核心，所有现代 API（fetch、axios）都基于它。**

## 五、TypeScript 项目配置

`tsconfig.json` 是 TypeScript 项目的配置文件：

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["node"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

几个关键配置：
- `strict: true` —— 开启严格模式，所有类型检查全开
- `target: "ESNext"` —— 编译到最新的 ES 标准
- `moduleResolution: "bundler"` —— 用打包器的方式解析模块

配合 Bun，这些基本不用动——**Bun 原生支持 TS，零配置就能跑。**

## 结语

今天干了四件事：

1. **Bun** —— 比 Node.js 更快、原生支持 TS 的下一代运行时，也是 Claude Code 的底层
2. **TypeScript** —— 给 JS 加上类型约束，编译时发现错误，AI Agent 开发的首选语言
3. **手写 HTTP 请求** —— 用 axios 发 POST 调 LLM，理解请求行/请求头/请求体的分工
4. **异步编程** —— Promise + setTimeout 封装 sleep，.then() 处理异步结果

v017 是"用 LLM 干活"，v018 是"理解底层怎么和 LLM 通信"。从 SDK 封装到手写 HTTP，从 JS 弱类型到 TS 类型安全，从 npm 到 Bun——**每一步都在往更深的地方走。**

下篇见。
