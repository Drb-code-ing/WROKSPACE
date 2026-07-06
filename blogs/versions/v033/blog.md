# 从概念到框架：用 LangChain 打造第一个 Agent

## 引言

v029 搞懂了 Agent 的四块基石——LLM 是大脑，Tools 是手脚，Reasoning 是思考过程，Context 是记忆。

v030 搞懂了 Loop——不是写 Prompt，而是设计循环。Completion → Check → 退出或重试。

v031 搞懂了工程化——用 LangGraph 写 Agent，用 Supervisor 模式让多个 Agent 协作。

v032 沉到了 LLM 的底层——Token 是字母表，Embedding 是语义地图。搞懂了 AI 是怎么"读"文字的。

但这四篇文章有一个共同的缺憾：**一直在讲"是什么"和"为什么"，没有真正动手写一个能跑的 Agent。**

```
v029 ──→ v030 ──→ v031 ──→ v032 ──→ v033 今天
概念     循环     工程化    底层原理   框架实战
是什么    怎么跑    怎么写    怎么读     动手造
```

今天带着 v032 的底层认知，回到应用层——**用 LangChain 框架，从零打造第一个 Agent。**

内容分三块：
1. **补全 Agent 蓝图**——v029 只讲了 LLM + Tools，但一个真正的 Agent 有六个组件
2. **LangChain 框架入门**——为什么需要框架、核心抽象是什么
3. **两个实战 + 一个优化**——Hello LangChain → 文件读取 Agent → Promise.all 并行加速

## 一、Agent 的完整图景

### v029 讲了什么，没讲什么

v029 给 Agent 下的定义是：

```
Agent = LLM（大脑）+ Tools（手脚）+ Context（信息）
```

这个公式对理解概念够用，但对"造一个 Agent"不够。**一个真正能投入生产的 Agent，需要六个组件：**

```
Agent = LLM + Memory + Tool + RAG + MCP + Skills
```

```
        ┌──────────────────────────────────────────────┐
        │                   AGENT                       │
        │                                              │
        │  ┌────────┐ ┌──────────┐ ┌───────────────┐  │
        │  │  LLM   │ │ Memory   │ │    Tools      │  │
        │  │  大脑   │ │  记忆    │ │    工具       │  │
        │  └────────┘ └──────────┘ └───────────────┘  │
        │                                              │
        │  ┌────────┐ ┌──────────┐ ┌───────────────┐  │
        │  │  RAG   │ │   MCP    │ │    Skills     │  │
        │  │ 检索    │ │ 第三方工具│ │    技能       │  │
        │  └────────┘ └──────────┘ └───────────────┘  │
        └──────────────────────────────────────────────┘
```

### 为什么要六个组件？因为 LLM 有四个致命短板

| LLM 的短板 | 现象 | 解决方案 |
|-----------|------|---------|
| **无状态** | 上周你和它聊过的消息，它能记住吗？不能。每次 HTTP 请求都是独立的 | **Memory** 模块（数据库 / 前端存储 / Redis） |
| **不能操作世界** | 让它访问网页、执行代码？只能给你思路，不会动手 | **Tool Use** 模块 |
| **不知道私有知识** | 让它读公司内部文档？训练数据里没有 | **RAG** 模块（检索增强生成） |
| **没有实时信息** | 最新的世界杯新闻、今天的股价？不在训练数据中 | **MCP**（第三方 Tool 协议）/ **Tool** |
| **不会做复杂任务** | 做 PPT、分析股市并自动买卖？单次问答搞不定 | **Skills** 技能（蒸馏能力） |

**LLM 本身可以思考、规划。给它 Tool 扩展能力，就能做事情；给 Memory 管理记忆，就能记住上下文；给 RAG 接入私有知识，就能回答内部问题。** 这样一个知道内部知识、能思考规划、能帮你做事情的扩展后的大模型，就是一个 Agent。

### 你现在用的产品，本质都是 Agent

```
Claude Code / Codex / Cursor  → 写代码、读文件、执行命令
小龙虾 / Manus                → 自动化任务
豆包 / 悟空 / 飞书 CLI       → 办公场景自动化
```

它们的核心都一样——**不只是回答问题，还能读文件、搜网络、写代码、操作浏览器。** Claude Code 为什么不是一个单纯的"大模型聊天机器人"？因为它背后有 File System Tool、Search Tool、Bash Tool、Edit Tool……这些 Tools 让它从"说话的盒子"变成了"干活的助手"。

