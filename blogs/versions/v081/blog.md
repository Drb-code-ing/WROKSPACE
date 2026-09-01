# Agent 记忆管理：InMemory 短期记忆、文件持久化，与上下文截断的取舍

第六十七天（2026-09-01）做的是把"对话的历史"真正管起来。大模型本身是**无状态的**——每一次调用都是独立的，它并不知道上一次你问过什么；而 Agent 之所以能"接着上次聊"，靠的就是一套记忆机制把历史消息喂回 prompt。这天用 LangChain 把记忆拆成两层来实践：**临时记忆**用 `InMemoryChatMessageHistory` 放进内存，**长期记忆**用 `FileSystemChatMessageHistory` 持久化到文件；再往前走一步，是上下文窗口管理——历史不能无限堆，用**截断**（按条数 / 按 token）控制放进去多少。围绕这个动手过程，有三个技术核心：**Agent = LLM + Harness（tool + RAG + memory），tool 让它"干活"、RAG 让它"取知识"，两者都依赖 memory**；**记忆从"数组"升级为"容器"：addMessage / getMessages 管理 message 对象**；以及**存储逻辑（内存 / 文件 / 数据库）与管理逻辑（截断 / 总结 / 检索）是记忆的两根轴**。这篇按"为什么需要记忆 → 临时记忆 → 长期记忆 → 上下文截断"的顺序讲。

---

## 一、大模型为什么"记不住"：无状态是一切记忆问题的起点

先说结论：**大模型是无状态的**。你每一次发请求，模型都是在独立地处理这一组输入，它没有"上个问题"的记忆。之所以感觉它记得住，是因为程序把之前所有的问答装进 message 数组，连同当前问题一起再发给模型——模型看到的从来不是一个问题，而是**一整段对话历史**。

笔记里把 Agent 拆成一个等式：

```text
Agent = LLM + Harness（tool + RAG + memory + ...）
```

- **Tool（工具）**：给模型扩展"干活"的能力，让它不只是回答问题，而是能调用函数、执行动作；
- **RAG（检索增强生成）**：基于当前 query，从向量数据库里检索出相关知识，放进 prompt，让模型"查了资料再回答"；
- **Memory（记忆）**：上面两者都依赖它——tool 要记住调用的上下文，RAG 要记住历史问题才能检索得准。

早期的做法很简单：用一个 `chatMessage` 数组把历史存下来，每次请求拼接进去。但数组很快暴露问题——**持久化**（刷新就没了）、**上下文窗口大小**（比如 200k，历史不能无限长）、**开销**（每次请求都重发全部历史，token 成本随对话增长）。这也是 Claude Code 这类工具里出现 `/compact`、`/clear` 的原因：对话太长时压缩总结，或干脆清空重来。

所以 Agent 的记忆问题，本质是两个子问题：**历史放哪**（存储逻辑），以及**放多少**（管理逻辑）。这天先解决"放哪"，再解决"放多少"。

---

## 二、临时记忆：InMemoryChatMessageHistory

`history-test.mjs` 演示了第一个答案：把 message 数组升华成**内存里的记忆实例**。用 `InMemoryChatMessageHistory` 管理对话历史，它把消息存在进程内存里，对外提供三个核心方法：

- **`addMessage(message)`**：往历史里添加一条消息。可以加 `HumanMessage`（用户）、`AIMMessage`（助手）、`ToolMessage`（工具返回）；
- **`getMessages()`**：取出当前全部消息，每个 message 对象有 `type`（`'human'` / `'ai'`）、`content` 等属性。

流程是这样一段循环：

```js
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'

const history = new InMemoryChatMessageHistory()
const systemMessage = new SystemMessage('你是一个友好，幽默的做菜助手')

// 第一轮：用户提问，先入历史，再带上系统提示词一起发给模型
const userMessage = new HumanMessage('你今天吃什么？')
await history.addMessage(userMessage)
const message1 = [systemMessage, ...(await history.getMessages())]
const response1 = await model.invoke(message1)
await history.addMessage(response1)   // 模型回复也存回历史

// 第二轮：基于历史记忆继续问
const userMessage2 = new HumanMessage('好吃吗？')
await history.addMessage(userMessage2)
const message2 = [systemMessage, ...(await history.getMessages())]
const response2 = await model.invoke(message2)
await history.addMessage(response2)
```

