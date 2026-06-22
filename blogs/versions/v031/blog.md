# 从无状态到多智能体协作：一个 AI Native 开发者的 Agent 工程化实践

## 引言

v029 搞懂了 Agent 的四块基石——LLM 是大脑，Tools 是手脚，Reasoning 是思考过程，Context 是记忆。

v030 搞懂了 Loop——不是写 Prompt，而是设计循环。Completion → Check → 退出或重试。让 AI 自己跑，你去喝咖啡。

但这两个认知加在一起，有一个隐含的问题没有回答：

**Agent 的代码到底怎么写？**

你知道 Agent = LLM + Tools + Reasoning。你知道 Loop = gen() + check() + stop()。但当你打开编辑器，面对一个空白文件，你要怎么把这堆概念变成一个能跑的程序？

更重要的是——**一个 Agent 不够用的时候怎么办？** 一个复杂任务，需要前端专家、后端专家、运维专家各司其职，你不可能让一个 Agent 同时扮演所有角色然后指望它不出错。

```
v029 ──→ v030 ──→ v031 今天
Agent    Loop     工程化实践
是什么    怎么自动化  怎么写代码、怎么协作
```

今天的三块内容，正好回答这两个问题：

1. **LLM 的无状态本质**——理解底层约束，才知道为什么要这样写代码
2. **LangGraph 搜索 Agent**——第一个真正能跑的 Agent 代码
3. **多智能体协作系统**——Supervisor 模式，让多个专家 Agent 协同工作

## 一、LLM 的无状态本质

在写任何 Agent 代码之前，先搞清楚一个底层事实：**LLM 的 API 调用是无状态的。**

### 什么是无状态

```
HTTP 协议是无状态的：

  请求1: "我的名字叫零零发"  ──→  LLM  ──→  "好的，零零发"
  请求2: "我叫什么名字？"    ──→  LLM  ──→  "??? 我不知道你是谁"
```

每一次 HTTP 请求都是独立的。服务器不会记住你是谁、你之前说过什么。这不是 LLM 的设计缺陷——这是 HTTP 协议的本质。所有的 Web 服务（RESTful API）都是这样工作的。

```
无状态的好处：
  ├── 服务器不需要记住每个客户端的状态
  ├── 任何一台服务器都能处理你的请求（水平扩展）
  └── 高并发、高可用

无状态的代价：
  └── LLM 不知道"上一轮对话"发生了什么
```

### 手动带上全部历史

既然服务器不记，那就客户端自己记。**每次请求，把完整的对话历史一起发过去：**

```javascript
const chatHistory = [
  { role: 'system', content: '你是一个严谨的助手' },
]

// 第一次请求：告诉模型一个信息
chatHistory.push({ role: 'user', content: '请记住，我的名字叫零零发' })
const response1 = await client.chat.completions.create({
  model: 'deepseek-v4-flash',
  messages: chatHistory,
})
chatHistory.push({ role: 'assistant', content: response1.choices[0].message.content })

// 第二次请求：直接问
chatHistory.push({ role: 'user', content: '我叫什么名字' })
const response2 = await client.chat.completions.create({
  model: 'deepseek-v4-flash',
  messages: chatHistory,  // 完整历史一起发
})
// 模型回复："你叫零零发"
```

**关键：assistant 的回复也要存进 chatHistory。** 很多人只存 user 的消息，漏了 assistant 的——这会导致模型"失忆"，因为它不知道自己之前说过什么。

### chatHistory 的三个问题

这个方案能跑，但有三个致命问题：

```
问题一：Token 开销持续增长

  第1轮: messages = [system, user1, assistant1]          → 200 tokens
  第5轮: messages = [system, user1, a1, ..., user5, a5]  → 1000 tokens
  第20轮: messages = [system, ..., user20, a20]           → 4000 tokens
  
  聊得越多，每轮的 Token 消耗越大
```

```
问题二：上下文窗口有限

  LLM 的上下文窗口有上限（比如 128K tokens）
  一旦超出，要么报错，要么被截断
  一次长时间的对话，迟早会撞墙
```