## 二、Agent 的工作流程

理解了 Agent 有哪些部件，再看它们是怎么协同工作的：

```
用户以 Prompt 形式提出复杂任务
        │
        ▼
   ┌─────────────────────┐
   │     Agent 智能体     │
   │                     │
   │  Planning/Reasoning │  ← 先规划：这个任务怎么拆？
   │        │            │
   │        ├── 需要加载 Memory？（上次聊到哪了）
   │        ├── 需要调用 Tool？（分步骤、多个工具）
   │        ├── 需要 RAG 检索？（查内部文档）
   │        └── 需要 MCP 第三方工具？
   │                     │
   └─────────┬───────────┘
             │
             ▼
   Response → 用户（任务完成）
```

**整个流程的核心是 Planning/Reasoning——LLM 先想清楚怎么做，再决定调用什么工具、查什么资料。** 这不是"一问一答"，而是"理解任务 → 制定计划 → 执行步骤 → 汇总结果"。

> **关键认知：Agent 不是 Chatbot 的升级版，而是一种新的软件架构。** Chatbot 是"输入文本 → 输出文本"；Agent 是"输入任务 → 规划执行 → 调用工具 → 返回结果"。两者的底层模型可能一样，但上层架构完全不同。

## 三、LangChain 框架：为什么需要它

### 技术栈全景

Agent 开发的完整技术栈：

```
nest.js（后端框架）
    +
langchain（单智能体开发框架）
    +
langgraph（多智能体开发框架）
    ↓
AI 全栈 Agent 产品 → Harness Engineering 落地 → 商业价值（FDE）
```

**LangChain 是目前最主流的 Agent 开发框架。** 它解决了一个核心问题：用原生 OpenAI SDK 写 Agent 太原始了。

### 原生 SDK vs LangChain

```
原生 OpenAI SDK 写 Agent：

  1. 手动写 JSON Schema 定义 Tool
  2. 手动拼 messages 数组
  3. 手动解析 response.choices[0].message.tool_calls
  4. 手动执行函数
  5. 手动把结果 push 回 messages
  6. 手动再次调用 LLM

  每一步都是手动的。Tool 一多，代码就失控。

LangChain 写 Agent：

  1. tool(fn, { name, description, schema }) 定义工具
  2. model.bindTools(tools) 一键注册
  3. new HumanMessage() / new SystemMessage() 类型安全
  4. model.invoke(messages) 自动处理 tool_calls

  框架接管了所有"胶水代码"。
```

**LangChain 的核心价值不是"功能更多"，而是"抽象更好"。** 它把 Tool Calling 从"手写 JSON + 手动拼接"变成了"声明式配置 + 自动编排"。

## 四、LangChain 的核心抽象

在写代码之前，先认识 LangChain 的四个核心抽象：

### 1. ChatOpenAI——统一的 LLM 接口

```javascript
import { ChatOpenAI } from '@langchain/openai'

const model = new ChatOpenAI({
    modelName: 'deepseek-v4-flash',
    apiKey: process.env.DEEPSEEK_API_KEY,
    temperature: 0,
    configuration: {
        baseURL: 'https://api.deepseek.com/v1',
    },
})

// 与原生 client.chat.completions.create() 对应
const response = await model.invoke('棍王杯台球赛该设什么奖励？')
```

**`ChatOpenAI` 封装了 OpenAI 兼容接口。** DeepSeek、通义千问、智谱都能用同一套代码——换模型只改 `baseURL` 和 `apiKey`。

### 2. tool()——声明式工具定义

```javascript
import { tool } from '@langchain/core/tools'
import { z } from 'zod'

const readFileTool = tool(
    async ({ filePath }) => {              // 处理函数
        const content = await fs.readFile(filePath, 'utf-8')
        return content
    },
    {                                      // 描述对象
        name: 'read_file',
        description: '读取文件内容。当用户要求读取文件、查看代码时调用此工具。',
        schema: z.object({                 // zod 做参数校验
            filePath: z.string().describe('要读取的文件路径')
        })
    }
)
```

**和原生方式对比：**

