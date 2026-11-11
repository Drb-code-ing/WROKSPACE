# 用 Redis 给 Agent 装一段「短期记忆」：从数据结构选型到摘要压缩

> 学习笔记 · 企业知识库 Agent 系列
>
> 大模型是无状态的。你在上一轮告诉它「我叫小明，住在杭州」，下一轮它忘得干干净净。要让它「记得住」，就得自己维护记忆。这篇讲清楚记忆分几层、为什么短期这一层非 Redis 不可、以及上下文超长时怎么压缩。

---

## 一、Agent Memory 的三层结构

```
┌─────────────────────────────────────────────┐
│  messages  会话内上下文（进程内存）           │  本轮请求，最快，随进程消失
├─────────────────────────────────────────────┤
│  Redis     短期记忆（会话级，带 TTL）         │  小时级，多实例共享
├─────────────────────────────────────────────┤
│  PSQL      历史消息 + 向量长期记忆            │  永久，跨会话，可检索
└─────────────────────────────────────────────┘
```

三层的边界不是按「存储介质」划的，而是按**生命周期**划的：

| 层 | 存什么 | 存活时间 | 关键操作 |
|---|---|---|---|
| messages | 本次请求的完整对话数组 | 一次请求 | 组装 Prompt |
| Redis | 会话历史快照（含摘要） | 30 分钟（滑动过期） | 读→拼接→写回 |
| PSQL | 全量历史 + 用户偏好向量 | 永久 | 语义检索 |

为什么不能只留 Redis 一层？因为 Redis 是**可用性优先**的（主从异步复制、可能丢数据），不能当唯一的数据源；为什么不能只留 PSQL？因为每轮对话都查一次库，延迟和 QPS 都扛不住。

> 一个常见误解：短期记忆不是「只存最近 N 条」，而是「**这个会话的完整工作记忆**」，只是它会过期。

---

## 二、为什么短期记忆非 Redis 不可

三个特性正好对上三个需求：

| 需求 | Redis 能力 |
|---|---|
| 会话闲置后自动清理，不想写定时任务 | **TTL**：`SET key val EX 1800`，到期自动删 |
| 多实例部署，用户第二次请求可能落到另一台机器 | **共享存储**：所有实例连同一个 Redis，会话天然共享 |
| 高频读写，亚毫秒延迟 | **内存数据库**：读写不落盘（AOF/RDB 是异步持久化） |
| 不同形态的数据（快照 / 日志 / 计数） | **七种数据结构** |

第二点最容易被忽略。没有共享存储时，用「IP 哈希」或「会话粘滞」把同一用户固定到同一台机器也能「看起来」可用，但一旦那台机器重启，会话就丢了，而且负载不均。

> 顺带复习负载均衡的四种算法：轮询、加权轮询、最少连接、IP 哈希。前三种都不保证会话落到同一台机器，所以**会话数据必须外置**——这就是 Redis 的立足点。

---

## 三、RedisMessageStore：一个不到 30 行的存储层

核心就四个方法：load / save / clear / ttl。

```js
class RedisMessageStore {
  constructor({ redis, keyPrefix, ttlSeconds }) {
    this.redis = redis
    this.keyPrefix = keyPrefix
    this.ttlSeconds = ttlSeconds
  }

  // ① key 命名空间：便于按会话清理、也便于以后按用户批量扫
  messagesKey(sessionId) {
    return `${this.keyPrefix}:${sessionId}:messages`
  }

  async loadMessages(sessionId) {
    const raw = await this.redis.get(this.messagesKey(sessionId))
    if (!raw) return []
    return mapStoredMessagesToChatMessages(JSON.parse(raw))
  }

  async saveMessages(sessionId, messages) {
    const payload = JSON.stringify(mapChatMessagesToStoredMessages(messages))
    // ② 'EX' 每次写入都刷新过期时间 → 滑动过期
    await this.redis.set(this.messagesKey(sessionId), payload, 'EX', this.ttlSeconds)
  }

  async clear(sessionId) {
    await this.redis.del(this.messagesKey(sessionId))
  }

  async ttl(sessionId) {
    return this.redis.ttl(this.messagesKey(sessionId))
  }
}
```