```
问题三：哪些该留，哪些该删？

  不能全删——重要的对话要保留
  不能全留——Token 烧不起
  
  LRU（最近最少使用）？但一次对话可能还没完成，删掉就断了
  按轮次删？但早期的关键信息可能比最近的闲聊更重要
```

> **这不是一个能完美解决的问题——它是一个需要权衡的工程问题。** Token 预算有限，你要决定"留下什么、丢弃什么"。这也是为什么 Context Engineering（上下文工程）会成为一个重要方向。

## 二、工程化思维的四级跃迁

理解了无状态的本质，就能看清一条清晰的进化路线：

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Level 1: Prompt Engineering（提示词工程）                │
│  ─────────────────────────────────────                   │
│  "怎么写 Prompt 让 AI 回答更好"                           │
│  - System Prompt 设计                                    │
│  - Few-shot 示例                                         │
│  - 输出格式控制                                           │
│  - 本质：抽卡，Prompt 质量提升抽到金卡的概率               │
│                                                         │
│  Level 2: Context Engineering（上下文工程）               │
│  ─────────────────────────────────────                   │
│  "怎么给 AI 提供正确的上下文信息"                          │
│  - RAG（检索增强生成）                                    │
│  - 知识库 / claude.md / agent.md                         │
│  - MCP Skill                                             │
│  - 本质：让 AI 看到它需要看到的信息                       │
│                                                         │
│  Level 3: Loop Engineering（循环工程）                    │
│  ─────────────────────────────────────                   │
│  "怎么让 AI 自己反复迭代直到做好"                         │
│  - gen() + check() + stop()                              │
│  - 自动纠错、自动重试                                     │
│  - 本质：把人从盯 AI 干活中解放出来                       │
│                                                         │
│  Level 4: Harness Engineering（驾驭工程）                 │
│  ─────────────────────────────────────                   │
│  "怎么编排多个 AI 协同工作"                               │
│  - Multi-Agent 协作                                      │
│  - Supervisor / Router / Orchestrator                    │
│  - 本质：从"一个 AI 干活"到"一支 AI 团队干活"             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**每一级都不是替代上一级，而是包含上一级。** Context 包含 Prompt，Loop 包含 Context，Harness 包含 Loop。

今天的学习，正好覆盖了 Level 3 到 Level 4 的跃迁——从单个 Agent 的 LangGraph 实现，到多 Agent 的协作系统。

## 三、用 LangGraph 构建搜索 Agent

v029 讲了 Agent 的概念：LLM + Tools + Reasoning。但概念是抽象的——今天要把它变成能跑的代码。

### LangGraph 是什么

LangGraph 是 LangChain 生态中的一个库，专门用来构建 Agent 工作流。它的核心思想是**图（Graph）**：

```
LangGraph 的三个核心概念：

  Node（节点）   → 一个执行单元（调用 LLM、调用工具、处理数据）
  Edge（边）     → 节点之间的连接（执行完 A 接着执行 B）
  State（状态）  → 在节点之间传递的数据（对话历史、中间结果）
```

```
┌──────────────────────────────────────────┐
│           StateGraph                     │
│                                          │
│   ┌─────────┐    edge    ┌─────────┐    │
│   │  Node A  │ ────────→ │  Node B  │    │
│   │ (调用LLM)│           │ (调用工具)│    │
│   └─────────┘           └─────────┘    │
│        │                                 │
│        │  conditional edge               │
│        │  (根据条件走不同路径)             │
│        ▼                                 │
│   ┌─────────┐                            │
│   │  Node C  │                            │
│   │ (结束)    │                            │
│   └─────────┘                            │
│                                          │
│   State: 在所有节点之间共享的数据          │
└──────────────────────────────────────────┘
```

### 搜索 Agent 完整代码解析

这个 Agent 的功能：接收一个问题，自动判断是否需要搜索，如果需要就调用 Tavily 搜索工具，拿到搜索结果后让 LLM 组织答案。

#### 第一步：初始化工具和模型

