# Promise 与 LangChain 的完美结合：用 ReAct Loop 打造第一个编程助手 Agent

## 引言

第二十九天写了 TodoList 的 PRD 和技术架构——学会了**怎么设计一个产品**。

第三十天，问题升级：**能不能让 AI 自己把这个产品写出来？**

这不是"调 API 生成代码"那种简单的事。真正能让 AI 自主编程的，是 **Agent**——它不只是回答问题，它能读文件、写代码、执行命令、看结果、然后决定下一步做什么。

今天的内容分两段，上段打基础，下段动手造：

```
第三十天 上 ──→ 第三十天 下
Agent 工作方式    Promise × LangChain 实战
ReAct 框架        while 循环 + 并行工具调用
Promise 基础      第一个编程助手 Agent
```

**今天的核心线索：Promise 和 LangChain 是怎么结合在一起的。** 这不是两个独立的知识点，而是一个完整的技术栈——Promise 解决"快"的问题，LangChain 解决"对"的问题，两者合在一起，才是高性能 Agent 的底层。

## 一、Agent 与普通 AI 对话，差别到底在哪里？

### 结构决定工作方式

```
普通 AI 对话：
  你问 → 它答 → 结束

  案例："帮我写一封邮件"
  LLM 写完 → 任务终止
  问答机器，输出一次，没有后续

Agent：
  你给任务 → 它拆任务 → 决定下一步 → 调工具 → 看结果
  → 再思考 → 再行动 → 再观察 → ... → 任务完成
```

**Agent 有一个持续运转的结构。** 它不是"一问一答"，而是"理解任务 → 制定计划 → 执行步骤 → 检查结果 → 决定是否继续"的循环。

### Agent 的自动终止条件

Agent 不会无限循环下去。它会自己判断什么时候停：

- 任务完成，生成了最终结果
- 超出最大循环次数（防止死循环）
- 超出 token 上限
- 连续多次返回相同结果（卡住了）
- 工具调用失败且无法恢复

## 二、ReAct：Agent 的标准工作框架

### 三个核心动作

**ReAct = Reason（思考）+ Act（行动）+ Observe（观察）**

注意：ReAct 不是 LangChain 那种开发框架——它是 Agent 本身的工作流程标准，跟用什么库没关系。

### 实战推演：竞品分析 Agent

```
任务："帮我分析竞品，写一份报告"

第一轮
  Reason（思考）："需要搜索竞品信息"
  Act（行动）：调用搜索工具，查三家竞品的最新动态
  Observe（观察）：信息量挺大，涵盖了产品动态和市场份额
  → 第一轮结束，信息不够，继续

第二轮
  Reason（思考）："还缺少财务数据，需要对比营收"
  Act（行动）：调股市 API，抓取三家公司的财报数据
  Observe（观察）：拿到了营收和增长率数据
  → 第二轮结束，数据够了但还没组织

第三轮
  Reason（思考）："信息足够了，可以开始写报告"
  Act（行动）：整理信息，生成结构化报告
  Observe（观察）：报告完整，覆盖产品、财务、市场三个维度
  → 任务完成，输出报告
```

**每一轮的观察，都会成为下一轮思考的输入。** 这就是 ReAct 循环的核心——不是一次性想清楚所有步骤，而是一步一步来，每一步都基于前一步的结果做决策。

### Tool Use：Agent 的手和脚

Agent 最核心的能力是 Tool Use——**工具是 Agent 的手和脚，没有工具，它只能在脑子里转。** 转完之后还是只有文字。

常见工具类型：

| 工具类型 | 能力 | 代表产品 |
|---------|------|---------|
| 搜索工具 | 上网查实时信息 | Perplexity |
| 代码执行器 | 运行代码、看结果 | Claude Code |
| 文件读写 I/O | 读文件、写文件 | Cursor |
| 浏览器操控 | 打开网页、点击、提交 | Manus |
| API 调用 | 调第三方服务 | GPT Actions |

**工具的覆盖范围，直接决定 Agent 的能力边界。** 这就是为什么选择 Agent 产品时，第一要看的就是它接了多少工具。

## 三、Promise：异步编程的基石

上篇学了 Promise 基础，这里快速过一下核心概念——因为它们马上要在 Agent 的代码里用到。

### Promise 的三种状态

```
new Promise → Pending（等待中）
                  │
                  ├── resolve() → Fulfilled（成功）
                  │
                  └── reject()  → Rejected（失败）

状态只能变化一次，且不可逆。
Pending → Fulfilled，或 Pending → Rejected。
一旦变了，永远不变。
```

