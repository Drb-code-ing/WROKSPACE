# 多模态 AI 与前端工程化：一个 AI Native 开发者的 Vite 与 LLM 调用实战

## 引言

v024 趴下来看了 HTTP 底层——Node.js 原生 http 模块、XHR、JSON 序列化。搞懂了数据从服务器到浏览器的完整链路。

今天换个方向：**不往后端深处走，而是把 AI 能力接进来。**

具体做什么？写一个前端页面，用户输入文字描述，调用通义千问的多模态生图模型，生成一张图片。听起来很"高级"，但拆开来看就三件事：

1. **前端工程化**——用 Vite 搭项目，告别手动写 HTML 的时代
2. **API Key 安全**——前端不能把密钥写死在代码里，用环境变量 + Vite 代理解决
3. **调用 LLM 端点**——用 fetch 调 Qwen 的多模态生成 API，拿到生成的图片

**这是 AI Native 开发者的核心能力：把 AI 模型的 API 接入到自己的前端项目里。**

v023 写后端接口给别人调用，v024 理解 HTTP 通信的底层，**今天写前端调用大模型——角色反转，你从"提供 API 的人"变成了"消费 API 的人"。**

## 一、多模态是什么？为什么需要它？

先搞清楚概念。

### 模态 = 信息的载体

```
单模态模型
├── 纯文本模型（GPT-3）—— 只能理解和生成文字
├── 纯图像模型（Stable Diffusion）—— 只能理解和生成图片
└── 纯语音模型（Whisper）—— 只能理解语音

多模态模型（Multimodal）
├── 文本 + 图像（GPT-4V, Qwen-VL, Gemini）—— 能看图说话，能按文字生成图
├── 文本 + 图像 + 语音（GPT-4o）—— 能看、能听、能说
└── 图文混合输入 → 图文混合输出
```

**多模态**就是模型能同时处理多种类型的信息。今天要用的 Qwen Image 2.0 Pro 就是一个多模态生图模型——输入"参考图 + 文字描述"，输出一张新图。

```
输入                           模型                           输出
┌──────────┐              ┌──────────┐              ┌──────────┐
│ 图1：女生 │              │          │              │          │
│ 图2：裙子 │  ─────────→  │  Qwen    │  ─────────→  │  合成图  │
│ 图3：姿势 │              │  Image   │              │          │
│ 文字描述  │              │  2.0 Pro │              │          │
└──────────┘              └──────────┘              └──────────┘
```

**多模态不仅仅是"好玩"——它是下一代 AI 应用的基础能力。** 电商的商品图生成、设计的草图变效果图、视频的 AI 换装——背后全是多模态模型。

## 二、前端工程化的起点：Vite

### 为什么需要前端工程化？

v024 写前端用的是单个 `index.html`，里面塞 `<script>` 标签，手动开 Live Server。这在学习阶段没问题，但一旦项目复杂起来——

```
手动管理的痛点：
├── 多个 JS 文件之间的依赖关系要手动维护 <script> 顺序
├── 没有热更新 → 改了代码要手动刷新浏览器
├── 没有模块化 → import/export 需要靠打包工具
├── 环境变量 → 无法安全管理 API Key
├── 代理配置 → 无法优雅解决跨域
└── 生产构建 → 需要手动压缩、合并、优化
```

**前端工程化就是用工具把上面这些事自动化。** Vite 是当前最快、最流行的前端构建工具之一。

### Vite 是什么？

```
Vite 的角色
├── 开发服务器   —— npm run dev → 启动本地服务器 + HMR 热更新
├── 构建工具     —— npm run build → 打包优化，输出到 dist
├── 环境变量管理  —— .env 文件 → import.meta.env.VITE_XXX
├── 代理转发     —— /api → 转发到真实后端
└── 模块打包     —— import/export → 自动处理依赖
```

一句话：**Vite 就是前端项目的"大管家"——`npm run dev` 一执行，Vite 接管整个项目。**

### 项目初始化