```javascript
import { TavilySearch } from "@langchain/tavily"
import { ChatOpenAI } from "@langchain/openai"
import { HumanMessage } from "@langchain/core/messages"
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph"
import { ToolNode } from "@langchain/langgraph/prebuilt"

// 初始化搜索工具
const tavilyTool = new TavilySearch({ maxResults: 3 })
const tools = [tavilyTool]
const toolNode = new ToolNode(tools)

// 初始化模型，并绑定工具
const model = new ChatOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  configuration: { baseURL: process.env.DEEPSEEK_BASE_URL },
  model: "deepseek-chat",
  temperature: 0,
}).bindTools(tools)
```

**两个关键点：**

- `ToolNode` 是 LangGraph 提供的内置节点，它会自动解析 LLM 返回的 tool_calls，执行对应的工具，把结果封装成消息
- `.bindTools(tools)` 告诉模型"你有哪些工具可用"。模型在推理时会决定是否调用工具——如果它觉得需要搜索，就会返回 tool_calls；如果觉得不需要，直接返回文字回答

#### 第二步：定义流程判断函数

```javascript
const shouldContinue = ({ messages }) => {
  const lastMsg = messages[messages.length - 1]
  return lastMsg.tool_calls?.length ? "tools" : "__end__"
}
```

**这是整个 Agent 的"决策中枢"。** 它检查 LLM 的最后一条回复：

```
LLM 回复了什么？

  ├── 包含 tool_calls（想调用工具）
  │     → 走 "tools" 路径 → ToolNode 执行工具 → 结果回到 LLM
  │
  └── 不包含 tool_calls（直接回答了）
        → 走 "__end__" 路径 → 结束
```

**这个函数实现了 Loop 的"检查"逻辑。** 不是用另一个 LLM 来检查（像 v030 的 check()），而是用 LLM 自身的行为来判断——如果它返回了 tool_calls，说明它还没完成，需要工具辅助；如果没有，说明它已经能直接回答了。

#### 第三步：定义模型调用节点

```javascript
const callModel = async (state) => {
  const reply = await model.invoke(state.messages)
  return { messages: [reply] }
}
```

**这是 Agent 的"大脑"。** 接收当前的全部消息（包括之前所有轮次的对话和工具返回结果），调用 LLM，返回新的回复。

注意返回值的格式：`{ messages: [reply] }`。LangGraph 会自动把 `[reply]` 追加到 state.messages 中——这就是 `MessagesAnnotation` 的魔力，它内置了一个 reducer，自动合并消息列表。

#### 第四步：构建图

```javascript
const graphBuilder = new StateGraph(MessagesAnnotation)
  .addNode("model", callModel)
  .addNode("tools", toolNode)
  .addEdge("__start__", "model")
  .addConditionalEdges("model", shouldContinue)
  .addEdge("tools", "model")

const agentGraph = graphBuilder.compile()
```

**用代码画出 Agent 的流程图：**

```
           ┌──────────────────────────────────┐
           │          agentGraph               │
           │                                  │
  start ──→│  model ──→ shouldContinue        │
           │    ↑          │          │        │
           │    │          │          │        │
           │    │     "tools"    "__end__"     │
           │    │          │          │        │
           │    │          ▼          ▼        │
           │    └──── tools            end     │
           │                                  │
           └──────────────────────────────────┘
```

翻译成自然语言：

1. **start → model**：用户提问，交给 LLM
2. **model → shouldContinue**：LLM 回复后，检查是否需要工具
3. **shouldContinue → tools**：需要工具 → 执行工具，结果回到 model
4. **shouldContinue → end**：不需要工具 → 直接结束

**这就是 v030 讲的 Loop 的工程实现。** model → check → tools/model → check → ... → end。只不过这个 Loop 的 check 逻辑不是"校验文案质量"，而是"LLM 是否还需要工具辅助"。

#### 第五步：运行

```javascript
async function runAgent() {
  const res = await agentGraph.invoke({
    messages: [new HumanMessage({ content: "2026年人工智能的发展趋势" })],
  })
  console.log(res.messages[res.messages.length - 1].content)
}
runAgent().catch(console.error)
```