### 为什么需要 Promise.all？

```
// ❌ 串行：两个请求没有依赖关系，却要等一个完了再等另一个
const story = await getStory()    // 等 800ms
const ratp = await getRatp()      // 再等 1200ms
// 总耗时 ≈ 2000ms

// ✅ 并行：两个请求同时发出
const [story, ratp] = await Promise.all([getStory(), getRatp()])
// 总耗时 ≈ max(800ms, 1200ms) = 1200ms
```

**Promise.all 的核心规则：**
- 接收一个 Promise 数组，返回一个新 Promise
- 所有 Promise 都 resolve 后，它才 resolve
- resolve 的结果**按参数顺序返回**，不管谁先完成
- 只要有一个 reject，整体就 reject——走 catch，拿到第一个失败的原因

```
时间线（并行）：
  getStory()  ════════╗
  getRatp()   ════════════════╗
  0ms                   800ms  1200ms
                          ↑       ↑
                      story先完成 ratp后完成
                      但Promise.all等两个都完成才返回
                      返回顺序：[story结果, ratp结果]
```

### async 函数：本质就是 Promise

```javascript
async function getStory() {
    const res = await fetch('https://v1.hitokoto.cn/?c=i&encode=json')
    return res.json()
}
// getStory() 的返回值就是 Promise 实例
// return 的结果就是 resolve 的结果
```

**这个认知很重要——因为后面在 Agent 的 while 循环里，我们会用 `map + async` 把工具调用转成 Promise 数组，然后交给 `Promise.all` 并行执行。**

## 四、LangChain 核心概念速览

下篇正式开始搭建 Agent。先快速认识 LangChain 的四个核心抽象（v033 详细讲过，这里只列关键点）：

### 1. ChatOpenAI——统一 LLM 接口

```javascript
const model = new ChatOpenAI({
    modelName: 'deepseek-v4-flash',
    apiKey: process.env.DEEPSEEK_API_KEY,
    temperature: 0,    // Agent 的工具调用不需要"创意"，需要准确
    configuration: { baseURL: 'https://api.deepseek.com/v1' },
})
```

### 2. tool()——声明式工具定义

```javascript
const readFileTool = tool(
    async ({ filePath }) => {              // 处理函数
        return await fs.readFile(filePath, 'utf-8')
    },
    {                                      // 描述对象
        name: 'read_file',
        description: '读取文件内容...',
        schema: z.object({
            filePath: z.string().describe('文件路径')
        })
    }
)
```

**工具 = 处理函数 + 描述对象。** 描述对象是 LLM 理解工具的唯一入口——description 的质量决定调用准确率。

### 3. bindTools()——一键注册

```javascript
const modelWithTools = model.bindTools(tools)
// 等价于原生 SDK 的 { tools: [...], tool_choice: 'auto' }
```

### 4. 四种 Message 类型

| LangChain 类 | 原生 role | 用途 |
|-------------|----------|------|
| `SystemMessage` | `system` | 设定 AI 角色、能力、行为规范 |
| `HumanMessage` | `user` | 用户的问题 |
| `AIMessage` | `assistant` | LLM 的回答（含 tool_calls） |
| `ToolMessage` | `tool` | 工具执行结果，通过 `tool_call_id` 关联 |

**LangChain 对原生 OpenAI 返回做了增强：** 原生返回的 tool_calls 藏在 `additional_kwargs` 里，需要手动解析。LangChain 的 `invoke()` 方法不仅原样输出，还会细心地帮你把 `tool_calls` 解析好放在 `AIMessage` 上——这就是框架的工程化价值。

## 五、核心实战：Promise × LangChain 打造文件读取 Agent

这是今天最重要的部分——**把 Promise 的并行能力注入到 LangChain 的 Agent 循环中。**

先看整体架构：

```
┌─────────────────────────────────────────────────────┐
│                  Agent 主循环                        │
│                                                     │
│  用户提问                                            │
│     │                                               │
│     ▼                                               │
│  ┌──────────┐    有 tool_calls    ┌──────────────┐  │
│  │ LLM 推理 │ ─────────────────→ │ Promise.all  │  │
│  │ (invoke) │                    │ 并行执行工具   │  │
│  └──────────┘                    └──────┬───────┘  │
│       │                                 │          │
│       │ 无 tool_calls                   ▼          │
│       │                          ┌──────────────┐  │
│       │                          │ ToolMessage  │  │
│       │                          │ 追加到messages│  │
│       │                          └──────┬───────┘  │
│       │                                 │          │
│       │                                 ▼          │
│       │                          ┌──────────────┐  │
│       └────────────────────────→ │  再次 invoke │  │
│              最终回答             └──────────────┘  │
│                                   while 循环继续    │
└─────────────────────────────────────────────────────┘
```