```bash
npm init vite   # Vite 脚手架，选 vanilla 模板
```

初始化后的项目结构：

```
qwen-image-demo/
├── index.html          # 入口 HTML
├── package.json        # 项目配置和依赖
├── vite.config.js      # Vite 配置文件（核心！）
├── main.js             # JS 入口
├── src/
│   ├── main.js         # 主要逻辑
│   ├── style.css       # 样式
│   ├── counter.js      # 计数器组件（模板自带）
│   └── assets/         # 静态资源
└── .env.local          # 环境变量（不提交到 Git）
```

`package.json` 里的脚本：

```json
{
  "scripts": {
    "dev": "vite",           // 启动开发服务器
    "build": "vite build",   // 生产构建
    "preview": "vite preview" // 预览构建产物
  }
}
```

- **`npm run dev`**：Vite 启动开发服务器，几千个端口给你打开，改代码自动热更新。代码保存，浏览器瞬间刷新，不用手动 F5。
- **`npm run build`**：Vite 把代码打包压缩，输出到 `dist/`，可以直接部署上线。
- **`npm run preview`**：本地预览打包后的效果。

## 三、API Key 安全管理：从明文到环境变量

### 问题：API Key 不能写在前端代码里

v023/v024 的后端代码里，API Key 写在后端的 `.env` 文件里，不会暴露给用户。但前端代码**全部在浏览器里执行**，Key 写在代码里就等于**公开**。

```javascript
// ❌ 绝对不能这样做——任何人打开浏览器开发者工具就能看到
const apiKey = "sk-xxxxxxxxxxxxxxxxxxxx"
fetch("https://api.openai.com/v1/chat/completions", {
    headers: { "Authorization": `Bearer ${apiKey}` }
})
```

**怎么解决？** 答案在 Vite 的两个机制里：环境变量 + 开发代理。

### 环境变量：.env.local

```bash
# .env.local（这个文件不提交到 Git！）
VITE_QWEN_API_KEY=sk-your-actual-api-key
```

注意：**Vite 环境变量必须以 `VITE_` 开头**，否则不会被暴露给前端代码。这是安全兜底——防止你不小心把敏感变量暴露出去。

在代码中使用：

```javascript
// ✅ 使用环境变量，不写死 Key
const apiKey = import.meta.env.VITE_QWEN_API_KEY
```

`import.meta.env` 是 Vite 在构建时提供的全局对象，所有 `VITE_` 开头的环境变量都会被注入到这里。

### 完整工作流

```
.env.local 文件                    构建时                    运行时
┌─────────────────┐          ┌──────────────┐        ┌──────────────────┐
│ VITE_QWEN_API   │   vite   │ import.meta  │   JS   │ const apiKey =   │
│ _KEY=sk-xxx...  │ ──────→ │ .env.VITE_   │ ────→ │ import.meta.env  │
│                 │  注入    │ QWEN_API_KEY │  引用  │ .VITE_QWEN_API   │
│                 │          │ = "sk-xxx.." │        │ _KEY             │
└─────────────────┘          └──────────────┘        └──────────────────┘

.gitignore 拦截 .env.local → Key 不会提交到 Git → 不会泄露
```

> **关键认知**：`import.meta.env.VITE_XXX` 的值在**构建时**就已经写死到 JS bundle 里。所以 `.env.local` 不提交到 Git，但前端代码里用到的 Key 实际上还是会出现在浏览器中。**这个保护只防止 Key 被传到 Git 仓库，不防止用户在浏览器 DevTools 里看到。**
>
> **真正安全的做法是让后端代理请求**（下一节讲）。

## 四、Vite 代理：真正的 API Key 安全方案

环境变量只是"不把 Key 提交到 Git"，但 Key 仍然暴露在浏览器里。真正安全的做法是**让 Vite 开发服务器代理 API 请求**。

### 原理

