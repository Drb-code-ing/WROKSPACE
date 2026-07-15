# 从入门到生产：RAG 检索增强生成的完整工程链路与面试通关指南

## 引言

v038 做了 RAG 的入门——什么叫幻觉，为什么要做检索增强，向量怎么表达语义，Document 怎么构建。如果你现在去面试，面试官问"你了解 RAG 吗"，你能说出那三个字母代表什么、大概流程是怎样。

但面试官不会只问这些。

他会追问：

> "retriever 和直接调向量数据库有什么区别？"
>
> "相似度 0.85 和 0.45，你怎么判断哪个能用？"
>
> "top_k 选 3 还是 10？依据是什么？"
>
> "metadata 在 RAG 里是干什么的？它为什么不做向量化？"
>
> "生产环境你选什么向量数据库？为什么？"

这些问题背后考察的不是"你知道 RAG 是什么"，而是**你有没有真正跑通一条完整的 RAG 链路，理解每个环节的工程决策依据**。

第三十六天（上）的学习核心，就是从"能跑的 RAG Demo"升级到"可解释、可调优的 RAG 系统"。代码不多——156 行——但它跑通了一条完整的链路：文档构建 → 向量化 → 存入向量数据库 → 构建检索器 → 相似度查询 → 上下文组装 → LLM 生成。每一步都有明确的输入输出和可观测的中间结果。

本文不重复 v038 的基础概念。我们直接进入工程层面：检索器底层在做什么、相似度分数怎么用、metadata 怎么设计、生产环境怎么选型、面试题怎么答。

## 一、RAG 全链路解剖：从文本到回答的 7 个工程步骤

v038 的代码止步于构建 `documents` 数组并配置好 embedding 模型——那是 RAG 的"准备阶段"。v040 的代码跑通了"运行阶段"。把整个过程展开，完整的 RAG 管路包含 7 个步骤：

```
[步骤1] 文档构建     → documents 数组，每项含 pageContent + metadata
[步骤2] 向量化       → embedding 模型把 pageContent 转为高维向量
[步骤3] 向量存储     → MemoryVectorStore.fromDocuments() 写入内存
[步骤4] 检索器构建   → vectorStore.asRetriever({ k: 3 }) 封装检索入口
[步骤5] 相似度查询   → retriever.invoke(question) 返回 top_k 文档
[步骤6] 上下文组装   → 拼接检索结果 + 问题 → 增强 Prompt
[步骤7] LLM 生成     → model.invoke(prompt) 基于增强上下文生成回答
```

### 1.1 每一步的输入输出与关键决策

| 步骤 | 输入 | 输出 | 关键决策点 |
|------|------|------|-----------|
| 文档构建 | 原始文本 | `Document[]` | chunk 大小、metadata schema |
| 向量化 | pageContent 文本 | 高维向量（如 1024 维） | 嵌入模型选择、维度与成本 |
| 向量存储 | 向量 + Document | 可查询的向量索引 | 内存 vs 持久化、索引算法 |
| 检索器构建 | vectorStore | Retriever 实例 | k 值、检索策略、过滤条件 |
| 相似度查询 | 用户问题 | top_k 文档 + 分数 | 分数阈值、去重逻辑 |
| 上下文组装 | 检索结果 + 问题 | 增强 Prompt | token 预算、片段排序 |
| LLM 生成 | 增强 Prompt | 最终回答 | 模型选择、temperature |

**工程直觉**：这 7 步中，1-4 是"写时链路"（知识入库），5-7 是"读时链路"（用户查询）。大多数 RAG 教程只讲读时链路，但**写时链路的决策（chunk 怎么切、metadata 怎么设计、嵌入模型用哪个）直接决定了读时链路的质量上限**。

### 1.2 代码全景：一条跑通的 RAG 链路

```javascript
// ===== 写时链路 =====
// 步骤1: 文档构建
const documents = [
  new Document({
    pageContent: `光光是一个活泼开朗的小男孩……`,
    metadata: { chapter: 1, character: "光光", type: "角色介绍", mood: "活泼" },
  }),
  // ... 共 7 个带 metadata 的 Document
]

// 步骤2+3: 向量化 + 存入内存向量数据库（一步完成）
const vectorStore = await MemoryVectorStore.fromDocuments(documents, embedding)

// 步骤4: 构建检索器
const retriever = vectorStore.asRetriever({ k: 3 })

// ===== 读时链路 =====
// 步骤5: 相似度查询
const docs = await retriever.invoke("光光和东东是怎么成为朋友的？")

// 额外：带分数的原始向量查询
const scoredResults = await vectorStore.similaritySearchWithScore(question, 3)

// 步骤6: 上下文组装
const context = docs
  .map((doc, i) => `[片段${i}]\n ${doc.pageContent}`)
  .join("\n\n-----\n\n")

const prompt = `你是一个讲友情故事的老师。基于以下故事片段回答问题，用温暖生动的语言。如果故事中没有提到，就说"这个故事里还没有提到这个细节"。