四个设计点值得展开：

**① key 命名空间**

```
agent:short_memory:{sessionId}:messages
```

用 `:` 分层不是装饰，而是为了：

- 运维能按前缀扫（`SCAN 0 MATCH agent:short_memory:*`）
- 以后加 `...:summary`、`...:meta` 不冲突
- 出问题能一眼看出是谁的数据

**② 为什么用 String 而不是 Hash / List**

| 结构 | 适合 | 不适合这里的原因 |
|---|---|---|
| **String**（整体 JSON） | 整存整取、一次读全量 | ✅ 这里就是「读全部 → 拼 prompt → 写回」，天然整存整取 |
| Hash | 按 field 局部更新 | 消息是**有序数组**，Hash 无序；而且几乎不会只改其中一条 |
| List | 天然有序、可 LPUSH/LRANGE | 能做，但要逐条读写，且**没法整体设置 TTL 的一致性**，序列化/反序列化也更碎 |

关键区别：**Hash 是对象快照（字段级操作），List 是日志流（尾插头读）**。对话上下文是「一个整体快照，每次整体替换」，所以 String 最合适。

**③ 序列化为什么不用 `JSON.stringify(messages)` 直接存**

LangChain 的 `BaseMessage` 是**类实例**（有方法、有 `_getType`），直接 `JSON.stringify` 会丢掉类型信息，读回来是普通对象，后续 `agent.invoke` 会报错。所以要过一层官方的转换：

```js
import {
  mapChatMessagesToStoredMessages,   // ChatMessage → 可序列化的纯对象
  mapStoredMessagesToChatMessages,   // 纯对象 → ChatMessage
} from '@langchain/core/messages'
```

**④ 滑动过期**

每次 `saveMessages` 都重新 `EX 1800`。效果是：用户一直在聊，key 就一直不过期；停止 30 分钟后自动消失。这正是「会话」该有的语义。

---

## 四、上下文太长怎么办：摘要是怎么压的

就算存下了全部历史，也不能全塞给模型——token 有上限，而且越长的上下文越贵、越慢、越容易「注意力涣散」。

这里用的是 DeepAgents / LangChain 的 `summarizationMiddleware`：

```js
const agent = createAgent({
  model,
  tools: [],
  systemPrompt: '...',
  middleware: [
    summarizationMiddleware({
      model,                 // 用哪个模型做摘要（可以比主模型更便宜）
      summaryPrompt,         // 自定义摘要提示词
      trigger: { messages: 8 },  // 超过 8 条触发
      keep: { messages: 4 },     // 保留最近 4 条原文
    }),
  ],
})
```

### 触发与压缩逻辑

```
第 1 轮：2 条（user + assistant）
第 2 轮：4 条   阈值 8，不压缩
第 3 轮：6 条   不压缩
第 4 轮：8 条   ← 达到 trigger，开始压缩
         ↓
压缩后：4 条原文 + 1 条摘要 = 5 条
第 5 轮：7 条   不压缩
第 6 轮：9→ 压缩 → 5 条
```

### 一个关键问题：摘要算不算一条 message？

**算，而且是 1 条。** 压缩后的结构是：

```
[RemoveMessage(REMOVE_ALL_MESSAGES), summaryMessage, ...preservedMessages]
```

- `summaryMessage` 是一条 `HumanMessage`，`additional_kwargs.lc_source = 'summarization'`
- 它复用了 `conversationMessages[0].id`（**不能复用 `id` 会冲突**）
- 内容前缀固定为 `Here is a summary of the conversation to date:`

所以压缩后的长度是 `keep + 1 = 5`，而不是 4。这一点在算 token 预算时要算进去。

### 摘要提示词要有「信息密度」

```js
const summaryPrompt = `
你是对话摘要助手。请用中文总结以下对话，包含：
1. 讨论的主要话题
2. 用户提到的重要事实（姓名、偏好、日期等，务必保留原文信息）
3. 继续对话所需的关键上下文

保持简洁、不要编造、不要遗漏用户明确说过的信息。