```
前端代码                     Vite Dev Server               真实 API
                          （本地代理）
┌──────────┐            ┌──────────────┐            ┌──────────────┐
│ fetch(   │            │              │            │              │
│  '/api/  │  ───────→  │ 拼接 Key     │  ───────→  │ dashscope    │
│  ...'    │            │ 转发请求     │            │ .aliyuncs    │
│          │  ←───────  │              │  ←───────  │ .com         │
│  响应    │            │ 返回响应     │            │              │
└──────────┘            └──────────────┘            └──────────────┘

前端只看到 /api/*  →  Key 只在 Vite 服务器端拼接  →  前端完全看不到 Key！
```

### vite.config.js 配置

```javascript
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/api': {                                        // 匹配所有 /api 开头的请求
        target: 'https://dashscope.aliyuncs.com',      // 真实 API 地址
        changeOrigin: true,                            // 修改请求头中的 Origin
        rewrite: (path) => path.replace(/^\/api/, ''), // 去掉 /api 前缀
      },
    },
  },
})
```

逐行解读：

- **`'/api'`**：拦截所有 `/api` 开头的请求。前端调用 `fetch('/api/api/v1/services/...')`，Vite 检测到 `/api` 前缀，触发代理。
- **`target`**：真实 API 地址。Vite 把请求转发到 `https://dashscope.aliyuncs.com`。
- **`changeOrigin: true`**：把请求头中的 `Origin` 改成 `target` 的域名，避免 CORS 问题。
- **`rewrite`**：路径重写。`/api/api/v1/...` → `/api/v1/...`（去掉 `/api` 前缀再转发）。

### 前端调用

```javascript
// 前端代码里调用 /api 路径，Vite 自动代理到真实地址
const res = await fetch(
  '/api/api/v1/services/aigc/multimodal-generation/generation',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,  // 注意：这里 Key 仍然会用环境变量
    },
    body: JSON.stringify({ /* 请求参数 */ })
  }
)
```

> **最终的安全架构**：生产环境中，API Key 应该完全放在后端服务器上，前端只调用自己后端的接口，由后端转发到 LLM API。Vite 的 proxy 配置主要是开发阶段的方案——但它让我们理解了"代理"这个概念，为后面的全栈安全架构打基础。

## 五、调用多模态生图 API

有了工程化基础设施（Vite + 代理 + 环境变量），现在可以写核心逻辑了。

### 请求结构

```javascript
const apiKey = import.meta.env.VITE_QWEN_API_KEY

const generateImage = async () => {
  const res = await fetch(
    '/api/api/v1/services/aigc/multimodal-generation/generation',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        "model": "qwen-image-2.0-pro",          // 指定模型
        "input": {
          "messages": [
            {
              "role": "user",
              "content": [
                // 多张参考图
                { "image": "https://example.com/input1.png" },
                { "image": "https://example.com/input2.png" },
                { "image": "https://example.com/input3.png" },
                // 文字指令
                { "text": "图1的女生穿着图2中的黑色裙子按图3的姿势坐下" }
              ]
            }
          ]
        },
        "parameters": {
          "n": 1,               // 生成几张图
          "size": "1024*1536"   // 图片尺寸
        }
      })
    }
  )
```

### 关键细节

**1. 多模态输入的结构**

```javascript
"content": [
  { "image": "url1" },   // 图片输入
  { "image": "url2" },   // 可以多张
  { "text": "描述文字" }   // 文本输入
]
```

`content` 是一个数组，里面可以混合 `image` 和 `text`。这就是"多模态"的具体体现——**一次请求里同时包含图片和文字**。

**2. fetch API 的完整用法**

```javascript
fetch(url, {
  method: 'POST',                          // HTTP 方法
  headers: {                               // 请求头
    'Content-Type': 'application/json',    // 告诉服务器"我发的是 JSON"
    'Authorization': `Bearer ${apiKey}`,   // 认证
  },
  body: JSON.stringify({ /* ... */ })      // 请求体：JS 对象 → JSON 字符串
})
```

这就是 v024 里讲的 `JSON.stringify()` 在前端调用 LLM 场景下的实际应用——把请求参数序列化成 JSON，放在 HTTP Body 里发出去。