整个过程是自动的：
1. 你问"2026年人工智能的发展趋势"
2. LLM 判断：这个问题需要最新信息，我应该搜索 → 返回 tool_calls
3. ToolNode 执行 Tavily 搜索 → 返回搜索结果
4. LLM 拿到搜索结果 → 组织成完整回答
5. LLM 判断：信息够了，直接回答 → 结束

**你只写了一行代码（invoke），Agent 自动跑了两轮 LLM 调用 + 一次工具调用。** 这就是 LangGraph 的价值——它把 Agent Loop 的控制流封装好了，你只需要定义节点和边。

## 四、多智能体协作：Supervisor 模式

搜索 Agent 解决了"一个 Agent 用工具干活"的问题。但现实中，很多任务不是一个人能搞定的。

**"我要开发一个个人学习网站"——这个问题需要前端、后端、运维三个领域的专业知识。** 你当然可以让一个 Agent 啥都干，但它的回答大概率是"啥都沾一点，啥都不精"。

### Supervisor 模式的设计思想

```
传统模式：一个全能 Agent

  用户 ──→ Agent（前端+后端+运维）──→ 一个混杂的回答
  
  问题：角色冲突、深度不够、上下文混乱
```

```
Supervisor 模式：一个管理多个专家

  用户 ──→ Supervisor ──→ 前端专家 ──→ Supervisor
                       ──→ 后端专家 ──→ Supervisor
                       ──→ 运维专家 ──→ Supervisor
                       ──→ 编译报告 ──→ 用户

  优势：各司其职、深度专业、结果综合
```

**Supervisor 是"项目经理"，不写代码，只做决策：**
- 分析任务需求
- 决定下一步该让谁干活
- 收集所有专家意见后，编译最终报告

### 共享状态：TeamState

多 Agent 协作的第一个问题是**信息共享**——每个专家的意见，其他专家和 Supervisor 都要能看到。

```typescript
const TeamState = Annotation.Root({
  task: Annotation<string>,                    // 任务描述
  messages: Annotation<{ role: string, content: string }[]>({
    reducer: (current, update) => current.concat(update),  // 合并新消息
    default: () => [],                         // 默认空列表
  }),
  next: Annotation<string>,                    // 下一步由谁来干
  finalReport: Annotation<string>,             // 最终报告
})
```

**TeamState 是所有 Agent 共享的"白板"。** 任何人写在白板上的内容，其他人都能看到。

关键设计是 `messages` 的 `reducer`——它不是替换，而是追加。每次有新的消息（不管是 Supervisor 的指令、前端专家的意见、还是后端专家的方案），都拼接到消息列表后面。这样每个 Agent 都能看到之前所有人说了什么。

### 角色映射与消息格式

LangChain 的 LLM 接口只认标准角色（system / assistant / user），但我们的 Agent 有自定义角色（supervisor / frontend_expert / backend_expert）。需要一个桥接层：

```typescript
function mapRole(role: string): string {
  const roleMap = {
    supervisor: "system",
    frontend_expert: "assistant",
    backend_expert: "assistant",
    devops_expert: "assistant",
    user: "user",
  }
  return roleMap[role] || "user"
}

function formatMessages(messages) {
  return messages.map(msg => ({
    role: mapRole(msg.role),
    content: `[${msg.role}]: ${msg.content}`,  // 保留语义标识
  }))
}
```

**为什么不直接用标准角色？** 因为语义。如果前端专家和后端专家都映射成 "assistant"，LLM 看到两条 assistant 消息，分不清谁是谁。加一个 `[frontend_expert]:` 前缀，LLM 就知道"这条是前端专家说的，那条是后端专家说的"。

### Supervisor 节点：决策者