### 第一步：初始化模型和工具

```javascript
import 'dotenv/config'
import { ChatOpenAI } from '@langchain/openai'
import { tool } from '@langchain/core/tools'
import { HumanMessage, SystemMessage, ToolMessage, AIMessage } from '@langchain/core/messages'
import fs from 'node:fs/promises'
import { z } from 'zod'

const model = new ChatOpenAI({
    modelName: 'deepseek-v4-flash',
    apiKey: process.env.DEEPSEEK_API_KEY,
    temperature: 0,    // 工具调用要的是确定性，不是创意
    configuration: { baseURL: 'https://api.deepseek.com/v1' },
})

const readFileTool = tool(
    async ({ filePath }) => {
        const content = await fs.readFile(filePath, 'utf-8')
        console.log(`[工具调用] read_file(${filePath}) 成功读取 ${content.length} 字节`)
        return content
    },
    {
        name: 'read_file',
        description: `用此工具来读取文件内容。当用户要求读取文件、
        查看代码、分析文件内容时，调用此工具。`,
        schema: z.object({
            filePath: z.string().describe('要读取的文件路径')
        })
    }
)

const tools = [readFileTool]
const modelWithTools = model.bindTools(tools)
```

**`temperature: 0`** 是关键——Agent 的工具调用环节最需要的是确定性。让 LLM 准确地选择工具、准确地填参数，不要让"创意"来干扰。

### 第二步：构建消息

```javascript
const messages = [
    new SystemMessage(`
        你是一个代码助手，可以使用工具读取文件并解释代码。
        
        工作流程：
        1. 用户要求读取文件时，立即调用 read_file 工具
        2. 等待工具返回文件内容
        3. 基于文件内容进行分析和解释

        可用工具：
        - read_file: 读取文件内容（使用此工具来获取文件内容）
    `),
    new HumanMessage('请读取 src/tool.mjs 文件内容并解释代码'),
]
```

**System prompt 三要素：角色定义 + 工作流程 + 可用工具列表。** 写清晰了，Agent 行为就可预测。

### 第三步：ReAct 主循环——Promise.all 登场

这是整篇文章的核心——**Promise.all 如何驱动 Agent 的并行工具调用：**

```javascript
let response = await modelWithTools.invoke(messages)
messages.push(response)

while (response.tool_calls && response.tool_calls.length > 0) {
    // ┌─────────────────────────────────────────┐
    // │  🔑 关键：Promise.all 并行执行所有工具  │
    // │  如果 LLM 返回了 3 个 tool_call，       │
    // │  它们会同时执行，而不是一个一个来       │
    // └─────────────────────────────────────────┘
    
    console.log(`\n检测到 [${response.tool_calls.length}] 个工具调用`)
    
    const toolResult = await Promise.all(
        response.tool_calls.map(async (toolCall) => {
            // 第一步：找到对应工具
            const tool = tools.find(t => t.name === toolCall.name)
            if (!tool) {
                return `工具 ${toolCall.name} 不存在`
            }
            
            console.log(`[执行工具] ${toolCall.name}(${JSON.stringify(toolCall.args)})`)
            
            // 第二步：执行工具（带容错）
            try {
                const result = await tool.invoke(toolCall.args)
                return result
            } catch (err) {
                return `工具 ${toolCall.name} 执行失败：${err.message}`
            }
        })
    )
    // Promise.all 等所有工具执行完才返回
    // toolResult 数组的顺序 = tool_calls 数组的顺序
    
    // 第三步：把每个工具结果打包成 ToolMessage
    response.tool_calls.forEach((toolCall, index) => {
        messages.push(new ToolMessage({
            content: toolResult[index],
            tool_call_id: toolCall.id     // 🔑 id 关联，LLM 知道这是哪个调用的结果
        }))
    })
    
    // 第四步：把完整上下文交还给 LLM，让它决定下一步
    response = await modelWithTools.invoke(messages)
    messages.push(response)
}

// 循环结束 → LLM 不再要求调工具 → 生成最终回答
console.log(response.content)
```

### Promise 与 LangChain 结合的三层深度解析

#### 第一层：`map + async` 生成 Promise 数组

```javascript
response.tool_calls.map(async (toolCall) => { ... })
//                              ↑
//                    async 回调 → 返回值自动包装成 Promise
```