**3. 错误处理**

```javascript
if (!res.ok) {
  const errText = await res.text()
  console.error('请求失败:', res.status, errText)
  throw new Error(`HTTP ${res.status}: ${errText}`)
}

const data = await res.json()
// 从嵌套的响应结构中提取图片 URL
return data.output?.choices?.[0]?.message?.content?.[0]?.image
```

- **`res.ok`**：fetch Response 对象的布尔属性，`true` 表示 HTTP 状态码在 200-299 之间
- **`?.`（可选链）**：安全地访问深层嵌套属性，任何一层为 `null/undefined` 就返回 `undefined` 而不报错
- **响应结构**：`data.output.choices[0].message.content[0].image`——LLM API 的响应通常都是一个多层嵌套的 JSON

### 渲染到页面

```javascript
const renderImage = (imageUrl) => {
  root.innerHTML = `<img src="${imageUrl}" />`
}

// 主流程
const main = async () => {
  const imageUrl = await generateImage()
  renderImage(imageUrl)
}
main()
```

整个流程非常清晰：

```
用户打开页面
    │
    ▼
main() 执行
    │
    ▼
generateImage() 发送 fetch POST 请求
    │  ┌─ 请求头：Content-Type + Authorization
    │  ├─ 请求体：model + input(images + text) + parameters
    │  └─ 路径经过 Vite proxy 转发到 dashscope.aliyuncs.com
    ▼
等待 AI 生成图片（几秒到十几秒）
    │
    ▼
解析响应 → 提取 image URL
    │
    ▼
renderImage() → innerHTML 插入 <img> → 用户看到生成的图片
```

## 六、完整代码走读

把上面的知识串起来，就是完整的 Qwen 生图前端应用：

```javascript
// main.js —— 完整的多模态生图前端

const apiKey = import.meta.env.VITE_QWEN_API_KEY
const root = document.querySelector('#app')

const generateImage = async () => {
  const res = await fetch(
    '/api/api/v1/services/aigc/multimodal-generation/generation',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        "model": "qwen-image-2.0-pro",
        "input": {
          "messages": [{
            "role": "user",
            "content": [
              { "image": "https://example.com/input1.png" },
              { "image": "https://example.com/input2.png" },
              { "image": "https://example.com/input3.png" },
              { "text": "图1的女生穿着图2中的黑色裙子按图3的姿势坐下" }
            ]
          }]
        },
        "parameters": {
          "n": 1,
          "size": "1024*1536"
        }
      })
    }
  )

  if (!res.ok) {
    const errText = await res.text()
    console.error('请求失败:', res.status, errText)
    throw new Error(`HTTP ${res.status}: ${errText}`)
  }

  const data = await res.json()
  console.log('响应:', data)
  return data.output?.choices?.[0]?.message?.content?.[0]?.image
}

const renderImage = (imageUrl) => {
  root.innerHTML = `<img src="${imageUrl}" />`
}

const main = async () => {
  const imageUrl = await generateImage()
  renderImage(imageUrl)
}
main()
```

```
┌─────────────────────────────────────────────────────────────┐
│                     完整技术链路                             │
│                                                             │
│  .env.local          vite.config.js        dashscope API   │
│  ┌──────────┐       ┌──────────────┐      ┌────────────┐   │
│  │ API Key  │       │  /api 代理   │      │ Qwen Image │   │
│  │ 环境变量 │       │  target转发  │      │  2.0 Pro   │   │
│  └──────────┘       └──────────────┘      └────────────┘   │
│       │                    │                      │         │
│       ▼                    ▼                      ▼         │
│  import.meta.env    /api/... → 真实URL      多模态生图      │
│  .VITE_QWEN_API     changeOrigin          返回图片URL      │
│  _KEY               rewrite                                 │
│                                                             │
│  main.js ──fetch()──→ vite proxy ──转发──→ Qwen API        │
│     │                                                    │  │
│     └──────────── 响应 ←──────── 代理返回 ←──────────────┘  │
│     │                                                       │
│     ▼                                                       │
│  innerHTML 渲染图片                                         │
└─────────────────────────────────────────────────────────────┘
```