```typescript
async function supervisor(state) {
  const systemPrompt = `You are a supervisor managing a development team:
  
  Team members:
  - frontend_expert: UI/UX, React, CSS, component, design
  - backend_expert: API design, database, server logic, auth
  - devops_expert: deployment, CI/CD, infrastructure, scaling

  Your job:
  1. Analyze the user's task
  2. Decide which expert should work next
  3. If enough information has been gathered, respond "FINISH"

  Reply with ONLY one word:
  - frontend_expert backend_expert devops_expert or FINISH`

  const msg = await llm.invoke([
    { role: "system", content: systemPrompt },
    ...formatMessages(state.messages),
    { role: "user", content: `[CURRENT_TASK]: ${state.task}\n\n[YOUR INSTRUCTION]: who should work next?` },
  ])

  const decision = msg.content.toString().trim().toLowerCase()
  return {
    next: decision,
    messages: [{ role: "supervisor", content: `-> Assigning to ${decision}` }],
  }
}
```

**Supervisor 的设计精髓：输出约束为一个词。** 不是让 LLM 自由发挥写一段分析，而是强制它只输出 `frontend_expert`、`backend_expert`、`devops_expert` 或 `finish` 中的一个。

为什么？因为 Supervisor 的输出会被 `supervisorRouter` 函数解析，映射到图的边——如果 LLM 输出一大段话，Router 无法判断该走哪条路。**约束输出格式，就是让 AI 的输出能被代码可靠地消费。**

### 专家节点：执行者

每个专家都是一个独立的 LLM 调用，有自己的 System Prompt 定义专业领域：

```typescript
async function frontendExpert(state) {
  const msg = await llm.invoke([
    { role: "system", content: "You are a senior frontend engineer. Provide detailed, production-ready frontend solutions with code examples." },
    { role: "user", content: state.task },
  ])
  return {
    messages: [{ role: "frontend_expert", content: msg.content }],
  }
}

async function backendExpert(state) {
  const msg = await llm.invoke([
    { role: "system", content: "You are a senior backend engineer. Provide detailed API design, database schemas, and server architecture with code examples." },
    { role: "user", content: state.task },
  ])
  return {
    messages: [{ role: "backend_expert", content: msg.content }],
  }
}

async function devopsExpert(state) {
  const msg = await llm.invoke([
    { role: "system", content: "You are a senior devops engineer. Provide deployment strategies, CI/CD configurations, and infrastructure designs." },
    { role: "user", content: state.task },
  ])
  return {
    messages: [{ role: "devops_expert", content: msg.content }],
  }
}
```

**三个专家，三套 System Prompt，三个独立的 LLM 调用。** 它们共享同一个 TeamState（能看到彼此的输出），但各自的"专业视角"由 System Prompt 定义。

### 路由函数：图的导航

```typescript
// Supervisor 决策后，路由到对应专家
function supervisorRouter(state) {
  if (state.next === "finish") return "finish"
  if (["frontend_expert", "backend_expert", "devops_expert"].includes(state.next)) {
    return state.next
  }
  return "finish"  // 默认结束，防止死循环
}

// 专家干完活，回到 Supervisor
function expertRouter(state) {
  return "supervisor"
}
```

**两个路由函数，控制了整个协作流程的方向：**
- `supervisorRouter`：Supervisor 说让谁干，就路由到谁
- `expertRouter`：专家干完活，一律回到 Supervisor（等待下一个指令）

注意 `supervisorRouter` 有一个兜底的 `return "finish"`——如果 LLM 输出了意料之外的内容（比如一整段话而不是一个词），默认结束，防止死循环。**这是刹车机制，和 v030 的 needStop() 异曲同工。**

### 报告编译与图构建

```typescript
async function compileReport(state) {
  const msg = await llm.invoke([
    { role: "system", content: "Synthesize all expert inputs into a comprehensive final report. Structure it clearly with sections." },
    ...formatMessages(state.messages),
  ])
  return { finalReport: msg.content }
}

const teamWorkflow = new StateGraph(TeamState)
  .addNode("supervisor", supervisor)
  .addNode("frontend_expert", frontendExpert)
  .addNode("backend_expert", backendExpert)
  .addNode("devops_expert", devopsExpert)
  .addNode("compileReport", compileReport)
  .addEdge("__start__", "supervisor")
  .addConditionalEdges("supervisor", supervisorRouter, {
    frontend_expert: "frontend_expert",
    backend_expert: "backend_expert",
    devops_expert: "devops_expert",
    finish: "compileReport",
  })
  .addEdge("frontend_expert", "supervisor")
  .addEdge("backend_expert", "supervisor")
  .addEdge("devops_expert", "supervisor")
  .addEdge("compileReport", "__end__")
  .compile()
```