故事片段:
${context}

问题：${question}

老师的回答:`

// 步骤7: LLM 生成
const response = await model.invoke(prompt)
```

这套代码跑通后，控制台会打印出每一步的中间结果——检索到的文档、相似度分数、以及最终的生成回答。这种**全链路可观测**的设计，是 Demo 和生产系统共享的最佳实践。

## 二、检索器的工程真相：Retriever 不只是查向量

这是本次学习中最核心的工程认知升级，也是最容易被面试官追着问的点。

### 2.1 两种检索方式的本质区别

代码中同时出现了两种检索方式：

```javascript
// 方式一：Retriever
const docs = await retriever.invoke(question)

// 方式二：原始向量查询
const scoredResults = await vectorStore.similaritySearchWithScore(question, 3)
```

它们不是同一个东西。区别在于：

| 维度 | `retriever.invoke()` | `similaritySearchWithScore()` |
|------|---------------------|------------------------------|
| **返回内容** | Document 数组 | `[Document, score]` 元组数组 |
| **处理逻辑** | 向量查询 + 去重 + 过滤 + rerank | 仅做向量相似度计算 |
| **可配置性** | 支持 k、filter、searchType 等 | 通常只有 k 和 filter |
| **在 LangChain 中的角色** | 标准检索入口，可接入 Chain | 底层 API，直接操作 VectorStore |
| **适用场景** | 生产环境的标准检索流程 | debug、调参、需要 score 做决策 |

### 2.2 检索器在相似度查询基础上多做了什么

```javascript
// retriever.invoke() 的内部逻辑（伪代码）
async invoke(query) {
  // 1. 将 query 转为向量
  const queryVector = await this.embeddings.embedQuery(query)

  // 2. 在向量数据库中进行相似度搜索
  let results = await this.vectorStore.similaritySearchVectorWithScore(
    queryVector, this.k * 2  // 通常会多取一些做候选
  )

  // 3. 去重：相同内容的文档只保留一条
  results = this.deduplicate(results)

  // 4. 过滤：根据 metadata 条件筛掉不符合的
  if (this.filter) {
    results = results.filter(r => matchFilter(r.metadata, this.filter))
  }

  // 5. 重排序（如果有 reranker）
  if (this.reranker) {
    results = await this.reranker.rerank(query, results)
  }

  // 6. 截取 top_k
  return results.slice(0, this.k).map(r => r.document)
}
```

**关键认知**：`similaritySearchWithScore` 是检索器的底层实现，但不是检索器的全部。Retriever 在向量相似度的基础上叠加了**去重、过滤和重排序**三层后处理——这些才是决定最终检索质量的工程手段。

### 2.3 面试场景：为什么这个区别重要

如果面试官问"你怎么保证 RAG 检索质量"，你可以从这两个 API 的区别切入：

1. **你不会只依赖原始向量相似度**——向量搜索找到的是"向量空间中最近的"，但不一定是"最相关的"。两条内容几乎相同的文档可能都排在前面，浪费 top_k 名额
2. **去重是第一道防线**——对于从同一个长文档切出来的多个 chunk，去重避免重复信息占据上下文窗口
3. **rerank 是第二道防线**——用更强的交叉编码器（cross-encoder）对候选集合重新打分，把真正相关的提到前面
4. **分数是你做决策的依据**——`similaritySearchWithScore` 提供的 score 让你能设定阈值，低于某个分的直接丢弃，从源头减少无关信息注入

> **面试答题框架**：先讲清楚两者的区别（一个加了后处理，一个是裸查），再展开说每种后处理解决了什么问题，最后落到"检索质量不是向量查得准，而是后处理做得全"。

## 三、相似度评分体系：从数字到决策

v038 讲到了余弦相似度的概念。v040 要回答的问题是：**你拿到一个 0.87 的相似度分数，然后呢？**

### 3.1 距离与相似度的换算

代码中打印了两个值：

```javascript
const score = scoredResult[1]  // 原始距离分（越小越相似）
const similarity = (1 - score).toFixed(4)  // 转换为相似度（越大越相似）
```

理解这个转换的物理含义：