**`Array.map` 的回调是 `async` 函数 → 每个回调的返回值自动成为 Promise。** 所以 `.map(async ...)` 的结果就是一个 Promise 数组，可以直接喂给 `Promise.all`。

#### 第二层：`Promise.all` 并行等待

```javascript
const toolResult = await Promise.all([
    readFilePromise1,   // 读 config.js，耗时 500ms
    readFilePromise2,   // 读 package.json，耗时 300ms
    readFilePromise3,   // 读 README.md，耗时 800ms
])
// 总耗时 ≈ max(500, 300, 800) = 800ms
// 串行将是 500 + 300 + 800 = 1600ms
// 快了整整一倍
```

**LLM 一次可能返回多个 tool_call——这些调用之间通常没有依赖关系，完全可以并行。** Promise.all 让"多个工具调用"从串行累加变成并行取最大值。

#### 第三层：`ToolMessage` 的 `tool_call_id` 关联

```javascript
response.tool_calls.forEach((toolCall, index) => {
    messages.push(new ToolMessage({
        content: toolResult[index],       // Promise.all 返回的结果
        tool_call_id: toolCall.id         // 关联到 LLM 发出的那个调用
    }))
})
```

**Promise.all 的结果和 tool_calls 是一一对应的（数组顺序一致），所以可以用 `index` 精准关联。** LLM 通过 `tool_call_id` 知道"这个结果对应的是我刚才要求的那个操作"——这是多工具并行调用的关键设计。

### 完整的 ReAct 数据流回放

```
用户："请读取 src/tool.mjs 文件内容并解释代码"
    │
    ▼
messages = [SystemMessage, HumanMessage]
    │
    ▼
LLM.invoke(messages)
    │ LLM 推理："用户要我读文件 → 我不会读 → 但我有 read_file 工具"
    │ 返回 AIMessage（含 tool_calls）
    │ tool_calls: [{ id: "call_1", name: "read_file", args: { filePath: "src/tool.mjs" } }]
    ▼
while (response.tool_calls.length > 0)  ← 进入循环
    │
    ▼
Promise.all([readFileTool.invoke({ filePath: "src/tool.mjs" })])
    │ 执行工具，返回文件内容
    ▼
messages.push(new ToolMessage({
    content: "import 'dotenv/config'...",   ← 文件内容
    tool_call_id: "call_1"                  ← 关联
}))
    │
    ▼
LLM.invoke(messages)  ← 再次调用，messages 现在包含了工具结果
    │ LLM 看到文件内容 + tool_call_id 匹配
    │ 推理："文件内容拿到了，可以解释了"
    │ 返回 AIMessage（无 tool_calls，只含回答）
    ▼
while (response.tool_calls.length > 0)  ← false，跳出循环
    │
    ▼
输出最终回答："这个文件是一个 LangChain Agent 实现..."
```

**关键理解：`messages` 数组持续增长，是 LLM 的"记忆"。** 每一轮的工具调用结果都追加进去，LLM 看到越来越完整的上下文，最终做出最终回答。

## 六、向 Claude Code 看齐：编程 Agent 的下一步

今天写出了文件读取 Agent，但 Claude Code 能做的远不止读文件：

```
Claude Code 做编程任务的三步：
  1. 读文件（read_file）     ← 今天实现了
  2. 写文件（write_file）    ← 需要文件写入 Tool
  3. 执行命令（CLI Tool）    ← 需要 Node child_process
```

### Node 子进程：让 Agent 能执行命令

```javascript
import { spawn } from 'node:child_process'

// Node 主进程 → Agent 执行（单线程）
// 调用工具去执行命令行任务 → 分离出去，独立的子进程
// child_process 做完后，通过 IPC（进程间通信）告诉主进程结果
```

**为什么用子进程？** 因为 CLI 命令（如 `npm create vite`、`npm run dev`）可能需要很长时间，而且可能出错。把它们放在子进程里：
- 主进程不被阻塞
- 子进程崩溃不影响主进程
- IPC 通信拿到执行结果
- 标准输出和标准错误分开处理

### 手写一个 Claude Code Agent 的蓝图

```
任务："用 react + vite 创建一个 todolist 项目，并运行起来"

Agent 需要的工具：
  ├── read_file   ← 读取文件内容（今天已实现）
  ├── write_file  ← 写入文件内容
  └── cli_exec    ← 执行命令行命令（需要 child_process）

执行流程（ReAct）：
  第一轮：Reason → "需要创建 Vite 项目"
         Act → cli_exec("npm create vite@latest demo -- --template react")
         Observe → "项目创建成功，目录结构就绪"
  
  第二轮：Reason → "需要写 TodoList 组件代码"
         Act → write_file("src/App.jsx", todoAppCode)
         Observe → "文件写入成功"
  
  第三轮：Reason → "安装依赖并运行"
         Act → cli_exec("cd demo && npm install && npm run dev")
         Observe → "开发服务器启动在 localhost:5173"
  
  任务完成 ✓
```