```
原生：手写 JSON Schema → 容易写错，没有类型检查
      函数和描述分开维护 → 改一个忘一个

LangChain：tool(fn, config) → 函数和描述绑定在一起
          zod schema → 类型安全，写错立即报错
```

**`description` 的质量直接决定 LLM 调用工具的准确率。** 这跟原生一样——但 LangChain 把描述和处理函数放在同一个 `tool()` 调用里，维护成本低得多。

### 3. bindTools()——一键注册工具

```javascript
const modelWithTools = model.bindTools([readFileTool])
// 相当于原生: { tools: [...], tool_choice: 'auto' }
```

一行代码把所有工具注册到模型。框架自动把 `tool()` 的定义转成 OpenAI 兼容的 `tools` 参数。

### 4. 消息类型——类型安全的对话管理

```javascript
import {
    HumanMessage,      // { role: 'user' }
    SystemMessage,     // { role: 'system' }
    AIMessage,         // { role: 'assistant' }
    ToolMessage,       // { role: 'tool' }
} from '@langchain/core/messages'

const messages = [
    new SystemMessage('你是一个代码助手'),
    new HumanMessage('请读取 tool.mjs 文件'),
]
```

**本质上就是原生 `messages` 数组里不同 `role` 的面向对象封装。** 但类型安全——IDE 有自动补全，写错 role 会立即报错。

## 五、实战一：Hello LangChain

先从最简 demo 开始——用 LangChain 调用 DeepSeek，感受一下和原生 SDK 的区别。

`index.mjs`：

```javascript
import { ChatOpenAI } from '@langchain/openai'
import dotenv from 'dotenv'

dotenv.config()

const apiKey = process.env.Deepseek_API_Key

const model = new ChatOpenAI({
    modelName: 'deepseek-v4-flash',
    apiKey: apiKey,
    configuration: {
        baseURL: 'https://api.deepseek.com/v1',
    }
})

// 原生：client.chat.completions.create({ messages: [...] })
// LangChain：model.invoke(直接传字符串)
const response = await model.invoke('棍王杯台球赛该设什么奖励？')
console.log(response)
```

**和原生 SDK 的关键区别：**

```
原生：
  await client.chat.completions.create({
    model: '...',
    messages: [{ role: 'user', content: '...' }]
  })
  // 返回: { choices: [{ message: { content: '...' } }] }

LangChain：
  await model.invoke('直接传字符串')
  // 返回: AIMessage 对象，直接 .content 取内容
```

**`invoke()` 是 LangChain 的统一入口。** 不管是纯对话、Tool Calling、还是 RAG——入口都是 `invoke()`，框架内部判断走哪条路径。

## 六、实战二：文件读取 Agent

这个 demo 是今天的重头戏——一个真正能"干活"的 Agent。它能读取文件、分析代码。

`tool.mjs` 完整代码及逐行解读：

### 第一步：初始化模型

```javascript
import 'dotenv/config'
import { ChatOpenAI } from '@langchain/openai'
import { tool } from '@langchain/core/tools'
import {
    HumanMessage,
    SystemMessage,
    ToolMessage,
    AIMessage
} from '@langchain/core/messages'
import fs from 'node:fs/promises'
import { z } from 'zod'

const model = new ChatOpenAI({
    modelName: 'deepseek-v4-flash',
    apiKey: process.env.DEEPSEEK_API_KEY,
    temperature: 0,                          // 工具调用不需要"创意"
    configuration: {
        baseURL: 'https://api.deepseek.com/v1',
    },
})
```

**`temperature: 0` 意味着 LLM 的回复是确定性的——同一输入永远同一输出。** Agent 的 Tool Calling 环节不需要"创意"，需要的是准确。让 LLM 准确地选择工具、准确地填参数。

### 第二步：定义工具

```javascript
const readFileTool = tool(
    async ({ filePath }) => {
        const content = await fs.readFile(filePath, 'utf-8');
        // 🔑 Agent 任务可能很复杂、很耗时
        // 用户太久没看到反馈，可能以为卡死了
        console.log(`[工具调用] read_file(${filePath}) 成功读取 ${content.length} 字节`);
        return content;
    },
    {
        name: 'read_file',
        description: `用此工具来读取文件内容。当用户要求读取文件、
        查看代码、分析文件内容时，调用此工具。输入文件路径
        （可以是相对路径或绝对路径）`,
        schema: z.object({
            filePath: z.string().describe('要读取的文件路径')
        })
    }
)

const tools = [readFileTool]
```

