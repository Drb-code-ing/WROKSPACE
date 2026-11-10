# RabbitMQ 原理与机制：消息为什么会丢、又凭什么不丢

> 学习笔记 · 企业知识库 Agent 系列
>
> 背景：RAG 流水线里，上传的 pdf / docx / pptx 要先解析成 Markdown，再分片写入 Milvus（向量）和 ES（全文检索）。这一整套动辄几十秒到几分钟，如果放在 HTTP 请求里同步等，接口会超时、用户会骂人、机器会被占满。于是引出消息队列。这篇不写「怎么调 API」，只讲**消息在 RabbitMQ 内部到底怎么走、在哪一步会丢、靠什么保证不丢**。

---

## 一、先想清楚：MQ 解决的不是「快」，是「等」

同步链路长这样：

```
上传接口 → 解析 PDF（10~60s）→ 切片 → 调 embedding（几秒）→ 写 Milvus → 写 ES → 返回 200
```

时间全压在请求线程上，还会带来三个连锁问题：接口超时、上游重试导致重复解析、解析服务挂了整个上传功能不可用。

拆成异步后：

```
上传接口 → 落库 + 投递一条消息 → 立刻返回 202
                              ↓
                    解析 worker 慢慢消费
```

收益其实只有三条，但每条都很硬：

| 收益 | 含义 | 在本项目里 |
|---|---|---|
| **解耦** | 上传方不需要知道有几个下游、下游是什么 | 以后加「OCR 识别」「敏感词检测」不用改上传接口 |
| **异步** | 耗时操作移出请求链路 | 接口 200ms 返回，解析后台跑 |
| **削峰** | 队列当缓冲池，消费能力决定处理速度 | 早上 9 点 300 个销售同时传文档，不会把 embedding 接口打爆 |

反过来，以下场景**不该**上 MQ：需要同步拿到结果（用户等你返回）、业务量极小（一个 `setTimeout` 就够）、全链路要求强一致（分布式事务的复杂度会反噬你）。

---

## 二、RabbitMQ 的模型：消息**从不**直接进队列

这是最容易理解错的一点。生产者不是「往某个队列里塞消息」，而是**把消息交给交换机（Exchange），由交换机决定投给哪些队列**。

```
Producer ──publish──▶ Exchange ──binding──▶ Queue ──deliver──▶ Consumer
                        │                    │
                        │                    └── 真正存消息的地方（有存储能力）
                        └── 纯路由器（不存消息！）
```

四个角色，各自职责不能混：

| 概念 | 是什么 | 关键点 |
|---|---|---|
| **Connection** | 一条 TCP 长连接 | 建立成本高，进程内复用 |
| **Channel** | 连接上的虚拟通道 | 轻量，**绝大多数操作用 channel 而不是 connection**；一个 channel 内的命令是串行的 |
| **Exchange** | 路由器 | **没有存储能力**，路由不到就丢 |
| **Queue** | 存储 + 投递单元 | 消息真正的容器，有 `durable` 属性 |
| **Binding** | Exchange → Queue 的路由规则 | 本质是一张「路由表」 |
| **vhost** | 逻辑隔离单元 | 默认 `/`，权限、队列、交换机都按 vhost 隔离 |

> 为什么要 Channel？如果每条消息都开一条 TCP，握手和内存开销会直接压垮 Broker。Channel 把「多路复用」做在协议层，所以同一个 Connection 上可以并发开多个 Channel，且互相隔离（一个 Channel 报错不会连带其他 Channel）。

---

## 三、交换机四种类型 = 四张不同的路由表

Exchange 的类型决定了「怎么拿 routing key 去匹配 Binding」。这是 RabbitMQ 最核心的机制差异。

