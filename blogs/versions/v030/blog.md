# 从写 Prompt 到设计 Loop：一个 AI Native 开发者的自动化思维觉醒

## 引言

v029 搞懂了 Agent 的四块基石——LLM 是大脑，Tools 是手脚，Reasoning 是思考过程，Context 是记忆。Agent = 大脑 + 工具 + 信息。

但 Agent 有一个问题：**它需要你盯着。**

你写 Prompt → Agent 执行 → 你看结果 → 不满意 → 改 Prompt → 再来一轮。Agent 干活的时候，你还是要守在旁边，一轮一轮地对话。

```
写 Prompt ──→ Agent 干活 ──→ 检查结果 ──→ 不满意？
                                        │
                                   ┌────┴────┐
                                   │          │
                                   ▼          ▼
                              改 Prompt    通过，结束
                              再来一轮
```

**今天要解决的问题：能不能让 Agent 自己跑完这个循环？**

```
v029 ──→ v030 今天
Agent    Loop
智能体    自动化循环
```

这就是今天的主题——**AI Loop。不是写 Prompt，而是设计循环。**

## 一、Loop 是什么

先看一条震撼开源圈的推文——**700 万人围观**：

> "别再给 AI 写提示词了，你应该去设计 Loop。"

Claude Code 的作者也说过类似的话：**"我也不写 prompt，我也 Loop。"**

这不是在否定 Prompt 的价值——Prompt 仍然是和 LLM 交互的基本方式。他们说的是**思维层级的跃迁**：从"我告诉 AI 怎么做"升级到"我设计一个系统，让 AI 自己反复做，直到做好为止"。

### Loop 是计算机最底层的技术之一

```
计算机科学三大结构：
  - 顺序（Sequence）     → 一步一步执行
  - 选择（Selection）    → if/else 分支判断
  - 循环（Loop）         → 重复执行直到满足条件
```

Loop 不是什么新概念——它从计算机诞生那天就存在了。但把它应用到 AI 工作流中，是一个思维转变：

**以前**：你写一个循环来处理数据（for 循环遍历数组）
**现在**：你写一个循环来让 AI 自我迭代（while 循环：生成 → 检查 → 改进 → 再生成）

### Loop 包含三件事

```
┌─────────────────────────────────────────────┐
│                  LOOP                        │
│                                             │
│   ① 从哪里开始（初始状态）                    │
│   ② 重复做什么（每次循环的动作）               │
│   ③ 什么时候停（退出条件）                    │
│                                             │
└─────────────────────────────────────────────┘
```

举个例子：你有一万行数据，要逐行检查格式、统一改成标准格式。人工做：很久。写一个 Loop 让 AI 做：定义好"检查什么、改成什么、通过标准是什么"，然后让 Loop 跑起来——你去喝咖啡。

> **关键认知：Loop 的目标不是"让 AI 一次做对"，而是"让 AI 反复做到对为止"。** 你能接受 AI 第一次回答不好，因为 Loop 会自动检查、自动重试、自动修正。

## 二、AI 模型本身就是 Loop 跑出来的

你现在用的所有 AI 模型——DeepSeek、Claude、Qwen、GPT——**底层训练逻辑全是 Loop**。

```
训练一个 AI 模型的 Loop 过程：

  拿一批数据给模型看
       │
       ▼
  模型给出预测结果
       │
       ▼
  算预测和正确答案差了多少（误差）
       │
       ▼
  根据误差反向调整模型参数（反向传播）
       │
       ▼
  再来一轮，用下一批数据
       │
       ▼
      ...
       │
       ▼
  万亿次循环后，模型学会了对话、推理、写代码
```

```
┌────────────────────────────────────┐
│         训练 Loop                   │
│                                    │
│   数据 ──→ 预测 ──→ 算误差          │
│    ↑                   │           │
│    │                   ▼           │
│    └──── 调参数 ←──────┘           │
│                                    │
│   循环万亿次...                     │
│   最终：AI 学会了"理解"和"生成"     │
└────────────────────────────────────┘
```

**Loop 是 AI 的"出生方式"。** 没有 Loop，就没有今天的大模型。而现在，我们用同样的 Loop 思维来驾驭 AI——让 AI 在循环中自我完善。

## 三、从手动协作到自动 Loop

### 当前的工作方式：手动循环

现在大多数人和 AI 协作的模式，本质上是**手动 Loop**：

```
你写 Prompt
    │
    ▼
AI 生成结果
    │
    ▼
你看结果
    │
    ├── 满意 → 结束
    │
    └── 不满意 → 你改 Prompt → 再来一轮
```