**这就是 Claude Code 的底层原理——不过是一个精密的 ReAct 循环 + 精心设计的工具集 + 强大的 LLM 大脑。**

## 七、AI 工程化思维

### 工程目录结构

```
hello-langchain/
├── package.json          # 项目配置与依赖
├── node_modules/         # 第三方包
├── .env                  # 环境变量（API Key）
└── src/                  # 开发代码目录
    ├── index.mjs         # Hello LangChain 入口
    ├── tool.mjs          # Agent 主程序（ReAct 循环）
    └── node-exec.mjs     # Node 子进程执行
```

**`src/` 目录是工程化的基本标志。** 代码不进 src，就像衣服不放进衣柜——能穿，但乱。

### AI 工程的四层抽象

```
第一层：SDK 调用（原生 OpenAI SDK）
  → 手写 JSON Schema、手动拼 messages、手动解析 tool_calls

第二层：框架（LangChain）
  → tool() 声明式定义、bindTools() 一键注册、消息类型安全

第三层：编排（LangGraph）
  → StateGraph、条件路由、多 Agent 协作

第四层：平台（Harness Engineering）
  → 部署、监控、A/B 测试、商业落地
```

**每一层都在解决上一层留下的"手工活"。** 框架的价值不是"功能更多"，而是"让你少写胶水代码"。

## 结语

第三十天，从概念到代码，串起了三个关键主题：

### 1. ReAct：Agent 的心跳

```
Reason → Act → Observe → Reason → Act → Observe → ...
```

**不是"想好了再做"，而是"做一步看一步"。** 每一轮的观察结果，是下一轮思考的输入。这就是 Agent 和 Chatbot 的本质区别——Agent 有一个持续运转的循环结构。

### 2. Promise × LangChain：Agent 的加速引擎

```javascript
// 这三行代码背后是一个完整的并发模型：
const toolResult = await Promise.all(
    response.tool_calls.map(async (toolCall) => { ... })
)
```

- `map + async` → 把工具调用转成 Promise 数组
- `Promise.all` → 并行等待所有工具执行完成
- `ToolMessage + tool_call_id` → 精准关联结果

**Promise 解决"快"的问题（并行），LangChain 解决"对"的问题（类型安全 + 自动编排）。两者结合，才是高性能 Agent 的底座。**

### 3. 从"学概念"到"造轮子"

```
v029: Agent 是什么     → 概念层
v030: Agent 怎么跑     → 机制层（Loop）
v031: Agent 怎么写     → 工程化（LangGraph + Supervisor）
v032: LLM 怎么读       → 基础层（Token + Embedding）
─── 以上是"学概念" ───
v033: 框架怎么用       → 实战层（LangChain 入门）
v034（今天）:          → 实战层进阶（Promise + ReAct Loop）
─── 以下是"造轮子" ───
下一步: 手写编程 Agent  → Claude Code 迷你版
```

**今天的代码虽然只是一个文件读取 Agent，但它包含了所有编程 Agent 的核心基因：ReAct 循环 + 工具系统 + 消息管理 + 并行优化。** 加上文件写入和 CLI 执行工具，就是一个迷你版的 Claude Code。

### 第一个编程助手 Agent 技术总结

| 层次 | 核心技术 | 在代码中的体现 |
|------|---------|--------------|
| 工作流 | ReAct 框架 | `while (response.tool_calls)` 循环 |
| 大脑 | LLM（DeepSeek） | `modelWithTools.invoke(messages)` |
| 工具 | LangChain tool() | `readFileTool` + zod schema |
| 消息 | 四种 Message 类 | System/Human/AI/ToolMessage |
| 并行 | Promise.all | `map + async` → Promise 数组 |
| 容错 | try-catch | 工具执行失败不崩溃 |
| 关联 | tool_call_id | ToolMessage 精准对应 |

**知道 Agent 是什么 ≠ 能写出一个 Agent。** 今天的 while 循环、Promise.all 并行、ToolMessage 关联——这些不是"知识点"，是"手艺"。概念可以看书学会，但手艺只能靠敲代码积累。

下篇见。

---

*本篇内容基于第三十天学习笔记（上、下），重点呈现了 Promise 异步编程与 LangChain Agent 框架的结合实践。*