**工具定义 = 两部分：**
1. **处理函数**（`async ({ filePath }) => {...}`）——实际执行的逻辑，就是一个普通的 async 函数
2. **描述对象**（`{ name, description, schema }`）——告诉 LLM "这个工具能做什么、需要什么参数"

> **`description` 是 LLM 理解工具的唯一入口。** 写得太简略（"读文件"），LLM 不知道什么时候该用；写得太宽泛（"处理文件"），LLM 可能会在不该用的时候用。好的 description 三要素：功能（做什么） + 触发条件（什么时候用） + 参数说明（需要什么）。

### 第三步：绑定工具并构建消息

```javascript
const modelWithTools = model.bindTools(tools)

const messages = [
    new SystemMessage(`
        你是一个代码助手，可以使用工具读取文件并解释代码。
        
        工作流程：
        1. 用户要求读取文件时，立即调用 read_file 工具。
        2. 等待工具返回文件内容。
        3. 基于文件内容进行分析和解释。

        可用工具：
        - read_file: 读取文件内容（使用此工具来获取文件内容）
    `),
    new HumanMessage('请读取 tool.mjs 文件内容并解释代码'),
]
```

**`SystemMessage` 里写了三样东西：角色定义（代码助手）、工作流程（3 步）、可用工具列表。** 这不是冗余——LLM 需要这些信息来正确决策。System prompt 写得越清晰，Agent 的行为越可预测。

### 第四步：调用 LLM

```javascript
let response = await modelWithTools.invoke(messages)
messages.push(response)  // 把 LLM 的回复加入对话历史
```

**`invoke()` 返回的是 `AIMessage`。** 如果 LLM 决定调用工具，`AIMessage` 里会包含 `tool_calls` 数组——跟原生 SDK 的 `response.choices[0].message.tool_calls` 对应，但 LangChain 帮你解析好了。

### Tool Calling 的完整数据流

```
1. 用户："请读取 tool.mjs 文件内容并解释代码"
         │
2. System prompt 告诉 LLM：你有 read_file 工具可用
         │
3. LLM 推理："用户要我读文件 → 我做不到 → 但我有 read_file 工具"
         │
4. LLM 返回 AIMessage（含 tool_calls）
   tool_calls: [{ name: "read_file", args: { filePath: "tool.mjs" } }]
         │
5. LLM 有自知之明——要调用工具时，不生成回答，停下来告诉你 tool_call
   包含 id、name、arguments
   多个 tool id 关联后续函数调用结果
         │
6. 你的代码执行 readFileTool("tool.mjs") → 文件内容
   console.log: "[工具调用] read_file(tool.mjs) 成功读取 2048 字节"
         │
7. 结果作为 ToolMessage 返回给 LLM
         │
8. LLM 根据文件内容生成解释
```

**关键理解：LLM 不执行函数，它只"决定"调用哪个函数。** 函数是你的代码执行的，结果也是你的代码传回的。LLM 的角色是"决策者"，不是"执行者"。这是很多人对 Agent 最大的误解——以为 LLM "自己就能做事"。实际上，LLM 只负责"想"，你的代码负责"做"。

## 七、Promise.all：让 Agent 快起来

### 问题：多个工具调用 = 多个等待

Agent 的任务通常很复杂——可能同时需要读三个文件、搜两个 API、查一个数据库。**如果每个操作都串行执行，总耗时 = 所有操作耗时之和。**

```javascript
// ❌ 串行：总耗时 = 2000ms + 500ms = 2500ms
async function main() {
    console.time("my-operation");
    const weatherData = await getWeather();    // 等 2000ms
    const tweetsData = await getTweets();       // 再等 500ms
    console.log(weatherData);
    console.log(tweetsData);
    console.timeEnd("my-operation");            // ≈ 2500ms
}
```

```
时间线（串行）：
  getWeather() ════════════════════╗
                                   ║ getTweets() ══════╗
  0ms                        2000ms            2500ms
```

### 解决：Promise.all 并行执行

```javascript
// ✅ 并行：总耗时 = max(2000ms, 500ms) = 2000ms
const main = async () => {
    console.time("my-operation");
    const [weatherData, tweetsData] = await Promise.all([
        getWeather(),
        getTweets()
    ]);
    console.log(weatherData);
    console.log(tweetsData);
    console.timeEnd("my-operation");            // ≈ 2000ms
}
```