**你在这个循环里。** 你要判断"好不好"、你要决定"改什么"、你要手动发起下一轮。AI 在干活，但**你在盯梢**。

### Loop 模式：自动循环

```
         ┌──────────────────────────┐
         │      自动 Loop            │
         │                          │
         │   Completion（生成）       │
         │       │                  │
         │       ▼                  │
         │   Check（校验）            │
         │       │                  │
         │       ├── 通过 → 退出 ✅   │
         │       │                  │
         │       └── 不通过 → 再来 🔄 │
         │                          │
         └──────────────────────────┘
```

**你不在这个循环里。** 你只需要定义好三件事：
- **Completion**：让 AI 做什么（生成什么）
- **Check**：怎么判断做得好不好（校验标准）
- **退出条件**：什么时候停（通过标准 + 安全边界）

然后 Loop 自己跑。你回来的时候，要么看到最终结果，要么看到"达到最大尝试次数，已停止"。

> **Loop 的本质：把人从"盯 AI 干活"中解放出来。** Prompt 是你和 AI 的对话，Loop 是你给 AI 设计的自动流水线。

## 四、Loop 的优劣势

### 优势：解放人力

```
手动模式：
  你 → Prompt → AI → 结果 → 你检查 → 不满意 → 你改 Prompt → AI → ...
  你在循环里，每一轮都需要你的注意力

Loop 模式：
  你 → 设计 Loop → 启动 → ☕ 喝咖啡去
  Loop 内部：gen() → check() → fail → gen() → check() → pass → 结束
  你回来直接看最终结果
```

**对于重复性 AI 任务**——比如批量生成文案、逐条检查数据、自动修格式——Loop 的价值巨大。你设计一次循环逻辑，然后 AI 自己跑几百轮。

### 缺点：Token 大爆炸

Loop 最大的代价是**Token 消耗**。每一轮 gen() + check() 都在烧 Token。如果你的任务每轮消耗 500 Token，跑 10 轮就是 5000 Token，跑 100 轮就是 50000 Token。

**所以 Loop 设计的关键约束是：用最少的轮次达到目标。** 这需要：
- **好的检查标准**——check() 要精准，不能说"大概不行"然后又跑一轮
- **合理的退出条件**——不能陷入死循环，必须有 maxRound、maxToken 等硬刹车
- **内容去重**——如果两轮输出一模一样，说明 AI 卡住了，继续跑也没意义

## 五、实战：Loop 代码全流程

下面用一个小红书美妆文案生成器，展示 Loop 的完整实现。

### 完整代码

```javascript
import { OpenAI } from 'openai'
import dotenv from 'dotenv'
dotenv.config()

const client = new OpenAI({
  baseURL: process.env.DEEPSEEK_BASE_URL,
  apiKey: process.env.DEEPSEEK_API_KEY,
})

// 🔑 刹车机制：三个硬边界限制死循环
const limit = {
  maxRound: 5,       // 最多跑 5 轮
  maxToken: 2000,    // 总 Token 预算上限
  sameStop: 2        // 连续 2 轮输出一样就停（说明 AI 卡住了）
}

const task = {
  desc: '小红书美妆文案',   // 目标
  rules: [
    "标题带数字",
    "正文<300字",
    "大爆款",
    "结尾有行动号召"
  ]
}

let round = 0, totalToken = 0, lastText = '', sameCount = 0
```

### 刹车条件：needStop()

```javascript
function needStop() {
  return (
    round > limit.maxRound ||           // 超过最大轮次
    totalToken >= limit.maxToken ||     // 超过 Token 预算
    sameCount >= limit.sameStop         // 连续输出相同（AI 卡住了）
  )
}
```

**三个刹车条件，缺一不可：**
- `maxRound` 防无限循环——就算一直不通过，最多跑 5 轮强制停止
- `maxToken` 防预算爆炸——不管通过没通过，花钱有上限
- `sameStop` 防死循环——AI 输出和上一轮一模一样，说明它在原地踏步，再跑也没用

> **没有刹车机制的 Loop 就是一台烧钱机器。** 设计 Loop 的第一步不是写 gen()，是设计好什么时候停。

### 生成函数：gen()

```javascript
async function gen() {
  const res = await client.chat.completions.create({
    model: 'deepseek-v4-flash',
    messages: [
      {
        role: 'user',
        content: `假如你是一位资深小红书博主，写一篇${task.desc}，
                  要求符合${task.rules.join('、')}，只输出文案`
      }
    ]
  })
  console.log(res.usage.total_tokens, res.choices[0].message.content)
  return {
    text: res.choices[0].message.content.trim(),
    token: res.usage.total_tokens
  }
}
```

