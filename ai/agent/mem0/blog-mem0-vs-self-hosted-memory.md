# 从「存一条记忆」到「管一段记忆」——Mem0 与自建 psql+向量长期记忆的取舍

> 面试复盘笔记 · 企业知识库 Agent 系列
>
> 背景：我在做一个面向江西装修公司 300 人销售团队的企业知识库 Agent。短期记忆用 Redis（会话内 messages + 摘要压缩），长期记忆面临选型：直接上 Mem0，还是自己用 PostgreSQL + pgvector 搭一套。这篇把两边的机制、边界和取舍讲清楚，也是我准备面试话术的底稿。

---

## 一、先把「长期记忆」这件事拆开

很多人一上来就比「谁存得快、谁检索准」，其实长期记忆是四个动作的组合：

| 动作 | 干什么 | 谁来决定 |
|---|---|---|
| 抽取 extract | 从对话里判断「哪句话值得长期记住」 | **策略** |
| 存储 store | 落库 / 建索引 | 存储层 |
| 检索 retrieve | 按语义或关键字召回 | 检索层 |
| 维护 reconcile | 去重、合并、更新、失效 | **策略** |

自建方案（psql + 向量）通常只覆盖了 **store + retrieve** 这两个动作；而 Mem0 真正多出来的是 **extract + reconcile**。

**这就是本质区别：不是「数据库选型之争」，而是「记忆的生命周期该由谁来管」。**

---

## 二、Mem0 是怎么管记忆的

### 2.1 作用域（scope）

Mem0 用四个 ID 划分记忆的作用范围，一次 add/search 可以带其中一个或多个：

- `user_id`：跟人走的长期信息（姓名、城市、偏好、预算习惯）
- `agent_id`：这个助手是谁（角色设定、语气、回答风格）
- `run_id`（云版也有叫 session）：这次会话临时目标，「这次先帮我把季度总结大纲列出来」
- `app_id`：多应用隔离

对应到我的项目：`user_id = 销售顾问工号`，`agent_id = 家装顾问机器人`，`run_id = 一次客户跟进会话`。

### 2.2 写入路径（write path）——最关键的一段

`client.add(messages, { userId })` 并不是「原样存一条聊天记录」，内部大致是这样：

1. LLM 从这几轮对话里**抽取事实**（"我是素食主义者且对坚果过敏" → 两条独立事实）
2. 用新事实去检索**已存在的相关记忆**（向量相似）
3. LLM 做**四态决策**：
   - `ADD` —— 没有相关记忆，新增
   - `UPDATE` —— 有相关记忆且信息变化，原地改
   - `DELETE` —— 新信息否定了旧信息
   - `NOOP` —— 已有等价记忆，不动
4. 每次变更写进 **history**，可回溯

所以它天然就带「去重 + 冲突解决」能力，这是自建方案里最容易被忽略、也最难做对的一块。

### 2.3 一个常见误解：update 等于新增吗？

不是。云版 `client.update(id, { text })` 走的是 `PUT /v1/memories/{id}/`，是**原地修改**，`id` 不变；旧值不会作为一条新记忆留在检索池里，只会在 `client.history(id)` 的变更流里留痕。