**画出完整的协作流程图：**

```
                    ┌──────────────┐
          start ──→ │  supervisor   │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
     ┌────────────┐ ┌────────────┐ ┌────────────┐
     │  frontend   │ │  backend   │ │  devops    │
     │  _expert    │ │  _expert   │ │  _expert   │
     └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
           │              │              │
           └──────────────┼──────────────┘
                          │
                          ▼
                    ┌──────────────┐
                    │  supervisor   │ ← 循环：继续分配或结束
                    └──────┬───────┘
                           │
                      finish?
                           │
                           ▼
                    ┌──────────────┐
                    │ compileReport │
                    └──────┬───────┘
                           │
                           ▼
                          end
```

### 运行效果

```typescript
const result = await teamWorkflow.invoke({
  task: "我要开发一个个人学习网站"
})
console.log(result)
```

执行过程：
1. Supervisor 分析任务 → "先让前端专家来" → 路由到 frontend_expert
2. 前端专家输出 UI/UX 方案、React 组件设计、CSS 架构 → 回到 Supervisor
3. Supervisor 看到前端方案 → "接下来让后端专家来" → 路由到 backend_expert
4. 后端专家输出 API 设计、数据库 schema、服务器架构 → 回到 Supervisor
5. Supervisor 看到前后端方案 → "让运维专家来" → 路由到 devops_expert
6. 运维专家输出部署策略、CI/CD 配置 → 回到 Supervisor
7. Supervisor 判断信息足够了 → "FINISH" → 路由到 compileReport
8. compileReport 综合所有专家意见，生成结构化的最终报告

**整个过程全自动。你只提供了一个任务描述，Supervisor 自动安排了三个专家依次工作，最后综合出一份完整方案。**

## 五、从单 Agent 到多 Agent 的思维跃迁

把今天的三个代码放在一起看，能发现一条清晰的进化线：

```
index.mjs（无状态演示）
  │
  │  理解底层约束：LLM 是无状态的
  │  每次请求都要带上完整历史
  │
  ▼
searchAgent.ts（单 Agent + 工具）
  │
  │  用 LangGraph 解决了"一个 Agent 怎么写"
  │  StateGraph + Node + Edge + Conditional Routing
  │  Agent 自动决定是否调用工具
  │
  ▼
Coordinator.ts（多 Agent 协作）
  │
  │  用 Supervisor 模式解决了"多个 Agent 怎么协作"
  │  共享状态 + 角色路由 + 报告编译
  │  从"一个 AI 干活"到"一支 AI 团队干活"
```

### 三个层次的对比

```
┌───────────────────────────────────────────────────────────┐
│                    三个层次对比                             │
│                                                           │
│  层次          无状态调用    单Agent      多Agent           │
│  ─────────────────────────────────────────────────────    │
│  复杂度        低            中            高               │
│  LLM调用次数    1次          1~N次        N~M次             │
│  工具使用       无            有            有               │
│  自主决策       无            有（是否用工具） 有（谁来干）    │
│  协作能力       无            无            有               │
│  适用场景       简单问答       单一任务      复杂项目          │
│                                                           │
│  代码量        ~10行         ~60行        ~160行            │
│  框架依赖       无            LangGraph    LangGraph         │
└───────────────────────────────────────────────────────────┘
```

### 设计模式的演进

```
无状态调用：
  你 → LLM → 结果
  没有任何"智能"，就是一次 HTTP 请求

单 Agent（searchAgent）：
  你 → Agent → [LLM ↔ 工具] → 结果
  Agent 有自主性：能决定是否调用工具，能循环执行
  但只能处理单一维度的任务

多 Agent（Coordinator）：
  你 → Supervisor → [专家A ↔ 专家B ↔ 专家C] → 综合报告
  多个 Agent 各司其职，由 Supervisor 统筹调度
  能处理需要多领域知识的复杂任务
```