**gen() 是 Loop 的"发动机"。** 它只做一件事：调用 LLM，把结果和 Token 消耗返回。函数本身不复杂——复杂的是 Loop 怎么用它。

返回值是两个关键数据：
- `text`：生成的文案，给 check() 用，也用来和上一轮比较（去重检测）
- `token`：本轮消耗的 Token，累加到 totalToken 做预算控制

### 校验函数：check()

```javascript
async function check(text) {
  const res = await client.chat.completions.create({
    model: 'deepseek-v4-flash',
    messages: [
      {
        role: 'user',
        content: `校验文案${text}，
                  规则：${task.rules.join('、')}，
                  只输出 JSON {pass: 布尔, fail: 数组}`
      }
    ]
  })
  return JSON.parse(res.choices[0].message.content.trim())
}
```

**check() 是 Loop 的"质检员"。** 它用另一个 LLM 调用来检查 gen() 的输出是否满足规则。

> **关键设计：check() 强制输出 JSON。** 如果让 LLM 自由发挥——"嗯，这个文案写得还不错，但是标题没有数字..."——你没法用代码判断是过还是没过。`{pass: false, fail: ["标题无数字", "无行动号召"]}` 这种结构化输出，让 Loop 能自动决策。

**gen() 和 check() 是两个独立的 LLM 调用：**
- gen() → 创造者角色，"你是小红书博主"
- check() → 评审者角色，"你是质检员"

两个角色分离，各司其职——这比让同一个模型又生成又自评要可靠得多。

### 主循环：runLoop()

```javascript
async function runLoop() {
  console.log('AI Loop 开始')
  while (!needStop()) {
    round++
    console.log(`\n第${round}轮`)

    // 1. 生成
    const { text, token } = await gen()
    totalToken += token

    // 2. 去重检测
    sameCount = text === lastText ? sameCount + 1 : 0
    lastText = text

    // 3. 校验
    const { pass, fail } = await check(text)
    if (pass) {
      console.log('✅ 文案校验通过')
      console.log(`最终文案：${text}`)
      return
    }
    console.log(`❌ 文案校验不通过，原因：${fail}`)
  }
  console.log('\n⚠️ 触发刹车，强制停止')
}

runLoop()
```

### 数据流全貌

```
runLoop() 启动
    │
    ▼
┌─────────────────────────────────┐
│  while (!needStop())            │
│                                 │
│  ① gen()                       │
│     调用 LLM 生成文案            │
│     返回 { text, token }        │
│     │                           │
│     ▼                           │
│  ② 去重检测                     │
│     text === lastText ?         │
│     一样 → sameCount++          │
│     不一样 → sameCount = 0      │
│     │                           │
│     ▼                           │
│  ③ check(text)                 │
│     调用 LLM 校验文案            │
│     返回 { pass, fail }         │
│     │                           │
│     ├── pass=true → ✅ 退出     │
│     │                           │
│     └── pass=false → 🔄 继续    │
│                                 │
└─────────────────────────────────┘
    │
    ▼
退出（要么通过，要么刹车）
```

### 每一轮发生了什么

```
第 1 轮：
  gen() → "5个步骤教你化韩式水光妆✨..."
  check() → { pass: false, fail: ["标题虽带数字但不像爆款", "无行动号召"] }
  → 继续下一轮

第 2 轮：
  gen() → "3个技巧！新手也能画出高级感妆容..."
  check() → { pass: false, fail: ["正文超过300字"] }
  → 继续下一轮

第 3 轮：
  gen() → "TOP5！改变妆容的5个秘诀，第3个我用了3年🔥..."
  check() → { pass: true, fail: [] }
  → ✅ 通过！输出最终文案
```

**如果第 3 轮还不通过**，Loop 会继续跑到第 5 轮（maxRound），还没通过就触发刹车。如果跑到一半 Token 超预算了（maxToken），立刻停下。如果连续两轮生成了一模一样的文案（sameStop），也立刻停下——AI 显然卡住了，再跑也是重复。

## 六、Loop 与 Agent 的关系

v029 学了 Agent = LLM + Tools + Context。今天学了 Loop = Completion → Check → Compare → Retry/Exit。

把它们放在一起：