| 类型 | 路由规则 | 典型用途 | 一条消息被几个队列收到 |
|---|---|---|---|
| **fanout** | 忽略 routing key，**广播给所有绑定队列** | 事件通知：一份文档解析完成后，同时通知向量库、ES、埋点 | N 个（每个绑定队列各一份） |
| **direct** | routing key **精确字符串相等** | 按级别/类型分发：`info` / `warning` / `error` | 1 个（可能有多个队列绑同一个 key） |
| **topic** | routing key 按 `.` 分段，支持 `*`（一段）和 `#`（零到多段） | 多维度订阅：`doc.pdf.parse`、`doc.docx.parse` | 多个（按模式匹配） |
| **headers** | 看消息 headers 键值，忽略 routing key，支持 `x-match: all/any` | 路由维度不是字符串时（少见） | 多个 |

### 本次实验的真实证据

`direct` 模式下我只启动了一个消费者（默认 routing key `info`），生产者却发了 `info` / `warning` / `error` 三条。结果是**只收到一条**。直接查 Broker 上的绑定表就能解释：

```
$ rabbitmqctl list_bindings source_name routing_key destination_name

doc.parse.direct    info    doc.task.info      ← 只有这一条绑定
doc.parse.fanout            doc.elasticsearch  ← fanout 的绑定没有 routing key
```

因为 `doc.task.warning` / `doc.task.error` 这两个队列**从未被创建**（消费者没启动过），交换机找不到匹配的绑定，那两条消息就**被静默丢弃**了。

这引出 MQ 里最重要的一个认知：

> **「交换机没有存储能力」= 路由不到就丢，而且不报错。**

`sent` 只代表「我发出去了」，不代表「有人会处理」。

### 想感知「被丢了」怎么办

```js
// 发布端：声明 mandatory，并监听 return 事件
channel.on('return', (msg) => {
  console.log('[未被路由] routingKey =', msg.fields.routingKey)
})

channel.publish(EXCHANGE, key, buf, { mandatory: true })
```

`mandatory: true` 表示「如果没有任何队列接收，请把消息退回给我」，此时 Broker 会触发 `basic.return`，客户端触发 `return` 事件。这是排查「消息凭空消失」的第一把工具。

---

## 四、一条消息的完整生命周期

```
① publish          生产者 → Channel → Broker
② route            Exchange 按 Binding 匹配，可能：命中 / 未命中（丢弃或退回）
③ enqueue          进入 Queue；durable + persistent 时写入磁盘
④ deliver          按 prefetch 窗口推给消费者（消费端拉/推结合）
⑤ ack / nack       处理成功 ack → 删除；失败 nack → 重入队或进死信
⑥ 终态             ack 删除 / TTL 过期 / 超长丢弃 / 进死信队列
```

每一步都有对应的失败模式，先记住这张「故障地图」，后面排查就不会瞎猜：

| 阶段 | 可能出的问题 | 现象 |
|---|---|---|
| ① publish | 交换机不存在、连接断了 | 客户端报错，或消息进本地缓冲后随进程消失 |
| ② route | 无绑定 / key 写错 | **消息静默消失**（本次实验） |
| ③ enqueue | 队列不持久化、消息不持久化 | Broker 重启后消息没了 |
| ④ deliver | 消费者处理慢、prefetch 过大 | 消息全堆在消费者的内存里，Broker 显示「无积压」但就是不处理 |
| ⑤ ack | 忘了 ack / ack 前进程崩 | 消息永远 unacked，卡住队列（且不释放 prefetch 额度） |
| ⑥ 终态 | 没有死信队列 | 失败消息被丢掉后无从追查 |

---

## 五、可靠性：三道闸，缺一道就漏

很多人以为「`durable: true` 就万无一失」，其实它只覆盖了中间那一段的一部分。完整的可靠性要分三段看：

### 闸门一：生产者 → Broker（消息到底到了吗）

```js
const channel = await connection.createConfirmChannel()  // 注意是 ConfirmChannel
channel.publish(EX, key, buf, { persistent: true })
await channel.waitForConfirms()   // 等 Broker 确认「已落盘」
```