关键就在 `await history.addMessage(response1)` 这一行——**模型的回复（一个 AIMMessage）直接存回历史**。第二轮组装 `message2` 时，`getMessages()` 里已经含第一轮的"问 + 答"，模型看到完整对话才能接得上"好吃吗？"这个看似没头没尾的问题。

代码最后把历史打出来：

```js
const allMessage = await history.getMessages()
allMessage.forEach((msg, index) => {
  const type = msg.type
  const prefix = type === 'human' ? '用户' : '助手'
  console.log(`${index + 1} . [${prefix}]: ${msg.content.substring(0, 50)}...`)
})
```

用 `msg.type` 区分是用户还是助手，`msg.content` 取内容。这个 `type` 字段就是 message 对象统一结构带来的便利——不管 Human、AI 还是 Tool 消息，都是同一套字段，循环里按 `type` 分支处理即可。

`InMemoryChatMessageHistory` 解决了"用起来顺手"，但它把历史放在**当前进程的内存**里——进程一重启，记忆全丢。这是临时记忆的天花板。

---

## 三、长期记忆：文件持久化

要跨重启保留记忆，得把历史写到进程之外。`history-test2.mjs` 换成 `FileSystemChatMessageHistory`，把历史**持久化到文件**：

```js
import { FileSystemChatMessageHistory } from '@langchain/community/stores/message/file_system'
import path from 'node:path'

const filePath = path.join(process.cwd(), 'chat_history.json')
const sessionId = 'user_session_001'

const history = new FileSystemChatMessageHistory({ filePath, sessionId })
```

注意注释里的一句：**1.x 改名了，旧名 `FileChatMessageHistory`**——升级 LangChain 后旧的类名不再可用，改用 `FileSystemChatMessageHistory`，import 路径也从老位置挪到了 `@langchain/community/stores/message/file_system`。两个参数是它的核心：

- **`filePath`**：历史写到哪个文件；
- **`sessionId`**：会话标识。同一个文件可以装多个用户的会话，用 sessionId 区分开。

用法和 InMemory 完全一致——`addMessage` / `getMessages` 的接口是通用的，只是底层落盘方式不同。跑完两轮对话，文件里存下了这样的结构：

```json
{
  "": {
    "user_session_001": {
      "messages": [
        { "type": "human", "data": { "content": "红烧肉怎么做？" } },
        { "type": "ai", "data": { "content": "哈哈，红烧肉——中华美食界的\"顶流爱豆\"…" } },
        { "type": "human", "data": { "content": "好吃吗？" } },
        { "type": "ai", "data": { "content": "哈哈，问出这句话的你…" } }
      ]
    }
  }
}
```

外层按会话分组（这里是 sessionId `user_session_001`），里面的 `messages` 数组逐条存下 `type` + `data.content`。**文件是长时记忆，进程重启也不丢**。

`history-test3.mjs` 专门演示"恢复记忆"：程序重启后，用同样的 `filePath` + `sessionId` 新建实例，先 `getMessages()` 把历史读回来——

```js
const restoredHistory = new FileSystemChatMessageHistory({ filePath, sessionId })
const restoredMessages = await restoredHistory.getMessages()
console.log(`从文件中恢复了${restoredMessages.length}条历史信息:`)
```

然后接第三轮对话："需要哪些食材？"。模型因为读回了前两轮的"红烧肉怎么做 + 好吃吗"，能顺着语境继续聊食材清单。**上一轮进程留下的记忆，这一轮进程原样接续**——这就是持久化的意义。

笔记里把长时记忆的来源列为两个：**文件**、**向量数据库**。文件适合"按会话顺序取全量历史"，而向量数据库（像之前学过的 Milvus）适合按相关性**检索**——历史太长时不可能全量塞回 prompt，只能挑相关的取，这正是 RAG 那条线的延续。

---

## 四、上下文管理：截断的两种方式

内存和文件解决了"历史放哪"，但还有另一半：**放多少**。模型有上下文窗口上限，历史无限增长会让每次请求越来越贵、甚至超出窗口。笔记给了管理记忆的三个手段：**截断（truncation）、总结（summarization）、检索（retrieval）**。这天实践的是截断，`truncation-memory.mjs` 里给了两种做法。

**1. 按消息数量截断：简单 slice。**

最朴素的办法是只保留最近 N 条。8 条历史，`slice(-maxMessages)` 留最近 4 条：