| 原始分（score/distance） | 相似度（1 - score） | 含义 |
|--------------------------|---------------------|------|
| 0.0 ~ 0.2 | 0.8 ~ 1.0 | 高度相关，语义几乎相同 |
| 0.2 ~ 0.4 | 0.6 ~ 0.8 | 中等相关，话题相近 |
| 0.4 ~ 0.6 | 0.4 ~ 0.6 | 弱相关，可能有关联 |
| 0.6+ | 0.4 以下 | 基本不相关，不应放入上下文 |

**但注意**：这个换算只在余弦距离（范围 [0, 2]）下有意义。欧氏距离的范围是 [0, ∞)，不存在这个简单的线性换算。要在代码中查看嵌入模型和向量数据库使用的是哪种距离度量。

### 3.2 生产环境中的分数阈值策略

Demo 中的分数只是打印出来看一眼。生产环境中，分数是决策信号：

```javascript
// 阈值策略伪代码
function filterByThreshold(scoredResults, options = {}) {
  const { minSimilarity = 0.6, maxResults = 5, fallback = 'no_results' } = options

  // 第一轮过滤：只保留高于阈值的
  const qualified = scoredResults.filter(
    ([doc, score]) => (1 - score) >= minSimilarity
  )

  if (qualified.length === 0) {
    // 策略1：降低阈值重试
    // 策略2：返回"未找到相关信息"
    // 策略3：用原始问题直接问模型（退化为无 RAG 模式）
    return { results: [], strategy: fallback }
  }

  return { results: qualified.slice(0, maxResults), strategy: 'normal' }
}
```

**三个核心决策**：

1. **阈值设多少**——没有通用答案，取决于你的嵌入模型、文档类型和业务容忍度。需要通过标注数据做评估（MRR、NDCG、Hit Rate）
2. **所有结果都低于阈值怎么办**——三种策略：降阈值重试、退化为无 RAG 直接生成、告诉用户"我找不到相关信息"
3. **分数差距很小的结果**（如 0.82 vs 0.81 vs 0.80）怎么处理——全保留，分数相近说明它们与问题的相关性几乎一致，丢哪个都不对

### 3.3 余弦距离 vs 欧氏距离 vs 点积

不同的向量数据库默认使用不同的距离度量。理解它们的适用场景：

| 距离度量 | 公式（简化） | 特点 | 适用场景 |
|----------|-------------|------|----------|
| **余弦相似度** | cos(θ) = (A·B)/(‖A‖‖B‖) | 只关心方向，不关心长度 | 文本语义搜索（最常用） |
| **欧氏距离** | √(Σ(Ai-Bi)²) | 关心绝对距离 | 图像相似度、坐标距离 |
| **点积** | A·B | 方向 + 长度都有影响 | 已归一化向量的快速计算 |

对于文本嵌入，余弦相似度是事实标准——因为两个意思相近但长度不同的句子（如"我喜欢猫"和"我非常喜欢猫"），它们在向量空间中的方向应该接近，但长度可能不同。余弦相似度对长度不敏感，正好满足需求。

## 四、Metadata 工程：检索质量的第二引擎

v038 提到"metadata 不参与向量化计算"。v040 要回答的是：**那不参与向量化，它到底有什么用？**

### 4.1 不参与向量化，但参与检索

代码中的 metadata 设计：

```javascript
metadata: {
  chapter: 1,        // 位置维度：第几章
  character: "光光",  // 人物维度：谁的故事
  type: "角色介绍",    // 类型维度：什么性质的内容
  mood: "活泼"        // 情绪维度：什么情感基调
}
```

metadata 不影响向量相似度计算（它不会被送入 embedding 模型），但它在检索流程中的作用体现在三个阶段：

```
          向量检索阶段             后处理阶段              生成阶段
              │                      │                     │
  metadata: ──┼── 不可用 ────────────┼── 过滤、排序 ────────┼── 溯源、引用
              │                      │                     │
  pageContent: 向量化 → 相似度计算    │                     │  拼入 Prompt
```

### 4.2 Metadata 的三大工程用途

**用途一：元数据过滤（Pre-retrieval / Post-retrieval Filter）**

```javascript
// 在构建检索器时设定过滤条件
const retriever = vectorStore.asRetriever({
  k: 3,
  filter: { type: "友情情节" }  // 只在友情情节类型的文档中搜索
})

// 或者用 metadata 做后过滤
const docs = await retriever.invoke(question)
const happyOnes = docs.filter(doc => doc.metadata.mood === "欢乐")
```

这在企业 RAG 场景中极为常见：用户只搜"2024 年的财务报告"，你就在 metadata 里设 `filter: { year: 2024, category: "财务" }`，从源头缩小搜索空间。