- 普通 `channel.publish` 是 **fire-and-forget**，返回 `false` 只表示本地写缓冲满了，不代表 Broker 收到。
- Confirm 模式下，Broker 处理完（持久化队列则是落盘后）回 `basic.ack`，客户端才 resolve。
- 配合上一节的 `mandatory + return`，才同时覆盖「没到 Broker」和「到了但没人要」两种情况。

### 闸门二：Broker 内部（重启还在吗）

需要**两个**属性同时成立：

```js
await channel.assertQueue('doc.task.info', { durable: true })      // 队列本身持久化
channel.publish(EX, key, buf, { persistent: true })                // 消息标记为持久化
```

- 只 durable 队列、消息不持久 → 队列还在，消息没了。
- 只持久消息、队列不 durable → 队列都没了，消息无处依附。
- 代价：每条消息多一次磁盘写，吞吐下降明显。日志/埋点这类可重算的数据，可以不开。

> 补充：RabbitMQ 3.8+ 的 **quorum queue**（`x-queue-type: quorum`）基于 Raft，天生多副本 + 持久化，适合可靠性要求高的场景；传统的 mirrored classic queue 已被标记废弃。

### 闸门三：Broker → 消费者（处理完了吗）

```js
channel.prefetch(10)                      // 每个消费者最多 10 条未确认

channel.consume(QUEUE, async (msg) => {
  if (!msg) return
  try {
    await handle(msg)                   // 业务处理
    channel.ack(msg)                    // 成功了才确认
  } catch (e) {
    channel.nack(msg, false, false)     // 失败：不重新入队，走死信（或 true 重投）
  }
})
```

两个参数必须理解：

- **`prefetch(n)`**：限制「已投递但未 ack」的数量。设太大，消息全涌进消费者内存，进程一崩全丢（还在 unacked 状态但处理到一半）；设太小（如 1），吞吐上不去。经验值：I/O 密集型可 10~50，CPU 密集（如 PDF 解析）建议 1~5。
- **手动 ack**：`ack` 之前的任何崩溃，Broker 都会把消息重新投给别的消费者 —— 这就是「至少一次」的由来。

### 三段闸门总表

| 配置 | 保证什么 | **不保证**什么 |
|---|---|---|
| `persistent: true` | Broker 重启后消息还在 | 消息是否到达 Broker（需 confirm） |
| `durable: true` | 交换机/队列重启后还在 | 队列里消息是否还在（需 persistent） |
| publisher confirm | 消息已到 Broker 并处理 | 消费者是否处理成功 |
| 手动 ack + prefetch | 处理失败会重投 | 不会重复投递 |
| 死信队列 | 失败消息可追溯 | 消息不丢（只是换了个地方） |

---

## 六、投递语义：没有免费的「恰好一次」

| 语义 | 怎么实现 | 风险 |
|---|---|---|
| **at-most-once**（最多一次） | 自动 ack / ack 前不判失败 | 会丢 |
| **at-least-once**（至少一次） | 手动 ack，失败重投 | **会重复** |
| **exactly-once**（恰好一次） | MQ 层面做不到 | 只能靠业务侧补偿 |

结论：**实际生产用的是 at-least-once + 消费端幂等**。

幂等的落地方式（按成本从低到高）：

1. **天然幂等**：`UPDATE doc SET status='parsed' WHERE id=?`，重复执行结果一样。
2. **去重表 / 唯一索引**：用消息里的业务 ID（如 `docId + version`）建唯一约束，重复插入直接冲突。
3. **Redis SETNX**：`SET processed:{msgId} 1 NX EX 86400`，抢到才处理。
4. **状态机**：只允许 `pending → parsing → done`，重复投递时状态不合法就跳过。

在文档解析场景里，最自然的是第 1 + 4 条：`docId` 是业务主键，解析是幂等的（覆盖写）。

---

## 七、消息堆积、TTL 与死信

### 堆积了怎么办