```
┌──────────────────────────────────────────────┐
│                                             │
│   Agent 让你能"用 AI 做事"                   │
│   Loop  让你能"让 AI 反复做，直到做好"        │
│                                             │
│   Agent + Loop = 一个能自我迭代的智能体       │
│                                             │
│   ┌──────────┐     ┌──────────┐             │
│   │  Agent   │ ──→ │  Loop    │             │
│   │ 单次行动  │     │ 反复行动  │             │
│   │ 大脑+工具 │     │ 自动纠错  │             │
│   └──────────┘     └──────────┘             │
│         │                │                  │
│         └────────┬───────┘                  │
│                  │                          │
│                  ▼                          │
│        Agent Loop                           │
│        自动干活 + 自动检查 + 自动改进         │
│                                             │
└──────────────────────────────────────────────┘
```

**Agent 是单次行动的能力——LLM 推理 + 工具调用，解决一个问题。**
**Loop 是持续行动的能力——反复执行 Agent，直到目标达成。**

两者结合，就是**自主 Agent（Autonomous Agent）**的雏形——不需要人盯着，自己能跑完整个任务链。

## 七、AI Native 开发者的能力栈跃迁

从第一篇博客到今天，正好是 v030。回顾这三十篇文章，能看到一条清晰的能力演进线：

```
v001-v005   基础设施
  ├── AI 全栈概念、Prompt 工程、Claude Code、Git 版本管理
  │
v006-v010   工程化启蒙
  ├── 模块化开发、FDE 概念、Python 工具链、JS 底层基础
  │
v011-v015   Prompt 与 AI 平台
  ├── Prompt Engineering、LLM 调用、前端规范化、Coze 智能体、HTTP 通信
  │
v017-v022   语言与数据结构基础
  ├── NLP 实战、Bun+TypeScript、数组算法、异步机制、JS 数据类型与内存
  │
v023-v026   前后端实战 + 多模态
  ├── RESTful API、AJAX 原理、Vite 工程化、Canvas 图形编程
  │
v027-v029   算法思维 + 视觉编程 + Agent 架构
  ├── DFS/BFS、推荐算法、CSS 3D、Agent 核心概念
  │
v030 今天   自动化思维
  └── AI Loop：从"用 AI"到"让 AI 自己跑"
```

**AI Native 开发者的四次思维跃迁：**

```
1. 调 API           → "让 AI 帮我干活"
   用 fetch/OpenAI SDK 调用模型

2. 写 Prompt        → "让 AI 理解我要什么"
   设计 system prompt、构造 messages、控制输出格式

3. 设计 Agent       → "让 AI 有能力干活"
   定义 Tools、设计 Tool Calling 流程、搭建 Agent 架构

4. 设计 Loop        → "让 AI 自己反复干到好为止"
   设计 gen/check/stop 循环、让 AI 自动纠错迭代
```

**每一次跃迁，你的角色都离"操作者"更远，离"设计者"更近。** 操作者盯着 AI 干活，设计者建好流水线让 AI 自己跑。

## 结语

今天从一个 700 万人围观的推文出发，搞懂了 AI Loop 的完整概念和实践：

1. **Loop 是计算机最底层的技术之一**——顺序、选择、循环三大结构。把它用到 AI 工作流中，是思维层级的跃迁：从"我告诉 AI 怎么做"到"我设计系统让 AI 自己反复做"

2. **Loop 三要素**——从哪里开始（初始状态）、重复做什么（gen + check）、什么时候停（pass 通过 + 三个刹车）。没有刹车机制的 Loop 就是烧钱机器

3. **所有 AI 模型都是 Loop 跑出来的**——训练 Loop：拿数据 → 预测 → 算误差 → 调参数 → 再来。万亿次循环后，AI 学会了对话和推理。你现在用同样的思维来驾驭 AI

4. **手动模式 vs Loop 模式**——手动：你在循环里，每一轮都要盯；Loop：你设计好规则就离开，AI 自己跑完。Completion → Check → 对比目标 → 继续或退出

5. **实战核心设计**——gen() 生成、check() 校验、needStop() 刹车。三个刹车条件（maxRound / maxToken / sameStop）缺一不可。gen 和 check 是两个独立的 LLM 角色，分离创造者和评审者

6. **Agent + Loop 是自主 Agent 的雏形**——Agent 是单次行动能力，Loop 是持续行动能力。两者结合，AI 不需要人盯着就能跑完整个任务链

7. **AI Native 开发者的四次跃迁**——调 API → 写 Prompt → 设计 Agent → 设计 Loop。每一次跃迁，你的角色都离"操作者"更远，离"设计者"更近

v030 是一个里程碑。三十篇文章，从"AI 是什么"写到"让 AI 自己跑 Loop"。但这只是开始——Loop 之上是更复杂的多 Agent 协作、自主决策链、自我进化系统。

**AI Native 开发者最终要的不是会调用多少个 API，而是能设计什么样的自动化系统。Loop，是这个系统的第一个齿轮。**

下篇见。