**用途二：结果排序与多样性控制**

```javascript
// 优先返回靠前章节的内容，同时保证人物多样性
function rerankByMetadata(docs) {
  // 第一步：按章节排序
  const sorted = docs.sort((a, b) => a.metadata.chapter - b.metadata.chapter)
  // 第二步：去重同一个人物的结果（保留分数最高的）
  const seen = new Set()
  return sorted.filter(doc => {
    if (seen.has(doc.metadata.character)) return false
    seen.add(doc.metadata.character)
    return true
  })
}
```

**用途三：来源溯源与引用展示**

```javascript
// 在 Prompt 中展示来源信息
const context = docs.map((doc, i) =>
  `[来源 ${i + 1}] 章节${doc.metadata.chapter}，角色：${doc.metadata.character}
   ${doc.pageContent}`
).join("\n\n")
```

对于企业级 RAG 应用，**可溯源性不仅是加分项，很可能是合规要求**。用户需要知道你给的答案来自哪份文档、哪个章节、哪个版本。

### 4.3 Metadata Schema 设计方法论

真实业务的 metadata 怎么设计？三个原则：

```
原则1: 基于用户的检索意图设计维度
  → 用户会按时间搜吗？→ 加 date / year
  → 用户会按类型搜吗？→ 加 category / type
  → 用户会按作者/部门搜吗？→ 加 author / department

原则2: 基于召回后的处理逻辑设计维度
  → 需要按时间排序吗？→ 加 timestamp
  → 需要按重要性加权吗？→ 加 priority / weight
  → 需要展示引用格式吗？→ 加 title / url / page

原则3: 克制——不是字段越多越好
  → 每个字段都要有明确的使用场景
  → 能通过 pageContent 推断的就不放 metadata
  → metadata 膨胀会增加存储和维护成本
```

## 五、上下文窗口管理：增强（Augmented）阶段的工程权衡

检索到文档只是手段，把文档放进 Prompt 才是目的。这一步叫 **Augmented（增强）**，是整个 RAG 管路中最容易被低估的环节。

### 5.1 top_k 不是越大越好

```javascript
const retriever = vectorStore.asRetriever({ k: 3 })
```

为什么是 3 不是 10？

| k 值 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| 1-3 | 上下文精准，不浪费 token | 可能遗漏相关信息 | 短文档、高精度需求 |
| 4-7 | 覆盖面与精度的平衡 | 可能引入部分噪音 | 通用场景 |
| 8-15 | 覆盖面广 | 噪音多，token 消耗大，模型可能被不相关信息干扰 | 探索性查询、长文档 |

**决定 k 值的不是"我想找几条"，而是"模型的上下文窗口还剩多少"和"每条文档的平均长度"**。

计算公式：
```
max_k ≈ (context_window - prompt_template_tokens - question_tokens - expected_answer_tokens) / avg_chunk_tokens
```

例如 DeepSeek-v4 的上下文窗口是 128K token，你的 Prompt 模板占 200 token，问题占 50 token，预期回答 500 token，每条 chunk 平均 200 token，那理论上可以塞 `(128000 - 200 - 50 - 500) / 200 ≈ 636` 条 chunk——但实际上你不会塞这么多，因为**检索质量随 k 增大而下降**（低相关性的文档被引入），而且**推理成本也随上下文长度增加**。

### 5.2 Prompt 模板设计模式

代码中的 Prompt 模板是一个很好的范例，拆解它的结构：

```javascript
const prompt = `你是一个讲友情故事的老师。              ← [角色设定] 定义回答者身份和风格
基于以下故事片段回答问题，用温暖生动的语言。          ← [行为约束] 定义输出要求
如果故事中没有提到，就说"这个故事里还没有提到这个细节"。 ← [安全边界] 防幻觉的最后一道防线

故事片段:                                             ← [上下文分隔符]
${context}                                            ← [检索结果] 这部分的格式决定检索信息的可用性

问题：${question}                                     ← [用户输入] 保持原样传递

老师的回答:                                           ← [输出引导] 帮助模型进入角色状态
`
```

这种模板设计的几个工程原则：

1. **角色设定在前，上下文在中，问题在后**——模型对越靠近末尾的内容越关注，所以问题放最后
2. **明确的安全边界**——"如果没提到就说没提到"是防幻觉的最简单有效的手段。不要让模型在信息不足时自由发挥
3. **上下文要格式化**——`[片段0]\n ... \n-----\n [片段1]` 的结构让模型能区分不同来源片段，减少混淆
4. **输出引导**——最后的"老师的回答:"引导模型直接进入回答状态，减少不必要的"好的，让我来……"前缀