「消息堆积」= 生产速度 > 消费速度。三种处理：

| 手段 | 说明 | 注意 |
|---|---|---|
| **加消费者** | 同一队列多开进程，RabbitMQ 会轮询分发 | 队列是竞争消费，**不保证顺序** |
| **调大 prefetch** | 让单个消费者吃更多 | 内存风险，CPU 密集任务反而更慢 |
| **限流 / 拒绝** | 发布端降速，或给队列设 `x-max-length` | 超长会丢最老的消息 |

### TTL 与死信（DLX）

死信队列不是单独的东西，而是「消息在满足某些条件后，被转发到另一个交换机」。

触发死信的三种情况：

1. 消费者 `nack` / `reject` 且 `requeue=false`
2. 消息 TTL 过期（队列级 `x-message-ttl` 或消息级 `expiration`）
3. 队列超过 `x-max-length` 被挤出

声明方式（消费端）：

```js
await channel.assertExchange('doc.dlx', 'direct', { durable: true })
await channel.assertQueue('doc.dead', { durable: true })
await channel.bindQueue('doc.dead', 'doc.dlx', 'dead')

await channel.assertQueue('doc.task.info', {
  durable: true,
  arguments: {
    'x-dead-letter-exchange': 'doc.dlx',
    'x-dead-letter-routing-key': 'dead',
  },
})
```

好处：失败的消息不会凭空消失，可以人工排查、批量重放。代价：每个死信都要单独建队列和监控，否则就是个黑洞。

---

## 八、进程边界：为什么消费端要单独一个进程

上一节讲的都是 Broker 侧，这一节讲客户端侧 —— 也是**面试和线上事故最容易翻车的地方**。

RabbitMQ Broker 是**独立进程**（这里是 Docker 容器），你的服务通过 **TCP + AMQP 协议**与它交互。所以：

- 没有共享内存，没有「线程间通信」，只有网络 I/O；
- Broker 挂了，你的 `publish` 会失败或进本地缓冲；
- 消费端收到的消息，是在**自己进程的事件循环**里执行回调的。

Node.js 是单线程事件循环，这意味着：

```js
channel.consume(QUEUE, async (msg) => {
  await parsePdf(msg)   // 如果是纯 CPU 同步解析，整个服务卡住
  channel.ack(msg)
})
```

| 回调里的操作 | 后果 |
|---|---|
| `await` I/O（读文件、调 HTTP） | 让出事件循环，不阻塞 |
| 同步 CPU 密集（PDF 解析、图片编码、向量计算） | **整个进程卡死**，连健康检查都超时 |

所以正确姿势是：**API 服务和解析 worker 拆成两个独立进程/容器**。worker 崩了不影响主站，重启也不丢失未 ack 的消息。

本次实验也侧面印证了这个模型怎么观察：

- 消费者是**常驻进程**，启动后一直挂着等消息；
- 生产者发完 `setTimeout` 500ms 就关闭连接退出，**没有任何输出**。

一开始我误以为「运行 producer 应该打印监听」，其实监听是消费者的日志 —— 两个进程各司其职。

---

## 九、选型：RabbitMQ / Kafka / Redis 队列

| 维度 | RabbitMQ | Kafka | Redis（Stream / BullMQ） |
|---|---|---|---|
| 定位 | 传统消息中间件 | 分布式日志/流平台 | 轻量队列（借 Redis 实现） |
| 路由能力 | **强**（四种 Exchange + binding） | 弱（只有 topic 分区） | 弱 |
| 吞吐 | 万级/秒 | **十万~百万级/秒** | 万级/秒 |
| 消息回溯 | 不支持（消费即删） | **支持**（按 offset 重放） | Stream 支持有限 |
| 延迟 | 低 | 偏高（批处理） | **最低** |
| 运维复杂度 | 中 | 高 | 低（已有 Redis 就近乎零成本） |
| 典型场景 | 业务异步、任务分发、RPC 解耦 | 日志采集、事件流、CDC | 小项目、定时任务、轻量后台任务 |

