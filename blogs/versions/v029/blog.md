# 从 LLM 到 Agent：一个 AI Native 开发者的智能体核心概念启蒙

## 引言

v025 学了多模态 AI 和 Vite 工程化，v026 用 Canvas 画图做游戏，v027 搞懂了 DFS/BFS 和推荐算法，v028 用 CSS 3D 搭了旋转立方体。

今天回到 AI 的主线——**但不是调 API，而是理解 API 背后的那个"大脑"是怎么工作的。**

过去几个月，我一直在用 Claude Code 写代码。它能读文件、搜代码、执行命令、创建项目——这些能力从哪来？它不只是一个大模型在回答问题。它背后是一整套 **Agent 架构**。

```
v025 ──→ v026 ──→ v027 ──→ v028 ──→ v029 今天
多模态    Canvas    算法     CSS 3D    Agent 核心概念
 AI      图形编程   逻辑      视觉      智能体底层
```

今天只搞懂四个概念：**Agent、LLM、Tools、Reasoning。** 它们是 AI Native 开发者最重要的基本功——比框架更底层，比 API 更通用。

## 一、Agent 是什么

### 先看现实

**Agent 工程师已经取代了传统的软件工程师，刷新了工资上限。** FDE（前沿部署工程师）通过开发各种 Agent 帮助企业 AI 落地、降本增效，现在是市面上最值钱的岗位之一。

你每天用的很多产品，本质已经是 Agent 了：

```
Cursor / Claude Code / Codex       → 写代码、读文件、执行命令
豆包 / 悟空 / 飞书 CLI             → 办公场景自动化
openclaw / workbuddy               → 通用任务助手
```

**它们的核心都一样：帮我们干活。** 不只是回答问题，还能读文件、搜网络、写代码、操作浏览器——这些都是 Agent 在做的事。

### Agent 的能力公式

```
Agent 的能力 = 大脑（LLM）× 工具（Tools）× 信息（Context）
```

```
        ┌──────────────────────────┐
        │        AGENT              │
        │                          │
        │   ┌──────┐  ┌─────────┐  │
        │   │ LLM  │  │  Tools  │  │
        │   │ 大脑  │  │  工具   │  │
        │   └──┬───┘  └────┬────┘  │
        │      │            │       │
        │      └─────┬──────┘       │
        │            │              │
        │       ┌────┴────┐         │
        │       │ Context │         │
        │       │  信息   │         │
        │       └─────────┘         │
        └──────────────────────────┘
```

**一个 Agent 有多强？取决于三个变量：**
- 用了什么大脑（LLM 模型）——GPT-5 和 GPT-3.5 能力天差地别
- 装了什么工具——能读文件、能搜网络、能执行代码，每多一个工具就多一种能力
- 拿到了什么信息——上下文越丰富，决策越准确

> **关键认知：Agent 不是"更强的 AI"，而是"AI + 行动能力"。** 没有行动能力，AI 只是一个聊天的盒子；有了工具，AI 变成一个能干活的助手。

## 二、LLM：Agent 的大脑

### LLM 的能力边界

很多人把 LLM 当成"全能的神"——它什么都知道，什么都能做。实际上：

```
LLM 只做两件事：
  1. 推理（Reasoning）——理解问题、分析逻辑、制定计划
  2. 生成（Generation）——生成文本、代码、回答

LLM 不做的事：
  ❌ 读文件       → 需要 File System Tool
  ❌ 搜网络       → 需要 Search Tool
  ❌ 执行代码     → 需要 Code Executor Tool
  ❌ 操作浏览器   → 需要 Browser Tool
```

**大模型是 Agent 的大脑，但大脑不能直接作用于世界。** 你的大脑能思考"我要喝水"，但真正拿起杯子的是你的手——LLM 的"手"就是 Tools。

### 大脑 + 手 = 智能体

```
没有 Tools 的 LLM：
  用户："青岛啤酒股价多少？"
  LLM："抱歉，我的知识截止到 2024 年，无法提供实时股价。"

有 Tools 的 LLM（Agent）：
  用户："青岛啤酒股价多少？"
  LLM 推理 → 需要调用 getPrice 工具
  → 工具返回 "67.92"
  → LLM 生成："青岛啤酒当前收盘价为 67.92 元。"
```

**同样的"大脑"，加了"手"之后，能力完全不同。** 这就是为什么 Agent 比单纯的 LLM 有用得多——它能做事。

## 三、Tools：Agent 的手和脚

### Tool Calling 机制

LLM 怎么知道什么时候该用工具、用什么工具？核心机制叫 **Tool Calling**（也叫 Function Calling）：

```
用户提问
    │
    ▼
LLM 推理：这个问题我能直接回答吗？
    │
    ├── 能 → 直接生成回答
    │
    └── 不能 → 需要调用哪个工具？
              │
              ▼
          生成 Tool Call（函数名 + 参数）
              │
              ▼
          你的代码执行这个函数
              │
              ▼
          结果返回给 LLM
              │
              ▼
          LLM 根据结果生成最终回答
```