### 5.3 Token 预算的分配策略

上下文窗口是有限的。你在 Prompt 里放的检索结果越多，留给模型生成回答的空间就越少。需要在"检索覆盖"和"回答空间"之间做权衡：

```
上下文窗口预算分配（典型比例）:

┌─────────────────────────────────────────────────┐
│  System Prompt (5%)  │  角色、规则、安全约束     │
├─────────────────────────────────────────────────┤
│  检索结果 (60-70%)   │  top_k 文档片段           │
├─────────────────────────────────────────────────┤
│  对话历史 (10-15%)   │  多轮对话的上下文          │
├─────────────────────────────────────────────────┤
│  用户问题 (2-5%)     │  当前问题                 │
├─────────────────────────────────────────────────┤
│  生成回答 (10-15%)   │  模型输出空间              │
└─────────────────────────────────────────────────┘
```

**生产环境建议**：总 Prompt 的 token 数不要超过上下文窗口的 75%。留 25% 给模型生成空间，同时避免边界情况下的截断。

## 六、生产级 RAG 架构选型

第三十六天的 Demo 用了 `MemoryVectorStore`——数据存在内存里，进程重启就没了。这是学习用的，生产环境不行。

### 6.1 内存向量存储 vs 持久化向量数据库

| 维度 | MemoryVectorStore | 持久化向量数据库 |
|------|-------------------|-----------------|
| **数据持久性** | 进程销毁即丢失 | 磁盘持久化，重启不丢 |
| **数据规模** | 受内存限制（几万条） | 百万到亿级 |
| **检索性能** | 暴力搜索 O(n) | ANN 近似搜索 O(log n) |
| **并发能力** | 单进程 | 支持多客户端并发 |
| **运维成本** | 零 | 需要部署和维护 |
| **适用场景** | 开发调试、单元测试、Demo | 生产环境 |

**Demo 中 MemoryVectorStore 的价值**：它让你在 5 分钟内跑通整个 RAG 链路，不需要安装 Docker、不需要配置数据库。这种"先跑通再升级"的路径是工程学习的正确姿势。

### 6.2 主流向量数据库横向对比

| 向量数据库 | 类型 | 优势 | 劣势 | 适用团队 |
|-----------|------|------|------|---------|
| **Chroma** | 嵌入式 | 零配置，Python 友好，适合原型 | 生产级功能有限 | 小团队快速验证 |
| **Qdrant** | 独立服务 | Rust 编写，性能好，过滤强 | 需要独立部署 | 中大型团队 |
| **Milvus** | 分布式 | 十亿级规模，云原生 | 架构重，运维复杂 | 大厂/大规模场景 |
| **Weaviate** | 独立服务 | GraphQL 接口，内置模块 | 资源消耗较大 | 需要多模态的团队 |
| **Pinecone** | SaaS | 零运维，自动扩缩 | 贵，数据出国 | 不想管基础设施的团队 |
| **pgvector** | PostgreSQL 扩展 | 和业务库统一，SQL 即可查 | 大规模性能不如专用 DB | 已有 PG 的团队 |
| **Elasticsearch** | 搜索引擎 + 向量 | 关键词+向量混合搜索 | 向量不是原生能力 | 已有 ES 的团队 |

**选型决策树**：

```
你已经有 PostgreSQL 了？ → pgvector，零额外运维
你需要混合搜索（关键词+向量）？ → Elasticsearch / Weaviate
你是小团队在做原型？ → Chroma / Qdrant
你要处理亿级向量？ → Milvus
你完全不想管运维？ → Pinecone（预算够的话）
```

### 6.3 嵌入模型选型

| 嵌入模型 | 维度 | 语言支持 | 特点 |
|---------|------|---------|------|
| text-embedding-v4 (Qwen) | 1024 | 中英 | 中文效果好，性价比高 |
| text-embedding-3-small (OpenAI) | 512/1536 | 多语言 | 可调维度，省存储 |
| text-embedding-3-large (OpenAI) | 256/1024/3072 | 多语言 | 质量最好，贵 |
| bge-large-zh (BAAI) | 1024 | 中文 | 开源，可本地部署 |
| m3e-base | 768 | 中文 | 轻量，适合小团队 |

**选型要点**：
- 维度越高，表达能力越强，但存储和计算成本也越高
- 如果数据不出境是硬需求，选开源的 bge 或 m3e 本地部署
- Demo 中用的 text-embedding-v4 是当前中文场景的均衡选择

### 6.4 嵌入模型的成本与缓存策略