```js
const maxMessages = 4
const trimmedMessages = allMessages.slice(-maxMessages)
```

`slice(-4)` 取数组尾部 4 条——**裁掉老的，保留新的**。它实现简单、一眼看懂，缺点是不考虑每条消息长短：可能一条超长消息就占掉大半窗口，也可能 4 条都很短、白白浪费可用空间。它不感知 token。

**2. 按 token 数量截断：trimMessages + 自定义计数器。**

更精细的做法是算清楚每条消息占多少个 token，凑到上限为止。分两步：

**第一步，算 token。** 用 `js-tiktoken` 按 `cl100k_base` 编码把内容编码后数长度——不同模型 tokenizer 不同，笔记注释点出"不同模型的 token 计算方式不同"：

```js
import { getEncoding } from 'js-tiktoken'
const enc = getEncoding('cl100k_base')

function countTokens(messages, encoder) {
  let cotal = 0
  for (const msg of messages) {
    const content = typeof msg.content === 'string'
      ? msg.content
      : JSON.stringify(msg.content)
    cotal += encoder.encode(content).length
  }
  return cotal
}
```

**第二步，按 token 上限截断。** `trimMessages` 接受 `maxLength`、一个可自定义的 `tokenCounter`（正好接上第一步），以及 `strategy: 'latest'`——保留最新内容：

```js
import { trimMessages } from '@langchain/core/messages'

const trimmedMessages = trimMessages(allMessages, {
  maxLength: maxTokens,                 // 比如 100
  tokenCounter: async (msgs) => countTokens(msgs, enc),
  strategy: 'latest',
})
```

`trimMessages` 背后是一个"找最大消息数量"的过程：在假设 token 数随消息数**单调递增**的前提下，**二分查找**出"能放进 `maxLength` 内的最多条消息"，从最新的开始保留。它比 `slice` 聪明的地方在于——**它真的在算 token 开销**，知道每条消息有多重，而不是机械地按条数切。

两种截断的取舍一句话：**按条数，快但粗；按 token，准但贵**（每次都要编码计数）。生产里常按 token 截，因为上下文窗口本身以 token 计，窗口就是钱的边界。

---

## 五、记忆的完整图景：存储轴 × 管理轴

把这几段代码连起来，就是笔记最后那张"memory 逻辑"的总结：

```text
存储逻辑：内存（InMemoryChatMessageHistory）→ 文件（FileSystemChatMessageHistory）→ 数据库（向量库，如 Milvus）
管理逻辑：截断（本篇：slice / trimMessages）→ 总结（对话太长时归纳成摘要）→ 检索（按相关性取历史）
```

**存储轴回答"历史放哪"**：内存最快但会丢，文件能跨重启但只适合顺序取，数据库适合海量历史的按需检索。**管理轴回答"放多少"**：截断是"丢"，总结是"压缩"，检索是"选"。三条管理手段可以组合——比如先用检索挑出相关历史，再对最老的部分做总结，最后用截断控制总长度。

一个被反复强调的关联：**tool 和 RAG 都依赖 memory**。Tool 需要上下文记忆才能连贯地连续调用；RAG 的 query 本身要基于对话历史才能构造得准。所以记忆不是 Agent 的一个可选配件，而是让"干活"和"取知识"都成立的地基。

---

## 面试问答

**问：为什么说大模型是无状态的？Agent 靠什么"记住"对话？**

> 大模型每次调用都是独立处理当前输入，没有跨调用的状态。Agent 靠**记忆机制**记住对话：把之前所有问答存起来（内存/文件/数据库），每次请求时把历史 message 连同当前问题一起拼进 prompt 发给模型。模型看到的是一整段历史，所以"记得住"。Agent = LLM + Harness（tool + RAG + memory），tool 和 RAG 也都依赖 memory。

**问：`InMemoryChatMessageHistory` 怎么用？它和直接用一个数组有什么区别？**

> 它把 message 数组封装成内存里的记忆实例，核心方法是 `addMessage(message)`（添加 Human/AI/Tool 消息，模型的回复也要存回历史）和 `getMessages()`（取全部消息，每个 message 对象带 `type`、`content` 等属性）。相比裸数组，它提供了统一的消息对象结构和标准接口，是 LangChain 里所有历史存储的共同抽象——换存储方式时接口不变。

**问：`FileSystemChatMessageHistory` 的两个关键参数是什么？为什么它能跨重启恢复记忆？**