待摘要的对话：
{messages}

摘要：`
```

三条原则：**保留事实原文**（「杭州」不能变成「某个城市」）、**不要编造**、**只留后续需要的**。摘要写不好，压缩就等于遗忘。

---

## 五、主循环：一次对话的完整读写

```js
async function invokeWithMemory(agent, store, sessionId, userText) {
  // ① 读：从 Redis 取历史
  const history = await store.loadMessages(sessionId)

  // ② 拼：历史 + 本轮输入，一起交给 agent
  const result = await agent.invoke(
    { messages: [...history, new HumanMessage(userText)] },
    { recursionLimit: 30 },
  )

  // ③ 写：把完整结果（含中间件产生的摘要）写回 Redis
  await store.saveMessages(sessionId, result.messages)

  return result
}
```

三个细节：

- **为什么要把 `result.messages` 整体写回**：因为中间件在 `beforeModel` 阶段改写过的消息（删掉的旧消息 + 新摘要）都在里面。只追加本轮两条，压缩就白做了。
- **`recursionLimit: 30`**：LangGraph 的递归保护，防止 agent 在工具调用里死循环。
- **TTL 在写入时刷新**，所以每次对话都在延长会话寿命。

### `/clear` 删的到底是什么

```js
if (userText === '/clear') {
  await store.clear(SESSION_ID)   // DEL agent:short_memory:demo_user_001:messages
  continue
}
```

删的是**整个会话 key**，不是某条消息。所以执行后 `ttl` 返回 `-2`（key 不存在），而不是一个正数。区分几个返回值：

| 返回值 | 含义 |
|---|---|
| `>= 0` | 还有多少秒过期 |
| `-1` | key 存在但没有过期时间（永不过期）**——说明 `EX` 没生效** |
| `-2` | key 不存在（被删或已过期） |

---

## 六、七种数据结构，怎么选

| 类型 | 底层 | 典型场景 | 本项目用在哪 |
|---|---|---|---|
| **String** | SDS | 缓存、计数器、分布式锁、会话快照 | ✅ 对话快照 |
| **Hash** | 哈希表/ziplist | 对象字段、购物车、用户资料 | 以后存会话元信息 |
| **List** | 双向链表/quicklist | 消息队列、操作日志、时间线 | 任务队列的简化版 |
| **Set** | 哈希表/整数集合 | 去重、标签、共同好友、黑名单 | 知识库文档去重 |
| **ZSet** | 跳表 | 排行榜、延迟队列、权重排序 | 搜索结果热度 |
| **Bitmap** | 位数组 | 签到、活跃统计（1 亿用户 12MB） | 用户活跃度 |
| **Geo** | ZSet + geohash | 附近门店、距离计算 | 江西装修门店选址 |

**Hash 和 List 最容易混**，一句话区分：

> Hash 存「一个对象的多个字段」（可以只改某个字段），List 存「一串有序的事件」（只能头尾增删）。
> 商品资料、购物车 → Hash；聊天记录、操作日志 → List。

而对话上下文两者都不选，用 String 的原因见第三节——我们要的是**整体快照**，不是字段级更新，也不是流式追加。

---

## 七、顺手复习：分布式锁 `SET NX EX`

虽然不是记忆功能，但这是 Redis 最常被问的用法，也是 String 的经典场景：

```js
const ok = await redis.set('lock:order:1011', 'locked', 'NX', 'EX', 10)
console.log(ok ? '加锁成功' : '加锁失败')
```

两个参数缺一不可：

- **`NX`**（Not eXists）：key 不存在才设置成功 → 保证互斥，同一时刻只有一个客户端拿到锁
- **`EX 10`**：10 秒后自动过期 → **防止死锁**

如果没有 `EX`，客户端拿到锁后进程崩溃，这把锁就永远不释放，全站卡死。`EX` 是**自愈机制**。

但 `EX` 又带来新问题：业务执行超过 10 秒，锁会提前释放。所以工程上还要：

1. **看门狗（watchdog）**：后台线程定期给锁续期
2. **Lua 脚本原子释放**：先 `GET` 判断是不是自己的锁，再 `DEL`——两步必须原子，否则会误删别人的锁