每次调用 embedding API 都要钱（或者消耗 GPU 算力）。在读时链路中，用户的问题是每次不同的，必须实时向量化。但写时链路中：

- **文档向量化只做一次**——文档入库时做好向量化，之后就存着了
- **文档更新时重新向量化**——只重做变更的部分
- **高频查询的向量可以缓存**——如果用户问题重复率高，可以在应用层做一层查询缓存

```javascript
// 简单的查询缓存策略
const queryCache = new Map() // 生产环境用 Redis

async function getCachedEmbedding(query) {
  if (queryCache.has(query)) return queryCache.get(query)
  const vector = await embedding.embedQuery(query)
  queryCache.set(query, vector)
  return vector
}
```

## 七、高级 RAG 模式概览

如果你在面试中说"我了解 RAG"，面试官可能会追问："你知道哪些高级 RAG 模式？" 这一节给你储备几个能在面试中展开讲的方向。

### 7.1 HyDE（Hypothetical Document Embeddings）

**核心思想**：用用户问题生成一个"假设性回答"，再用这个假设性回答去做向量检索。

```
传统 RAG：用户问题 → 向量化 → 检索
HyDE：   用户问题 → LLM 生成假设回答 → 向量化假设回答 → 检索
```

**为什么有效**：用户问题通常是简短的问句（"怎么处理内存泄漏？"），而知识库里的文档是陈述性的长文本（"内存泄漏的常见原因包括……"）。问句和陈述句在向量空间中可能距离较远，尽管它们在语义上是匹配的。HyDE 先让 LLM 把问句"翻译"成陈述，再拿陈述去检索——**用生成弥合了问题和文档之间的语言风格鸿沟**。

**代价**：多一次 LLM 调用（生成假设回答），延迟增加。

### 7.2 Multi-hop Retrieval（多跳检索）

**核心思想**：有些问题不能通过一次检索回答，需要先检索 A，根据 A 的信息再检索 B。

```
用户："光光最好的朋友后来成为了什么？"

第一跳：检索"光光最好的朋友是谁？" → 找到"东东是光光最好的朋友"
第二跳：检索"东东后来成为了什么？" → 找到"东东成为了一名优秀的插画师"
最终回答：东东成为了一名优秀的插画师
```

**实现方式**：可以显式地把多跳检索编入 Agent 的 ReAct Loop 中，每次检索的结果作为下一次检索的输入。

### 7.3 Self-Querying Retrieval（自查询检索）

**核心思想**：让 LLM 从用户的自然语言问题中提取结构化查询条件，然后同时做向量搜索和 metadata 过滤。

```
用户："光光在前几章里是什么性格？"

LLM 解析为：
{
  query: "光光的性格",
  filter: { character: "光光", chapter: { $lte: 3 } }  // 自动识别"前几章"
}

然后用 query 做向量搜索，filter 做 metadata 过滤
```

LangChain 提供了 `SelfQueryRetriever` 可以直接使用。这是 metadata 工程价值的最高体现。

### 7.4 Parent Document Retrieval（父文档检索）

**核心思想**：检索时用小粒度 chunk（提高检索精度），但返回给 LLM 时用大粒度 parent document（保留完整上下文）。

```
入库时：
  大文档 → 切成大块（parent）和 小块（child）
  小块做向量化用于检索
  大块保留完整上下文用于生成

检索时：
  用 query 检索到相关的小块
  返回小块对应的父文档（更大范围的上下文）
  LLM 获得更完整的上下文
```

这解决了 RAG 的核心矛盾：**chunk 太小则上下文不完整，chunk 太大则检索精度下降**。Parent Document Retrieval 让你两全其美。

### 7.5 RAG-Fusion（多查询融合）

**核心思想**：用 LLM 把用户的原始问题改写成多个角度不同的查询，分别检索，然后用倒数排名融合（Reciprocal Rank Fusion）合并结果。

```
用户问题："光光和东东的友谊是怎么发展的？"

LLM 改写：
  查询1："光光和东东从认识到成为朋友的过程"
  查询2："光光如何帮助东东 东东如何回报光光"
  查询3："光光和东东的友谊经历了哪些重要事件"

三次检索 → RRF 合并排序 → 去重 → 返回综合结果
```

这解决了单一查询可能因为措辞不佳而漏掉相关文档的问题。

### 7.6 高级模式速查表