> `filePath`（历史写到哪个文件）和 `sessionId`（会话标识，同一个文件里区分不同用户/会话）。它把消息序列化持久化到磁盘，进程重启后用同样的 filePath + sessionId 新建实例，`getMessages()` 就能把上一次进程写下的历史读回来，再接续对话。注意 1.x 里类名从 `FileChatMessageHistory` 改成了 `FileSystemChatMessageHistory`。

**问：记忆管理有哪三个手段？分别解决什么问题？**

> 截断、总结、检索。**截断**是"丢"——历史太长时把老的裁掉，只留最近的；**总结**是"压缩"——对话太多时归纳成一段摘要代替原文；**检索**是"选"——从海量历史里按相关性挑出当前问题需要的部分。它们可以组合使用。

**问：按消息数量截断和按 token 数量截断有什么区别？**

> 按条数：`slice(-N)` 保留最近 N 条，实现简单，但不考虑每条消息长短，可能一条超长消息就占掉大半窗口。按 token：用 `js-tiktoken` 对每条内容编码计数，再用 `trimMessages({ maxLength, tokenCounter, strategy: 'latest' })` 在"token 数单调递增"假设下二分查找能放下的最多条数，从最新开始保留。它更准——因为上下文窗口本身以 token 计，token 就是钱的边界；代价是每次都要编码计算。

**问：`trimMessages` 的 `tokenCounter` 和 `strategy: 'latest'` 是干什么的？**

> `tokenCounter` 是自定义的 token 计数函数，用来算一组消息总共占多少 token——不同模型 tokenizer 不同，所以要按需替换（示例用的是 `cl100k_base` 编码）。`strategy: 'latest'` 表示截断时保留最新内容、裁掉最老内容，保证"最近的上下文"不丢。

**问：长期记忆有哪两种载体？分别适合什么场景？**

> 文件和向量数据库。**文件**适合按会话顺序取全量历史（比如一个用户的一段连续对话），实现简单、跨重启保留。**向量数据库**（如 Milvus）适合历史量很大时按相关性**检索**——历史太长不可能全量塞回 prompt，只能把每条历史向量化，按当前 query 挑出最相关的几条。这正是 RAG 那条线的延续。

---

## 结语：把"记住"变成一套可管理的机制

第六十七天的产出，是把"对话历史"从"一个数组"升级成"一套记忆机制"的完整链路：

```text
为什么需要记忆  大模型无状态 → 靠把历史 message 拼回 prompt "记住"
临时记忆        InMemoryChatMessageHistory → addMessage / getMessages，内存里，进程重启即丢
长期记忆        FileSystemChatMessageHistory → filePath + sessionId 持久化到 chat_history.json，跨重启恢复
上下文管理      截断（slice 按条数 / trimMessages 按 token）→ 配合总结、检索
统一框架        存储逻辑（内存 / 文件 / 数据库）× 管理逻辑（截断 / 总结 / 检索）
```

动手前，拿这份清单自检：

- [ ] 能否说清"大模型无状态"与 Agent = LLM + Harness（tool + RAG + memory）之间的关系，以及为什么 tool、RAG 都依赖 memory？
- [ ] 能否写出 `InMemoryChatMessageHistory` 的两轮对话循环：addMessage 用户消息 → 组装历史 → invoke → 把 AI 回复 addMessage 回历史？
- [ ] 能否解释 `FileSystemChatMessageHistory` 的 filePath + sessionId 如何实现跨重启恢复，以及 1.x 的类名改名？
- [ ] 能否说清记忆管理三手段（截断 / 总结 / 检索）各解决什么问题，以及截断的两种实现（slice 按条数、trimMessages 按 token）各自的取舍？
- [ ] 能否讲出 `trimMessages` 的 maxLength / tokenCounter / strategy 三个参数的作用，以及"token 单调递增 → 二分查找"的思路？

**这一天的本质，是把"Agent 记得住"从一句口号变成可落地的分层方案**：临时记忆放进内存、长期记忆落盘到文件，再通过截断把上下文窗口控制在预算内。存储轴（内存 → 文件 → 数据库）决定记忆能活多久，管理轴（截断 → 总结 → 检索）决定记忆放多少进来；两者交叉，就是一套能回答"历史放哪、放多少"的完整机制。理解了这条链路，再回头看 Agent 的连续对话，就多了一双"它靠什么记住、记到什么时候为止"的眼睛。