## 七、Vite 的完整能力总结

今天用到了 Vite 的几个核心能力，汇总一下：

| 能力 | 命令/配置 | 作用 |
|------|-----------|------|
| 脚手架 | `npm init vite` | 快速初始化项目结构 |
| 开发服务器 | `npm run dev` | 启动本地服务器 + HMR 热更新 |
| 环境变量 | `VITE_XXX` + `import.meta.env` | 管理 API Key 等配置 |
| 代理转发 | `vite.config.js` 的 `proxy` | 解决跨域 + 隐藏真实 API 地址 |
| 构建 | `npm run build` | 打包压缩，输出生产版本 |
| 预览 | `npm run preview` | 本地预览构建产物 |

**Vite 就是前端项目在工程化这块的"大管家"。** 你只要写业务代码，它帮你搞定开发服务器、热更新、环境变量、代理转发、生产构建这些工程化杂事。

## 八、从 v018 到今天的 AI 全栈版图

回顾一下我们走过的路：

```
后端线                          前端线                    AI 线
│                               │                        │
├── v018: Bun + TS 后端环境     │                        │
├── v022: JS 数据类型底层       │                        │
├── v023: RESTful API + OOP     │                        │
├── v024: HTTP 底层 + XHR       ├── v024: DOM 渲染       ├── v018: LLM 调用
│                               │                        │
└───────────────────────────────┴────────────────────────┘
                                │
                        v025 今天：三条线交汇！
                                │
              Vite 前端工程化 + 多模态 LLM API 调用
```

**今天三条学习线正式交汇：**

- **后端知识**（HTTP 协议、JSON 序列化、请求/响应结构）→ 用来理解和构造 API 调用
- **前端知识**（Vite 工程化、DOM 操作、async/await）→ 用来搭建项目和管理异步流程
- **AI 知识**（多模态模型、LLM API、Prompt 构造）→ 用来调用大模型能力

**AI Native 开发者就是这样——前端、后端、AI 三条线都要懂，更要能在实际项目中把它们串起来。**

## 结语

今天完成了两件事：

1. **前端工程化入门** —— 告别手动 `<script>` 标签时代，用 Vite 搭项目。理解环境变量（`.env.local` → `import.meta.env`）、开发代理（`vite.config.js` 的 `proxy`）、热更新、构建打包这些工程化概念。**Vite 是前端项目的"大管家"——它接管了开发服务器、环境变量、代理转发、构建优化这些杂事，让你专注于写业务逻辑。**

2. **第一次调用大模型 API** —— 用 fetch 发 POST 请求，把参考图和文字描述发给 Qwen Image 2.0 Pro，拿到 AI 生成的图片。**这是从"用别人搭好的 AI 产品"到"把 AI 能力集成到自己的应用里"的关键一步。**

几个核心认知：

- **多模态 = 一次请求里同时包含图片和文字**。`content` 数组里可以混合 `{ image: "url" }` 和 `{ text: "描述" }`
- **API Key 安全三层递进**：明文写死（❌）→ 环境变量 `.env.local`（防止提交 Git，但浏览器仍可见）→ 后端代理转发（真正安全）
- **Vite = 前端工程化大管家**：脚手架、热更新、环境变量、代理转发、构建打包——`npm run dev` 一执行，Vite 接管一切
- **AI Native 开发者 = 前端 + 后端 + AI 三条线的交叉点**：能用前端工程化搭项目，能理解 HTTP 协议调 API，能把 AI 模型的能力集成进应用

v023 写后端接口给别人调，v024 趴下来看 HTTP 底层，**今天站在前端工程化的肩膀上调用 AI 模型——你从"提供 API 的人"变成了"消费 API 的人"，视角完成了 180° 翻转。**

**会用 + 理解 + 集成 = AI Native 开发者。**

下篇见。