| 模式 | 解决什么问题 | 额外成本 | 成熟度 |
|------|------------|---------|--------|
| HyDE | 问句与文档的语言风格差异 | 多一次 LLM 调用 | 成熟 |
| Multi-hop | 需要多步推理的问题 | 多次检索 + Agent 编排 | 成熟 |
| Self-Querying | 结构化条件 + 语义搜索 | 多一次 LLM 调用做查询转换 | 成熟 |
| Parent Document | chunk 大小难以平衡 | 双倍存储 | 成熟 |
| RAG-Fusion | 单一查询可能漏召回 | N 次检索 + LLM 改写 | 较新 |
| Corrective RAG | 检索结果质量不可靠 | 多一次评估 LLM 调用 | 较新 |
| Graph RAG | 实体关系复杂的问题 | 需要构建知识图谱 | 前沿 |

**面试中的用法**：不需要每个都深讲，选 2-3 个理解最深的展开。推荐组合：HyDE + Self-Querying + Parent Document Retrieval——覆盖了查询优化、结构化过滤和文档切分三个维度。

## 八、RAG 面试题库与答题框架

### 基础层

**Q1: 用你自己的话解释 RAG 的工作流程。**

面试官意图：考察你是否真正理解 RAG 的端到端流程，而不是背定义。

答题框架：
1. 先说清 RAG 要解决的核心问题（LLM 的知识盲区 + 幻觉）
2. 用 7 步链路展开（文档→向量化→存储→检索→查询→组装→生成）
3. 强调两个关键区分：写时链路 vs 读时链路

**Q2: 向量搜索和关键词搜索有什么区别？什么时候用哪个？**

面试官意图：考察你对检索技术的理解深度。

答题框架：
1. 关键词是字符串匹配，向量是语义匹配
2. 举例说明两者的差异（"能吃"vs"可食用"）
3. 生产环境的最佳实践：混合搜索（关键词 + 向量），Elasticsearch 的 hybrid search 或 Weaviate 的 hybrid 模式
4. 关键词搜索在精确匹配场景（如产品编码、人名）仍有不可替代的优势

### 进阶检索层

**Q3: retriever 和 vectorStore 的 similaritySearch 有什么区别？**

面试官意图：考察你是否真正用过 RAG 框架，是否理解抽象层。

答题框架：
1. retriever 是 LangChain 的标准检索抽象，在向量搜索基础上叠加了去重、过滤、rerank
2. similaritySearch 是底层 API，只做向量相似度计算
3. 生产环境中你用 retriever 做标准检索，用 similaritySearch 做 debug 和调参（需要看 score）

**Q4: 怎么判断一个检索结果好不好？怎么评估 RAG 系统的检索质量？**

面试官意图：考察你是否有评估意识，是否了解检索领域的评价指标。

答题框架：
1. 离线评估：MRR（平均倒数排名）、NDCG（归一化折损累积增益）、Hit Rate（命中率）、Recall@K
2. 在线评估：用户反馈（点赞/踩）、回答是否被采纳、后续是否追问
3. 需要一个标注好的测试集（query → relevant_docs）
4. 用 RAGAS（RAG Assessment）框架做自动化评估：faithfulness、answer relevancy、context precision、context recall

**Q5: 相似度分数 0.6 和 0.9，你用哪个作为阈值？怎么确定阈值？**

面试官意图：考察你是否理解分数在工程决策中的作用。

答题框架：
1. 没有通用答案，取决于嵌入模型、文档类型和业务容忍度
2. 确定阈值的方法：在标注测试集上画 Precision-Recall 曲线，选 F1 最高的点
3. 低于阈值的结果处理策略：降阈值重试、退化为无 RAG、告知用户信息不足

### 架构选型层

**Q6: 生产环境你选什么向量数据库？为什么？**

面试官意图：考察你是否了解主流向量数据库的差异和适用场景。

答题框架：见第六节的选型决策树——先看你已有的基础设施，再看规模需求，最后考虑运维成本。

**Q7: 嵌入模型怎么选？维度是越高越好吗？**

面试官意图：考察你是否理解嵌入模型的 trade-off。

答题框架：
1. 维度越高，理论表达能力越强，但存储和检索成本也越高
2. MTEB 榜单（Massive Text Embedding Benchmark）是权威参考
3. 必须在你的数据集上做评估，benchmark 好不代表你的场景好
4. 开源 vs API 的考量：数据安全、成本、定制能力

### 系统设计层

**Q8: 设计一个企业内部的 RAG 知识库问答系统。**

面试官意图：考察你的系统设计能力和工程全局观。