### 定义一个 Tool

Tool 的定义不是魔法——就是一个 JSON Schema，告诉 LLM "有这个函数可以用"：

```javascript
const tools = [
    {
        type: "function",        // Tool 的格式就是函数
        function: {
            name: "get_closing_price",
            // 🔑 核心：description 决定 LLM 能不能准确使用这个工具
            description: "获取指定股票的收盘价",
            parameters: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        description: "股票名称"    // NLP：LLM 理解这个参数的含义
                    }
                },
                required: ["name"]
            }
        }
    }
];
```

**工具描述（description）的质量，直接决定了 LLM 调用工具的准确率。** 描述越清晰、越具体，LLM 越知道什么时候该用这个工具、参数该怎么填。这不是传统编程的"文档注释"——这是 LLM 理解工具功能的唯一入口。

### 工具函数本身

```javascript
// 实际执行逻辑的函数——跟普通 JS 函数没有任何区别
function get_closing_price(name) {
    if (name === '青岛啤酒') return "67.92";
    if (name === '贵州茅台') return "1488.21";
    return "未找到股票";
}
```

**工具函数就是普通函数。** Agent 的"魔法"不在于函数本身有多复杂——而在于 LLM 能够在合适的时机、用合适的参数调用它。

## 四、Reasoning：LLM 是怎么"想"的

### 推理过程可见

传统 LLM 调用：输入 → 输出，中间是黑盒。

有了 Reasoning 能力后，你可以看到 LLM 的"思考过程"：

```javascript
const res = await client.chat.completions.create({
    model: 'deepseek-v4-flash',
    reasoning_effort: 'high',    // 🔑 推理深度：low / medium / high
    messages: [
        { role: 'system', content: '你是一个足球领域的专家' },
        { role: 'user', content: 'C罗是哪个国家的足球运动员' },
        { role: 'assistant', content: 'C罗是葡萄牙的足球运动员' },
        { role: 'user', content: '内马尔呢?' }
    ]
});

// 两个输出通道：
console.log(res.choices[0].message.reasoning_content);  // 思考过程
console.log(res.choices[0].message.content);             // 最终回答
```

### reasoning_effort：控制推理深度

| 值 | 含义 | 使用场景 |
|---|------|---------|
| `low` | 轻量推理 | 简单问答、信息查询 |
| `medium` | 中等推理 | 一般编程、文本分析 |
| `high` | 深度推理 | 复杂逻辑、数学证明、架构设计 |

**`reasoning_effort` 越高，LLM 花在"思考"上的算力越多。** 但不是越高越好——简单问题用 `high` 浪费 token，复杂问题用 `low` 可能出错。根据任务复杂度选择合适的深度。

### messages：多轮对话的"记忆"

```javascript
const messages = [
    { role: 'system',    content: '你是足球专家' },     // 系统提示——设定角色
    { role: 'user',      content: 'C罗是哪国人？' },    // 用户第一轮
    { role: 'assistant', content: 'C罗是葡萄牙人' },    // AI 第一轮回答
    { role: 'user',      content: '内马尔呢?' },        // 用户第二轮（省略了主语）
];
```

**`messages` 数组就是对话的完整历史。** LLM 本身没有"记忆"——每次调用都是无状态的。messages 让你手动维护对话上下文，LLM 通过它理解"内马尔呢？"是在延续足球运动员的话题。

> **`system` 角色的重要性**：它定义了 LLM 的"人设"和行为边界。同样的问题，system 设为"足球专家"和"金融分析师"，回答完全不同。

## 五、实战：Tool Calling 全流程

现在把 Tool Calling 的完整流程跑一遍——用"查询股票收盘价"这个例子。

### 第一步：初始化 LLM 客户端

```javascript
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: process.env.DEEPSEEK_BASE_URL
});
```

**OpenAI 兼容接口。** DeepSeek、通义千问、智谱等国产模型都兼容 OpenAI 的 SDK 格式——换模型只需要改 `baseURL` 和 `apiKey`，代码不用变。

### 第二步：声明 Tools 并发送消息

```javascript
const sendMessage = async (messages) => {
    return await client.chat.completions.create({
        model: 'deepseek-v4-flash',
        messages,
        tools,                // 🔑 告诉 LLM 有哪些工具可用
        tool_choice: 'auto'   // LLM 自动决定是否调用工具
    });
};

const main = async () => {
    let messages = [
        { role: 'user', content: "青岛啤酒的收盘价是多少？" }
    ];

    const response = await sendMessage(messages);
    const message = response.choices[0].message;
    console.log(message);
};

main();
```

### 完整的数据流

```
1. 用户："青岛啤酒的收盘价是多少？"
         │
2. LLM 推理 → "我不知道实时股价，但我看到有 get_closing_price 工具"
         │
3. LLM 返回 tool_calls: [{ name: "get_closing_price", arguments: { name: "青岛啤酒" } }]
         │
4. 你的代码执行 get_closing_price("青岛啤酒") → "67.92"
         │
5. 把结果返回给 LLM（作为 tool role 的 message）
         │
6. LLM 生成："青岛啤酒的当前收盘价为 67.92 元。"
```