（项目里验证过的脚本：[mem0-test.mjs](file:///e:\WROKSPACE\ai\agent\mem0\mem0-test\src\mem0-test.mjs)、[mem0-scoped-memory-test.mjs](file:///e:\WROKSPACE\ai\agent\mem0\mem0-test\src\mem0-scoped-memory-test.mjs)）

### 2.4 检索

Mem0 的卖点是 **多路召回融合**：语义向量 + BM25 关键字 + 知识图谱，默认做融合打分和排序。对「用户偏好」这类口语化、短句、同义表达多的场景，多路召回比纯向量稳。

### 2.5 两种部署形态（面试常被追问）

| 形态 | 包 | 组成 | 数据在哪 |
|---|---|---|---|
| 云版 | `mem0ai` → `MemoryClient` | 官方托管，只给 apiKey | 出境，走公网 |
| 自托管 | `mem0ai/oss` | 自己配 `llm` + `embedder` + `vectorStore` + `historyStore` | 自己的库 |

自托管听起来很美，但它是「把 LLM 决策逻辑搬到你的机器上」，不是「免费的云版」。而且它对依赖挺挑：`historyStore` 走 better-sqlite3，Windows 上装它要 node-gyp 编译，得换镜像源。

---

## 三、自建 psql + pgvector 是什么样子

### 3.1 表结构

```sql
CREATE TABLE agent_memories (
  id            BIGSERIAL PRIMARY KEY,
  user_id       TEXT NOT NULL,
  agent_id      TEXT,
  content       TEXT NOT NULL,
  embedding     vector(1024) NOT NULL,
  memory_type   TEXT,                -- preference / fact / task ...
  source_msg_id TEXT,                -- 溯源到原始对话
  confidence    REAL DEFAULT 1.0,
  valid_from    TIMESTAMPTZ DEFAULT now(),
  valid_to      TIMESTAMPTZ,         -- NULL 表示当前有效
  superseded_by BIGINT REFERENCES agent_memories(id),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON agent_memories USING hnsw (embedding vector_cosine_ops);
CREATE INDEX ON agent_memories (user_id, valid_to);
```

### 3.2 检索

```sql
SELECT id, content, 1 - (embedding <=> $1) AS score
FROM agent_memories
WHERE user_id = $2 AND valid_to IS NULL
ORDER BY embedding <=> $1
LIMIT $3;
```

### 3.3 真正的工作量在哪

不是 SQL——SQL 一天就写完了。工作量在于：

- **抽取**：什么时候触发「把这几轮对话提炼成事实」？触发频率？抽几条？
- **冲突**：「我不喜欢欧式风格」和「客户最近说想要欧式」怎么处理？谁覆盖谁？
- **失效**：旧记忆删掉还是软失效？（我会用 `valid_to` + `superseded_by`，保留审计）
- **召回质量**：阈值定多少？0.85 太严会漏，0.6 太松会串。

**自建 = 你自己写这套策略；Mem0 = 这套策略已经写好了（且被大量场景调过参）。**

---

## 四、正面对比

| 维度 | 自建 psql + pgvector | Mem0 |
|---|---|---|
| 写入语义 | 业务代码决定存什么 | LLM 抽取 + 四态决策 |
| 去重/冲突 | 自己实现（阈值 + 软失效） | 内置 |
| 检索 | 向量（可加 tsvector / BM25） | 向量 + BM25 + 图谱，默认融合 |
| 数据边界 | 完全内网，不出公司 | 云版数据出境；自托管可内网但部署复杂 |
| 与业务表关系 | 原生 SQL JOIN（客户、订单、房源） | 只能靠 `user_id` 关联，跨表查询得自己补 |
| 可解释性 | 每行怎么来的都清楚 | 黑盒：为什么这条没更新？只能看 history |
| 成本 | 存算自己控，几百万条可控 | 每次 add 至少 1~2 次 LLM 调用，量大很贵 |
| 起步速度 | 慢（要设计 + 写策略） | 快（几行代码接上） |
| 误合并风险 | 低（规则可控） | 有（LLM 判断失误会覆盖正确记忆） |
| 多租户/权限 | 自己写，天然贴合业务权限 | 需要额外适配 |
| 迁移锁定 | 无 | 云版迁移成本高 |

### 一句话优缺点

- **自建**：可控、可审计、可 JOIN、成本低、数据不出内网；代价是你得自己当「记忆策略的产品经理」，且召回质量要靠评测集慢慢调。
- **Mem0**：开箱即用、自带抽取与冲突解决、多路召回、生态成熟；代价是黑盒、LLM 成本、云版数据出境、以及误合并这类静默故障。

---

## 五、我的结论：不是选一个，而是分层

企业知识库 + 300 人销售团队这个场景，我会这样切：

```
会话内（秒级）   →  LangChain messages + summarizationMiddleware
会话短期（小时） →  Redis（agent:short_memory:{sessionId}:messages，TTL 1800s）
长期记忆（永久） →  PostgreSQL（权威行 + valid_to 软时间有效性）
                   └─ pgvector：只是这张表的一个检索索引，不是另一个数据库
                   └─ Redis 放会话快照，不放事实
Mem0            →  先做基线：用它跑一遍同数据集，比我自建的召回率是多少
```

**Mem0 在这里的角色：先当对照实验，再决定要不要自建。** 如果自建在 20~50 组真实对话的评测集上打不过它，就说明我的抽取/冲突策略有问题，而不是「我该不该用 Mem0」的问题。

---

## 六、面试怎么一针见血

### 6.1 30 秒版（背下来）

> 「这俩不是存储选型之争，是**记忆生命周期管理**的取舍。自建的 psql+向量我只做了 store 和 retrieve，**写什么、什么时候覆盖、旧记忆怎么失效，全是我业务代码里手写的规则**；Mem0 把这层交给 LLM，add 的时候做抽取 + 四态决策（ADD/UPDATE/DELETE/NOOP），所以它天生带去重和冲突解决，代价是黑盒和 LLM 成本。我们项目是装修公司内网数据 + 要和客户、订单表做 JOIN，所以我选**以 psql 为权威存储、pgvector 只作索引、Mem0 只当评测基线**。」

### 6.2 三枪追问防御

**Q1：「你说的重复记忆问题，自建怎么解决？」**

> 向量召回取 top5，相似度 > 0.85 视为同一事实候选，交给一个轻量 prompt 判 `覆盖/并存/否定`；覆盖时把旧行写 `valid_to = now()`、`superseded_by = 新行 id`，检索永远只查 `valid_to IS NULL`。
> **关键：软失效而不是硬删**，因为销售场景要能回溯「客户上次说喜欢什么、什么时候改口的」。

**Q2：「既然 Mem0 现成，为什么不用？」**

> 三个理由：① 客户资料和企业知识是内网资产，云版数据出境过不了合规；② 我的记忆要和 `customers`、`orders`、`listings` 做 JOIN，Mem0 只有 `user_id` 这个维度，跨表关系还得我自己补，用它就只剩一个向量库的价值；③ 300 人每天大量 add，每次 add 都是 LLM 调用，成本不可控。
> 如果场景是纯 C 端个人助手、没有 JOIN、也没有合规压力——我会直接用 Mem0，不该重复造轮子。

**Q3：「你怎么证明你自建的比 Mem0 好？/ 怎么证明这套有效？」**

> 不证明「更好」，证明「够用 + 可回归」。做一个 20～50 组对话的评测集，每组标注「这段对话后，理想状态下应该得到哪几条记忆」，跑指标：
> - **抽取 recall**：该记的记没记到
> - **抽取 precision**：有没有记废信息
> - **冲突正确率**：该覆盖的覆盖了吗，该并存的并存了吗
> - **检索命中率@5**：问「客户预算多少」，答案在 top5 里的比例
> Mem0 当基线，我自建的每一版都跑同一套集，掉点就不发。

### 6.3 别踩的坑

- 别说「Mem0 就是向量数据库」——它是**记忆管理层**，向量库只是它的一个组件。
- 别说「update 就是新增一条」——云版是 `PUT /v1/memories/{id}/` 原地改，旧值只在 history 里。
- 别把 `run_id` 说成 user 级——它是会话级的，`user_id + run_id` 才是「这次聊什么」。

---

## 七、如果一定要给一句总结

> **Mem0 卖的是「记忆策略」，不是「存储」；自建卖的是「可控性」，不是「省钱」。**
> 有合规 + 关系查询 + 成本约束的企业内网场景，用 psql 做权威存储、向量只做索引，Mem0 拿来当基线跑评测；反过来，纯 C 端个人助手、没有这些约束，直接上 Mem0，别重复造轮子。

---

## 附：本篇涉及的本仓库代码

- [mem0-test.mjs](file:///e:\WROKSPACE\ai\agent\mem0\mem0-test\src\mem0-test.mjs)：add / search / getAll / get / update / history 全链路实例
- [mem0-scoped-memory-test.mjs](file:///e:\WROKSPACE\ai\agent\mem0\mem0-test\src\mem0-scoped-memory-test.mjs)：user / session / agent 三种作用域写入
- [readme.md](file:///e:\WROKSPACE\ai\agent\mem0\readme.md)：三路召回与三种记忆的速记
- [agent-with-redis-memory.mjs](file:///e:\WROKSPACE\ai\agent\memory_readis\redis-test\src\agent-with-redis-memory.mjs)：会话内摘要压缩（长期记忆的上一层）