```
时间线（并行）：
  getWeather() ════════════════════╗
  getTweets()  ══════╗             ║
  0ms             500ms        2000ms
```

**`Promise.all` 不关心谁先完成——它等所有人都完成，然后按数组顺序返回结果。**

### Promise 的三种状态

```
Pending（等待中）
    │
    ├── resolve()  → Fulfilled（成功）
    │
    └── reject()   → Rejected（失败）

状态只能变化一次，且不可逆。
Pending → Fulfilled，或 Pending → Rejected。
一旦变了，就永远是那个状态。
```

### async/await：异步变同步的语法糖

```javascript
// Promise 链式调用（ES6）
getWeather()
    .then(data => console.log(data))
    .catch(err => console.error(err))

// async/await（ES8）——看起来像同步，实际是异步
async function main() {
    try {
        const data = await getWeather()
        console.log(data)
    } catch (err) {
        console.error(err)
    }
}
```

**`await` 暂停当前函数的执行，等待 Promise 完成，但不会阻塞主线程。** 这就是为什么 JS 能一边等网络请求，一边响应用户点击——await 只阻塞当前 async 函数，不影响事件循环。

### 在 Agent 中的应用

```javascript
// Agent 需要同时读取三个文件来分析项目结构
const [configJs, packageJson, readmeMd] = await Promise.all([
    readFileTool({ filePath: 'config.js' }),
    readFileTool({ filePath: 'package.json' }),
    readFileTool({ filePath: 'README.md' }),
])
// 三个文件并行读取，总耗时 = 最慢的那个
// 串行 3 秒 → 并行 1 秒
```

**当 Agent 需要调用多个互不依赖的工具时，`Promise.all` 是性能优化的关键手段。** 3 个工具各耗时 1 秒，串行 3 秒，并行 1 秒——快三倍。而且工具越多，差距越大。

> **这是"即将打造高性能 Agent"的核心技术。** Agent 的任务越复杂、涉及的工具越多，并行优化的收益就越大。

## 结语

v029 到 v033，围绕 Agent 的认知螺旋上升了一个完整的周期：

```
v029: Agent 是什么  →  概念层（LLM + Tools + Reasoning）
v030: Agent 怎么跑  →  机制层（Loop = gen + check + stop）
v031: Agent 怎么写  →  工程化（LangGraph + Supervisor）
v032: LLM 怎么读    →  基础层（Token + Embedding）
v033: 框架怎么用    →  实战层（LangChain + Promise.all）
```

**v033 的特殊之处在于：它把 v029 的概念和 v031 的工程化，通过 LangChain 框架真正落地成了可运行的代码。**

### 今天学到的三样东西

1. **Agent 的完整图景**——不是 LLM + Tools 那么简单，而是 LLM + Memory + Tool + RAG + MCP + Skills。每一个组件解决 LLM 的一个短板

2. **LangChain 框架**——`ChatOpenAI` 统一接口、`tool()` + `zod` 定义工具、`bindTools()` 注册工具、`HumanMessage` / `SystemMessage` 管理对话。框架的价值不是"功能更多"，而是"抽象更好"——让 Tool Calling 从手写 JSON 变成声明式配置

3. **Promise.all 并行优化**——多个互不依赖的工具调用，从"串行累加"变成"并行取最大值"。Agent 性能优化的基础技术

### FDE 的完整技能树

```
AI Native 开发者（FDE）的能力栈：

  概念层：Agent = LLM + Memory + Tool + RAG + MCP + Skills
  机制层：Loop = gen() + check() + stop()
  基础层：Token + Embedding（LLM 怎么读文字）
  框架层：LangChain + LangGraph（怎么写 Agent）
  优化层：Promise.all 并行（怎么让 Agent 快）
  后  端：nest.js（怎么把 Agent 部署成产品）

Harness Engineering → AI 技术落地 → 商业价值
```

**知道 Agent 是什么 ≠ 能写出一个 Agent。** 今天跨出了从"知道"到"做到"的关键一步——用 LangChain 写出了一个真正能读文件的 Agent。概念可以看书学会，但框架的"手感"只能靠动手写代码积累。

下篇见。