答题框架：
```
1. 文档处理管道
   - 多种格式解析（PDF、Word、Markdown、Confluence）
   - Chunking 策略（按标题层级 + 滑动窗口）
   - Metadata 提取（自动识别日期、作者、部门）

2. 向量化与存储
   - 选择嵌入模型（中文场景选 bge-large-zh 或 text-embedding-v4）
   - 向量数据库（已有 PG 就用 pgvector，否则选 Qdrant）
   - 增量更新机制（文档变更后重新向量化）

3. 检索管道
   - Self-Querying（用户可能会说"去年的财务报告"）
   - 混合搜索（关键词 + 向量）
   - Reranker（cross-encoder 做精排）

4. 生成管道
   - Prompt 模板（引用来源、安全边界）
   - 流式输出（TTFT 体验）
   - 引用溯源（每个回答附上来源链接）

5. 评估与监控
   - RAGAS 离线评估
   - 用户反馈在线评估（点赞/踩）
   - 检索质量监控（平均分数分布、空结果率）

6. 安全与合规
   - 文档权限控制（用户只能搜自己有权限的文档）
   - 敏感信息过滤
   - 审计日志
```

**Q9: RAG 系统最常见的三个问题是什么？怎么解决？**

答题框架：

1. **检索不相关**（retrieved docs 和问题无关）
   - 原因：chunk 太大或太小、嵌入模型不合适、query 和 doc 语言风格差异大
   - 解决：调 chunk 大小、换嵌入模型、用 HyDE、加 reranker

2. **回答不忠实**（answer 和检索到的文档内容不一致，模型自己编了）
   - 原因：Prompt 没有约束好、检索结果质量差导致模型"不信任"检索结果
   - 解决：加强 Prompt 约束（"只能基于提供的资料回答"）、提高检索质量、用 RAGAS faithfulness 指标监控

3. **关键信息被漏掉**（知识库里有答案但没检索到）
   - 原因：top_k 太小、query 措辞不佳、chunk 切断了关键信息
   - 解决：增大 top_k、用 RAG-Fusion 做多查询融合、优化 chunk 策略

### 开放层

**Q10: RAG 和长上下文模型（如 1M token 上下文窗口）的关系是什么？长上下文模型会取代 RAG 吗？**

面试官意图：考察你对技术趋势的思考深度。

答题框架：
1. 长上下文和 RAG 不是替代关系，是互补关系
2. 长上下文的局限：延迟（越长的上下文推理越慢）、成本（按 token 计费）、注意力稀释（模型在长上下文中容易忽略中间部分的信息——Lost in the Middle 现象）
3. RAG 的优势：精准检索、低成本、可解释性强（知道答案来自哪份文档）
4. 未来趋势：Long-Context RAG——用大上下文窗口容纳更多检索结果，但检索本身仍是必要的
5. 结论：**检索是信息过滤，上下文窗口是信息承载——两者解决的是不同层面的问题**

## 结语

第三十六天（上）的代码只有 156 行，但它跑通的是一整套 RAG 工程管路的骨架。从 v038 到 v040 的递进，本质上是两个问题层次的升级：

**v038 回答的是"RAG 是什么"**：
- 幻觉是信息检索问题不是模型缺陷
- 向量语义搜索优于关键词匹配
- Document + metadata 是知识单元

**v040 回答的是"RAG 怎么做对"**：
- 检索器不是查向量，是查向量 + 去重 + 过滤 + rerank
- 相似度分数不是数字，是决策信号——低于阈值的要敢于丢弃
- metadata 不是附注，是检索质量的第二引擎——它决定你能不能用正确的姿势过滤和排序
- top_k 不是拍脑袋，是 token 预算管理——留给检索的多了，留给生成的就少了
- 生产级选型不是挑最好的，是挑最适合现有基础设施的

这七步链路（文档→向量化→存储→检索器→相似度→组装→生成），每一步都有工程决策要做。面试官从任何一个点切入都能问出 10 分钟来。但如果你能把这七步串起来讲，用一套完整的故事线串联——从一条用户问题进入系统，到一段有据可查的回答返回用户——你就不是在背八股文，而是在描述你亲手搭建的系统。

RAG 不是"查一下然后问模型"。**RAG 是一个以检索质量为核心的工程系统，检索的上限决定了生成的上限。**

下一篇文章（第三十六天 下）将进入 Agent 的实战搭建，把 RAG 的检索能力和 Agent 的工具调用能力结合起来——那才是 AI 应用真正开始"像人一样工作"的时刻。

---

*本篇内容基于第三十六天（上）学习笔记与代码实践整理，作为 v038 RAG 入门篇的进阶深化，聚焦生产级 RAG 系统的工程链路、关键决策与面试通关策略。*

*封面图建议：七步 RAG 管路的流程图（Document → Embedding → VectorStore → Retriever → Similarity → Context → Generation），每一步标注输入输出和关键决策点。*