一句话记忆：

> **要复杂路由 + 可靠投递选 RabbitMQ；要大吞吐 + 可重放选 Kafka；已经用着 Redis、任务不重就选 BullMQ。**

---

## 十、落到本项目

### 目录

```
rabbitmq-demo/
├── docker-compose.yml          # rabbitmq:3.13-management，5672 + 15672
├── readme.md
└── src/
    ├── config.mjs              # amqp 连接与 channel 创建（复用在各 demo）
    ├── fanout/                 # 广播：一份解析结果通知多个下游
    │   ├── producer.mjs
    │   ├── consumer-es.mjs
    │   └── consumer-vector.mjs
    └── direct/                 # 精确分发：按日志级别路由
        ├── producer.mjs
        └── consumer.mjs
```

### 启动

```powershell
docker compose up -d                 # 控制台 http://localhost:15672  admin / Admin@123456

# fanout：先起消费者，再发消息
node src/fanout/consumer-es.mjs
node src/fanout/producer.mjs

# direct：三种 routing key 各起一个消费者
node src/direct/consumer.mjs info
node src/direct/consumer.mjs warning
node src/direct/consumer.mjs error
node src/direct/producer.mjs
```

### 已验证的现象

| 实验 | 结果 | 说明了什么 |
|---|---|---|
| fanout，消费者先启动 | 收不到任何东西 → 启动消费者后立刻收到历史消息 | 队列 durable + 消息 persistent，消息不会随发送方退出而消失 |
| direct，只起 `info` 消费者 | 只收到 1 条 | 路由未命中的消息被交换机丢弃 |
| `rabbitmqctl list_bindings` | 只有 `info → doc.task.info` | Exchange 靠绑定表路由，不是「广播给所有人」 |

### 待改进

1. `fanout/consumer-vector.mjs` 与 `consumer-es.mjs` 目前共用队列 `doc.elasticsearch` —— 两个进程同时跑会**竞争消费**，要改成各自独立队列（`doc.vector` / `doc.elasticsearch`）才是真广播。
2. 消费者读取 `data.docId`，但生产者发的字段是 `doc`，日志里会出现 `undefined`。
3. 生产端还没用 `ConfirmChannel`，消费端还没配 `prefetch` 和死信队列 —— 生产环境必须补。

---

## 十一、面试速答

**Q：说说 MQ 的作用？**
解耦、异步、削峰。但本质是把「同步等待」换成「异步最终一致」，代价是链路的可观测性变差、要额外处理重复和丢失。

**Q：RabbitMQ 一条消息怎么流转？**
Producer 发给 Exchange（不直接发队列），Exchange 按 Binding 匹配 routing key 路由到 Queue，Queue 存储并按 prefetch 投给消费者，消费者 ack 后删除。**Exchange 没有存储能力，路由不到就丢。**

**Q：怎么保证消息不丢？**
三段：① 生产端用 publisher confirm + `mandatory` 保证「到 Broker 且有人接」；② Broker 侧 `durable` 队列 + `persistent` 消息（或直接用 quorum queue）；③ 消费端手动 ack + prefetch，失败进死信队列。

**Q：消息重复了怎么办？**
at-least-once 是常态，靠消费端幂等：业务主键唯一约束、去重表、Redis SETNX、状态机。MQ 本身做不到 exactly-once。

**Q：消息堆积怎么排查？**
先看是生产快了还是消费慢了：管理台看 Ready / Unacked / Consumers 三个数。Unacked 高说明消费者处理慢或忘了 ack；Ready 持续涨说明消费者数量不够或 prefetch 太小。

**Q：为什么消费端要单独部署？**
Node/Python 的消费回调跑在主线程/事件循环上，CPU 密集任务会阻塞整个服务。拆成独立 worker 进程，才能既不影响主站又能独立扩缩容。