```
          用户提问
              │
              ▼
         ┌─────────┐
         │   LLM   │ ← 推理：需要调用工具
         └────┬────┘
              │ tool_call: get_closing_price("青岛啤酒")
              ▼
         ┌─────────┐
         │ 函数执行 │ ← get_closing_price("青岛啤酒") = "67.92"
         └────┬────┘
              │ tool_result: "67.92"
              ▼
         ┌─────────┐
         │   LLM   │ ← 综合结果生成回答
         └────┬────┘
              │
              ▼
         "青岛啤酒收盘价 67.92 元"
```

**关键理解：LLM 不执行函数，它只"决定"调用哪个函数。** 函数是你的代码执行的，结果也是你的代码传回给 LLM 的。LLM 的角色是"决策者"，不是"执行者"。

## 六、实战：Reasoning 深度体验

再看 reasoning 的实战——让 LLM 展示它的"思考过程"：

```javascript
const main = async () => {
    const res = await client.chat.completions.create({
        model: 'deepseek-v4-flash',
        reasoning_effort: 'high',
        messages: [
            { role: 'system', content: '你是一个足球领域的专家，请尽量帮我回答与足球相关的问题' },
            { role: 'user', content: 'C罗是哪个国家的足球运动员' },
            { role: 'assistant', content: 'C罗是葡萄牙的足球运动员' },
            { role: 'user', content: '内马尔呢?' }
        ]
    });

    console.log('思考过程：');
    console.log(res.choices[0].message.reasoning_content);
    console.log('回答：');
    console.log(res.choices[0].message.content);
};
```

### reasoning_content vs content

```
reasoning_content（思考过程）：
  "用户问'内马尔呢?'，结合上文C罗的讨论，
   用户在询问内马尔的国籍。
   内马尔是巴西著名足球运动员...
   我应该简洁回答，保持与上文一致的格式。"

content（最终回答）：
  "内马尔是巴西的足球运动员。"
```

**两个输出，两种用途：**
- `reasoning_content` → 给开发者看，用于调试、验证逻辑、优化 prompt
- `content` → 给用户看，最终的简洁回答

> **为什么要看 reasoning_content？** 当 Agent 行为不符合预期时，reasoning_content 告诉你 LLM "当时在想什么"——这是调试 Agent 行为最有效的手段。不看思考过程就去调 prompt，等于瞎改。

## 结语

今天从概念到代码，搞懂了 Agent 的四个基石：

1. **Agent（智能体）** —— LLM + Tools + Context。不是更强的 AI，而是"AI + 行动能力"。Agent 工程师正在取代传统软件工程师，FDE 是现在最值钱的岗位
2. **LLM（大模型）** —— Agent 的大脑，只负责推理和生成。没有工具，LLM 只能"空推理"；有了工具，LLM 能自动化任务
3. **Tools（工具）** —— Agent 的手和脚。Tool Calling 机制：LLM 决定调用哪个函数 → 你的代码执行 → 结果返回 LLM → LLM 生成回答。工具描述的质量决定调用准确率
4. **Reasoning（推理）** —— LLM 的思考过程。`reasoning_effort` 控制深度，`reasoning_content` 暴露思考过程。messages 维护对话历史，system 定义人设

**四个概念的关系：**

```
┌─────────────────────────────────────────┐
│                 AGENT                    │
│                                         │
│   LLM（大脑）                            │
│   ├── Reasoning（怎么想）                │
│   │   ├── reasoning_effort（想多深）     │
│   │   └── reasoning_content（想什么）    │
│   └── Generation（说什么）               │
│       └── content（最终输出）            │
│                                         │
│   Tools（手脚）                          │
│   ├── Tool Definition（JSON Schema）     │
│   ├── Tool Calling（LLM 决策 → 执行）   │
│   └── Tool Result（结果返回 LLM）        │
│                                         │
│   Context（信息）                        │
│   ├── messages（对话历史）               │
│   └── system prompt（人设定义）          │
└─────────────────────────────────────────┘
```

**从 v025 到 v029 的 AI 主线：**

```
v025: 多模态 AI + Vite      → "调 AI API 做应用"
v027: 算法思维              → "理解 AI 底层的数学"
v029: Agent 核心概念        → "理解 AI 产品的架构"
```

v025 让你能调用 AI，v027 让你理解 AI 的算法，**v029 让你理解 AI 产品的底层机制——Agent = 大脑 + 工具 + 信息。** 这三个概念比你用的任何框架都更持久——OpenAI 的接口在变，模型在迭代，但 Agent 架构的核心逻辑不会变。

**AI Native 开发者的能力栈，不是"会调用多少个 API"，而是理解 Agent 是怎么构成的——然后自己动手搭建。**

下篇见。