```lua
if redis.call('get', KEYS[1]) == ARGV[1] then
  return redis.call('del', KEYS[1])
else
  return 0
end
```

3. **接受主从丢锁**：Redis 主从是异步复制，主节点刚写锁就宕机、从节点还没同步，新主上锁就没了。要强一致得用 Redlock 或者换 etcd/ZooKeeper——这也是「Redis 不适合做唯一数据源」的另一个证据。

---

## 八、我实际踩过的坑

| 现象 | 原因 | 修法 |
|---|---|---|
| `Cannot find package 'ioredis'` | 没装依赖 | `npm i ioredis` |
| `TypeError: Redis is not a constructor` | 用了 node-redis 的写法配 ioredis | `import Redis from 'ioredis'`（默认导出就是构造函数） |
| `does not provide an export named 'mapChatMessagestoStoredMessages'` | 导出名大小写错 | 正确是 `mapChatMessagesToStoredMessages`（复数 Messages + 小写 to） |
| `ReferenceError: StorageEvent is not defined` | 把 `store.loadMessages` 误写成浏览器 API | 改成方法调用 |
| 脚本跑完不退出，终端卡住 | ioredis 长连接占着事件循环 | `finally { await redis.quit() }` |
| Docker 起不来 | Docker Desktop 未启动 | 先启引擎，再看 `\\.\pipe\dockerDesktopLinuxEngine` 是否存在 |

第 5 条是 Node 里用长连接客户端的通病：**连接是活跃句柄，不 `quit()` 进程就不会自然退出**。CLI 脚本一定要在 `finally` 里关连接。

---

## 九、面试速答

**Q：Agent 的记忆怎么设计？**
三层：messages 管本轮上下文（进程内存），Redis 管会话级短期记忆（带 TTL、多实例共享），PSQL 管跨会话长期记忆（全量历史 + 向量检索）。再叠一层压缩策略（截断 / 摘要 / 检索）解决上下文窗口上限。

**Q：短期记忆为什么用 Redis 而不是数据库？**
三个刚需：TTL 自动过期不用写清理任务、多实例共享解决负载均衡下的会话漂移、内存读写亚毫秒级。数据库做这两件事要么加定时任务，要么扛不住 QPS。

**Q：对话历史存 Redis 用什么结构？**
String 存整体 JSON 快照。因为是「读全量 → 拼 prompt → 整体写回」，不需要字段级更新（Hash 的优势）也不需要流式追加（List 的优势）。Hash 适合对象快照、List 适合日志流。

**Q：上下文超长怎么处理？**
超过阈值触发摘要：保留最近 N 条原文，把更早的对话压成 1 条摘要消息。摘要本身占 1 条 message，所以压缩后长度是 `keep + 1`。摘要提示词要求保留事实原文、不许编造。

**Q：`SET NX EX` 为什么两个都要？**
`NX` 保证互斥（只有一个人能拿到锁），`EX` 保证自愈（持有者崩溃后锁会自动释放，避免死锁）。少了 NX 会互相覆盖，少了 EX 会永久死锁。进阶还要 watchdog 续期 + Lua 原子释放 + 接受主从切换丢锁。

**Q：Redis 能当唯一数据源吗？**
不能。它可用性优先：主从异步复制可能丢最近写入，持久化（AOF/RDB）也是异步的。所以重要数据必须落库，Redis 只做缓存/加速层。

---

## 十、和长期记忆的衔接

短期记忆解决「这次聊什么」，长期记忆解决「这个人是谁」。下一步是用 Mem0 或自建的 `psql + pgvector` 做跨会话记忆：

- 写路径：从对话里抽取事实 → 与已有记忆比对 → ADD / UPDATE / DELETE / NOOP
- 读路径：按用户维度召回 top-k，拼进 system prompt
- 关键设计：软失效（`valid_to` + `superseded_by`）而不是物理删除，保证可回溯

而 Redis 这一层始终不承担「事实存储」的职责——它只是让**正在进行的这场对话**跑得更快。