**这个演进的本质是什么？是"分工"。**

人类社会也是这样进化的——一个人啥都干（无状态调用）→ 一个人专注一件事（单 Agent）→ 一个团队协作（多 Agent）。AI 系统的设计，本质上是在复现人类组织的协作模式。

## 六、Agent 工程化的核心设计原则

从今天的三个代码中，可以提炼出几条 Agent 工程化的设计原则：

### 原则一：约束输出格式

```javascript
// Supervisor 的 prompt
"Reply with ONLY one word: frontend_expert backend_expert devops_expert or FINISH"

// check() 的 prompt
"只输出 JSON {pass: 布尔, fail: 数组}"
```

**LLM 的自由输出不能被代码直接消费。** 你必须约束它的输出格式——JSON、枚举值、固定模板——这样代码才能解析、路由、决策。

### 原则二：角色分离

```javascript
// gen() 的角色："你是小红书博主"（创造者）
// check() 的角色："你是质检员"（评审者）
// supervisor 的角色："你是项目经理"（决策者）
// expert 的角色："你是XX领域专家"（执行者）
```

**一个 LLM 调用只扮演一个角色。** 不要让同一个调用又生成又检查又决策——角色混杂会导致输出质量下降。

### 原则三：共享状态，独立推理

```typescript
// TeamState 是共享的——所有人都能看到
// 但每个 Expert 的推理是独立的——各自用自己的 System Prompt
```

**信息要共享，决策要独立。** 就像一个团队——大家共享项目文档，但每个人做自己专业领域的判断。

### 原则四：始终有刹车

```javascript
// searchAgent: shouldContinue 判断是否结束
// Coordinator: supervisorRouter 兜底 return "finish"
// Loop: maxRound / maxToken / sameStop
```

**没有刹车的 Agent 系统就是一台烧钱机器。** 每一个循环、每一个路由决策，都要有兜底的退出机制。

## 结语

今天从三个层面完成了 Agent 的工程化认知：

1. **底层约束**：LLM API 是无状态的 HTTP 调用。要让它"记住"对话，必须手动带上 chatHistory。chatHistory 有 Token 增长、窗口限制、取舍权衡三个问题。这催生了从 Prompt Engineering 到 Harness Engineering 的四级进化

2. **单 Agent 实现**：用 LangGraph 的 StateGraph 把 Agent 概念变成代码。Node 是执行单元，Edge 是连接，State 是共享数据。搜索 Agent 的核心循环：model → shouldContinue → tools/end。LLM 自己决定是否需要工具，自动完成多轮调用

3. **多 Agent 协作**：Supervisor 模式让多个专家 Agent 协同工作。Supervisor 做决策（谁来干），Expert 做执行（怎么干），compileReport 做综合（最终报告）。共享 TeamState + 角色路由 + 报告编译，实现了从"一个 AI"到"一支 AI 团队"的跃迁

4. **设计原则**：约束输出格式、角色分离、共享状态独立推理、始终有刹车——四条 Agent 工程化的核心原则

```
v029 ──→ v030 ──→ v031
是什么    怎么跑    怎么写

Agent    Loop     工程化
概念      自动化    代码实现

知道"Agent = LLM+Tools"  →  知道"Loop = gen+check+stop"  →  知道"用 LangGraph 写出来，用 Supervisor 协作起来"
```

三十一天，从"AI 是什么"写到"多智能体协作系统"。但真正的挑战才刚刚开始——当 Agent 的数量从 3 个变成 30 个，当任务从"写方案"变成"写代码并部署"，当错误处理从"重试"变成"自我修复"——那时候需要的，是更复杂的 Harness 工程。

**Agent 工程化的终极目标：让 AI 团队像人类团队一样协作——有分工、有沟通、有决策、有兜底。今天搭好了骨架，接下来是血肉。**

下篇见。
