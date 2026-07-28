# 从 EPUB 到 RAG 问答：文档加载、切块策略与 Milvus 向量检索全链路实战

## 引言：为什么"天龙八部"是一个好的面试案例

向量数据库和 RAG 的教程通常用几行 Demo 演示，但面试官真正想看到的是你如何把一个真实的、非结构化的文本源完整地转化为可检索、可问答的知识库。

本文以金庸长篇武侠小说《天龙八部》为语料，覆盖从 EPUB 加载、RecursiveCharacterTextSplitter 切块、Milvus collection schema 设计、IVF_FLAT 索引调优、流式批量入库，到语义检索与 LLM 生成回答的完整链路。同时记录了实际开发中踩到的坑——Collection 名称跨文件不一致导致静默空召回——以及排查与修复过程。

**阅读本文可以回答的面试题：**

- 如何为大规模文档设计向量入库的流式处理流程？
- RecursiveCharacterTextSplitter 的分隔符优先级和参数如何影响召回？
- 复合主键（`bookId_chapterNum_chunkIndex`）相比自增 ID 有什么优势？
- IVF_FLAT 的 `nlist` 在实际项目中设多少？为什么？
- 写入和检索跨文件协作时，Collection 名称不一致会带来什么后果？

---

## 一、Day 47 学习内容全景

三个提交组成了一次完整的 RAG 实战闭环：

```text
7059ea1  rag与向量数据库实战 天龙八部 上
  → EPUB 加载 + 切块 + collection 创建 + 索引 + 流式批量入库

58ae145  第四十七天学习 rag与向量数据库实战 下
  → 语义查询 + RAG 问答 pipeline

df83768  第四十七天学习 rag与向量数据库实战 补
  → 修复 rag.mjs 中 COLLECTION_NAME 错误（ai_dairy → ebook）
```

代码文件架构：

```text
tlbb/
├── .env                环境变量（MILVUS_ADDRESS / TOKEN / API KEY）
├── 天龙八部.epub        原始电子书
├── src/
│   ├── main.mjs        离线建库：EPUB → split → embed → insert
│   ├── query.mjs       语义检索：query 向量 → ANN search → 打印结果
│   └── rag.mjs         RAG 问答：检索 + LLM 基于证据生成回答
└── readme.md           学习笔记
```

---

## 二、离线建库：从 EPUB 到可检索向量的完整 Pipeline

### 2.1 EPubLoader：按章节加载，不要一把梭

大型文档的第一个工程决策是：**不能把所有内容一次性加载到内存**。

```javascript
import { EPubLoader } from '@langchain/community/document_loaders/fs/epub'

const loader = new EPubLoader('./天龙八部.epub', {
  splitChapters: true,  // 核心参数：按章节拆分
})
const documents = await loader.load()
// → 返回 50 个 document，每个的 pageContent 为一章正文
```

`splitChapters: true` 是流式处理的关键——它让 Loader 按章节自然边界拆分，而不是返回一个几十万字的单个 document。后续处理就可以逐章进行，处理完一章释放内存再处理下一章。

**Loader 选型对照：**

| 文档格式 | Loader | 关键参数 |
|---|---|---|
| EPUB | `EPubLoader` | `splitChapters: true` 按章节拆分 |
| PDF | `PDFLoader` | 需关注表格和排版的还原质量 |
| CSV | `CSVLoader` | 一行一记录，可指定列映射 |
| 纯文本 | `TextLoader` | 保留原始换行，适合后续按段落切分 |

### 2.2 RecursiveCharacterTextSplitter：在语义边界切分

加载后的每章文本仍有数千字，需要切为 Embedding 模型能处理的 chunk。`RecursiveCharacterTextSplitter` 是 LangChain 中的标准方案：

```javascript
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,      // 每个 chunk 最大 500 字
  chunkOverlap: 100,   // 相邻 chunk 重叠 100 字
  // separators 使用默认值：["\n\n", "\n", " ", ""]
})
```

**分隔符的递归优先级：**

```text
"\n\n"  （段落边界）     ← 第一优先级：尽量在段落间切分
  ↓ 不行就
"\n"    （行边界）       ← 第二优先级：在行之间切分
  ↓ 还不行就
" "     （词边界）       ← 第三优先级：至少不在字中间断开
  ↓ 最后手段
""      （字符边界）     ← 保底：强制按字符数切割
```

这保证了 chunk 尽量在自然语义边界结束，而非拦腰截断句子。

**chunkSize 与 chunkOverlap 的权衡：**

| 参数 | 太小的后果 | 太大的后果 |
|---|---|---|
| `chunkSize` | 语义碎片化，检索缺少上下文 | 向量语义被稀释，多个主题混杂 |
| `chunkOverlap` | 相邻 chunk 边界信息丢失 | 冗余增加，存储与计算成本上升 |

中文文本常见配置：`chunkSize: 500~1000`，`chunkOverlap: 50~150`。在《天龙八部》项目中选择 `chunkSize: 500`、`chunkOverlap: 100`——保持每 chunk 围绕一个完整段落或场景，同时 overlap 确保跨 chunk 的信息不被切断。

**面试要点：** 数值不是固定的。正确做法是通过离线评测（标注"正确答案应来自哪些段落"），用不同参数组合构建索引，比较 Recall@K，找到满足目标召回率的最小 chunkSize。

### 2.3 Milvus Collection Schema：让字段表达业务事实

电子书场景的 schema 需要承载书籍元信息与检索字段：

```javascript
import { DataType } from '@zilliz/milvus2-sdk-node'

await client.createCollection({
  collection_name: 'ebook',
  fields: [
    { name: 'id',          data_type: DataType.VarChar, max_length: 100,
      is_primary_key: true },
    { name: 'book_id',     data_type: DataType.VarChar, max_length: 100 },
    { name: 'book_name',   data_type: DataType.VarChar, max_length: 200 },
    { name: 'chapter_num', data_type: DataType.Int32 },        // 章节编号
    { name: 'index',       data_type: DataType.Int32 },        // 章节内切片序号
    { name: 'content',     data_type: DataType.VarChar, max_length: 10000 },
    { name: 'vector',      data_type: DataType.FloatVector, dim: 1024 },
  ]
})
```

关键设计决策：

- **`dim: 1024`** 必须与 Embedding 模型输出维度完全一致，不是可调的"容量参数"。切换模型后维度不同，需要新 collection 或迁移策略，不能混写。
- **`id` 使用复合主键** `bookId_chapterNum_chunkIndex`（如 `1_5_3`），而非自增 ID。
- **`chapter_num` 和 `index`** 作为独立字段存储，支持按章节范围过滤检索结果。

### 2.4 复合主键：比自增 ID 更好的选择

```javascript
const insertData = await Promise.all(
  chunks.map(async (chunk, chunkIndex) => ({
    id: `${bookId}_${chapterNum}_${chunkIndex}`,  // 如 "1_5_3"
    book_id: bookId,
    book_name: '天龙八部',
    chapter_num: chapterNum,
    index: chunkIndex,
    content: chunk,
    vector: await getEmbedding(chunk),
  }))
)
```

复合主键的四个优势：

| 特性 | 说明 |
|---|---|
| **唯一性** | 同书不同章节、同章节不同切片绝不冲突 |
| **可追溯** | 检索结果直接定位到书 → 章 → 切片位置 |
| **幂等写入** | 重跑入库任务时相同 ID 不产生重复数据 |
| **可回滚** | 可按 book_id 前缀批量删除某本书的全部切片 |

自增 ID 做不到这些——每次重新入库 ID 都会变，无法判断是否是同一份数据。

### 2.5 IVF_FLAT 索引：nlist=1024 的实践选择

建好 collection 后，必须为向量字段创建索引才能高效检索：

```javascript
await client.createIndex({
  collection_name: 'ebook',
  field_name: 'vector',
  index_type: IndexType.IVF_FLAT,
  metric_type: MetricType.COSINE,
  params: { nlist: 1024 }  // 将全量向量聚为 1024 个簇
})
```

**为什么是 IVF_FLAT 而不是 HNSW？**
- 《天龙八部》约 150 万字，切割后数千条向量，数据量适中
- IVF_FLAT 内存压力更低，对中等规模数据足够
- 通过 `nlist` 和 `nprobe` 两个参数即可完成召回/延迟权衡

**为什么 nlist=1024？**
- 经验公式：`nlist ≈ 4 × sqrt(N)`，几千条向量时约为 128~256
- 实际选择 1024 是保守的：分桶更细，在牺牲一些建索引时间的前提下，给后续通过调整 `nprobe` 留出更多优化空间
- 数据量增长后可继续调大 nlist

面试中不要死记数值，要讲出"根据数据规模和目标 Recall@K 选择 nlist，然后在满足目标的最小 nprobe 下运行"这个决策逻辑。

### 2.6 流式处理：逐章切割、批量 Embedding、分批插入

完整的主流程代码：

```javascript
async function loadAndProcessEPubStreaming(bookId) {
  const loader = new EPubLoader('./天龙八部.epub', { splitChapters: true })
  const documents = await loader.load()
  // → 50 个章节

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500, chunkOverlap: 100,
  })

  let totalInserted = 0
  for (let i = 0; i < documents.length; i++) {
    const chapter = documents[i]
    const chunks = await textSplitter.splitText(chapter.pageContent)
    // 每章独立：切块 → embedding → insert
    const inserted = await insertChunksBatch(chunks, bookId, i + 1)
    totalInserted += inserted
    // 处理完一章释放内存，再处理下一章
  }
  return totalInserted
}

// 批量插入：Promise.all 并行生成 embedding
async function insertChunksBatch(chunks, bookId, chapterNum) {
  if (chunks.length === 0) return 0

  const insertData = await Promise.all(
    chunks.map(async (chunk, idx) => ({
      id: `${bookId}_${chapterNum}_${idx}`,
      book_id: bookId,
      book_name: '天龙八部',
      chapter_num: chapterNum,
      index: idx,
      content: chunk,
      vector: await getEmbedding(chunk),
    }))
  )

  const result = await client.insert({
    collection_name: 'ebook',
    data: insertData,
  })
  return +result.insert_cnt || 0
}
```

**设计要点：**
1. 逐章循环，而非一次性加载所有 chunk——控制内存
2. `Promise.all` 并行生成 embedding——加速向量化
3. 返回实际插入数量——函数返回值可预测
4. 空 chunk 提前返回 0——边界安全

### 2.7 集合生命周期管理

生产环境不能假设 collection 一定存在、一定已加载：

```javascript
async function ensureCollection(bookId) {
  // 1. 检查是否存在，不存在才创建
  const hasCollection = await client.hasCollection({ collection_name: 'ebook' })
  if (!hasCollection.value) {
    await client.createCollection({ /* ... fields */ })
    await client.createIndex({
      collection_name: 'ebook',
      field_name: 'vector',
      index_type: IndexType.IVF_FLAT,
      metric_type: MetricType.COSINE,
      params: { nlist: 1024 },
    })
  }

  // 2. 每次使用前确保已加载到查询节点
  try {
    await client.loadCollection({ collection_name: 'ebook' })
  } catch (error) {
    // 可能已处于加载状态，不阻断流程
    console.error('集合已处于加载状态')
  }
}
```

`hasCollection` → `createCollection` → `createIndex` → `loadCollection` 是标准的启动自检流程。

---

## 三、在线链路：从语义检索到 RAG 问答

### 3.1 纯语义检索（query.mjs）

验证向量库是否正常工作的第一步——不涉及 LLM，只看检索召回：

```javascript
const query = '段誉会什么武功?'
const queryVector = await embedding.embedQuery(query)

const searchResult = await client.search({
  collection_name: 'ebook',
  vector: queryVector,
  limit: 3,
  metric_type: MetricType.COSINE,
  output_fields: ['id', 'book_id', 'chapter_num', 'index', 'content'],
})

// 输出带分数的检索结果
searchResult.results.forEach((item, i) => {
  console.log(`${i + 1}. [Score: ${item.score.toFixed(4)}]`)
  console.log(`章节: ${item.chapter_num}, 内容: ${item.content}`)
})
```

输出示例：

```text
1. [Score: 0.9234]
章节: 5, 内容: 段誉展开凌波微步，身形飘忽，那吐蕃国师...
2. [Score: 0.8912]
章节: 3, 内容: 段誉得了北冥神功的图谱...
```

`output_fields` 指定了检索返回的字段——只返回必要的字段可以减少传输开销。

### 3.2 RAG 问答（rag.mjs）

在检索基础上引入 LLM，完成端到端 RAG：

```javascript
// 第一步：检索相关片段
async function retrieveRelevantContent(question, topK) {
  const queryVector = await getEmbedding(question)
  const searchResult = await client.search({
    collection_name: 'ebook',
    vector: queryVector,
    limit: topK,
    metric_type: MetricType.COSINE,
    output_fields: ['id', 'book_id', 'chapter_num', 'index', 'content'],
  })
  return searchResult.results
}

// 第二步：组装 Prompt 并生成回答
async function answerEbookQuestion(question, topK) {
  const retrieved = await retrieveRelevantContent(question, topK)

  // 空召回保护
  if (retrieved.length === 0) {
    return '抱歉，我没有找到相关的《天龙八部》内容。'
  }

  // 按编号组装上下文，保留章节元信息
  const context = retrieved.map((item, i) => `
[片段${i + 1}]
章节: 第${item.chapter_num}章
内容: ${item.content}
`).join('\n\n----\n\n')

  // Prompt 约束 LLM 行为
  const prompt = `
你是一个专业的《天龙八部》小说助手。
请根据以下小说片段内容回答问题：

${context}

用户问题：${question}

回答要求：
1. 如果片段中有相关信息，请结合小说内容给出详细准确的回答。
2. 可以综合多个片段的内容提供完整的答案。
3. 如果片段中没有相关信息，请如实告诉用户。
4. 回答要准确，符合小说的情节和人物设定。
5. 可以引用原文内容来支持你的回答。
`

  const response = await model.invoke(prompt)
  return response.content
}
```

**这个 Prompt 的设计要点：**
- **角色设定**明确（"专业的小说助手"），锚定回答风格
- **约束链**逐条细化：有信息怎么办、没信息怎么办、怎么引用
- **章节元信息**保留在上下文中，让 LLM 能标注出处
- **空召回保护**前置，避免空数据进入 Prompt

---

## 四、生产踩坑：Collection 名称不一致的静默灾难

### 4.1 问题发现

"补"提交（`df83768`）修复了一个只有一行改动的 bug：

```diff
- const COLLECTION_NAME = 'ai_dairy';
+ // 与 main.mjs 写入、query.mjs 检索使用同一个 ebook collection。
+ const COLLECTION_NAME = 'ebook';
```

`rag.mjs` 是从日记项目（`ai_dairy` collection）复制过来的模板，修改时忘了把 collection 名称改为 `'ebook'`。结果：

```text
main.mjs  → 写入 'ebook' collection   ✅
query.mjs → 检索 'ebook' collection   ✅
rag.mjs   → 检索 'ai_dairy' collection ❌  ← 静默返回空结果！
```

### 4.2 为什么这是一个危险的问题

- **没有报错**：Milvus 不会告诉你"这个 collection 是空的"——它只是在 `ai_dairy` 里搜索，找不到匹配结果，返回空数组
- **看起来一切正常**：程序正常执行到"未检索到相关内容"分支，输出友好但无用的回复
- **日志看不出异常**：没有异常栈，没有错误码

如果是生产环境，这个问题会被掩盖很久——直到有用户投诉"为什么天龙八部的问题一个都搜不到"。

### 4.3 修复方案与预防措施

```javascript
// 集中式配置：所有文件从同一个地方引用
// config.mjs（或环境变量）
export const COLLECTION_NAME = 'ebook'

// main.mjs / query.mjs / rag.mjs 统一导入
import { COLLECTION_NAME } from './config.mjs'
```

更完善的预防措施：

```text
1. 提取 collection 名称为配置常量或环境变量
2. 集成测试覆盖写入→检索端到端一致性
3. 启动时自检：确认目标 collection 存在且记录数 > 0
4. Code Review 中特别关注跨文件共享的常量
```

---

## 五、与日记 RAG 案例的对比

Day 47 实际上包含两个完整的 RAG 项目，它们在设计上有不同的侧重点：

| 维度 | 日记 RAG (milvus-demo) | 天龙八部 RAG (tlbb) |
|---|---|---|
| 数据源 | 硬编码的日记数组 | EPUB 电子书文件 |
| 文档处理 | 无（直接文本） | EPubLoader + RecursiveCharacterTextSplitter |
| Schema 字段 | id / vector / content / date / mood / tags | id / book_id / book_name / chapter_num / index / content / vector |
| 主键设计 | 固定前缀（diary_001） | 复合主键（bookId_chapterNum_chunkIndex） |
| 入库模式 | 一次性全量插入 | 逐章流式处理 → 批量插入 |
| 集合名称 | `ai_dairy`（单用途） | `ebook`（可通过 book_id 存多本书） |
| 文件结构 | index.mjs / query.mjs / rag.mjs | main.mjs / query.mjs / rag.mjs |

两个案例互补：日记项目展示最小可用 RAG 闭环，天龙八部项目展示真实文档到向量库的完整工程链路。

---

## 六、高频面试题与答题框架

### 1. 从 EPUB 文件到可检索的向量库，整个 Pipeline 是怎样的？

**答：** 第一步，用 `EPubLoader` 配合 `splitChapters: true` 按章节加载，避免一次性把几十万字加载到内存。第二步，用 `RecursiveCharacterTextSplitter` 对每章文本递归切块——它按段落、行、词、字符的优先级依次尝试切割，尽量在语义边界断句。第三步，对每个 chunk 调用 Embedding 模型生成 1024 维向量。第四步，使用 `Promise.all` 批量并行向量化，然后通过复合主键 `bookId_chapterNum_chunkIndex` 插入 Milvus。最后建立 IVF_FLAT 索引并加载到查询节点。整个过程是流式的——处理完一章释放内存再处理下一章。

### 2. RecursiveCharacterTextSplitter 和按固定长度切分有什么区别？

**答：** 固定长度切分按字符数一刀切，可能在句子中间截断，导致 chunk 语义不完整。`RecursiveCharacterTextSplitter` 使用优先级递减的分隔符列表（`\n\n` → `\n` → ` ` → ``），优先在段落、行、词边界切割，尽量保持 chunk 的语义完整。`chunkOverlap` 参数让相邻 chunk 共享一段文本，减少边界信息丢失。

### 3. 复合主键（bookId_chapterNum_chunkIndex）相比自增 ID 有什么优势？

**答：** 四个优势：一是唯一性，同书不同章节绝不冲突；二是可追溯，检索结果直接定位到书→章→切片；三是幂等写入，重跑入库任务不会产生重复数据；四是可回滚，可按前缀批量删除某本书的所有切片。自增 ID 每次入库都会变，做不到这些。

### 4. IVF_FLAT 的 nlist 在实际项目中怎么设？

**答：** 首先根据 Embedding 模型文档选择 metric（文本语义检索常用 COSINE）。nlist 的选择取决于数据规模：经验公式 `nlist ≈ 4 × sqrt(N)`，在数千条向量场景中约 128~256。实际可以设得更大（如 1024）来让分桶更细，给后续通过 nprobe 调优留空间。最终要通过离线 Recall@K 实验确定最优组合——在满足目标召回率的前提下选择最小的 nprobe。

### 5. 写入和检索不在同一个文件时，怎么避免 collection 名称不一致？

**答：** 这是 Day 47 实战遇到的真实 bug：rag.mjs 的 collection 名写成了日记项目的 `ai_dairy`，而 main.mjs 写入的是 `ebook`，导致检索静默返回空结果。预防措施：将 collection 名称抽取为配置常量或环境变量，所有文件统一引用；编写集成测试验证写入→检索端到端一致性；启动时自检目标 collection 是否存在且已加载。

### 6. 如何判断是 chunk 切得不好还是 Embedding 模型选得不对？

**答：** 先做链路归因。跑一批标注过的问答对，检查正确答案对应的 chunk 是否在 Recall@N 中出现。如果标准答案对应的 chunk 根本没出现在召回结果里，大概率是 chunk 策略问题（太大导致语义稀释，或 overlap 太小导致边界信息丢失）。如果出现在 Recall@N 里但排名靠后，可能是 metric 选择的问题。换 Embedding 模型应该放在最后——它是改动成本最高的变量，需要重新入库全部数据。

### 7. 空召回时，系统应该怎么处理？

**答：** 不是让 LLM 自由补全。候选数为 0 时直接返回"未找到相关资料"；重排分数低于校准阈值时触发拒答或追问。在 rag.mjs 的实现中，检索结果为空会直接返回固定消息，不做 LLM 调用——既安全又节省成本。

---

## 七、从 Demo 到生产的缺口

当前《天龙八部》RAG 项目验证了核心链路，但离生产还缺：

```text
□ 多本书共用一个 collection 的隔离（通过 book_id 过滤）
□ 按 book_id + chapter_num 范围的精确过滤检索
□ 批量入库的重试、限流与死信处理
□ 检索 + 重排离线评测（构造天龙八部问答测试集）
□ 低置信度策略（当检索到互相矛盾的片段时标记不确定性）
□ 调用链追踪（每次问答的检索结果、分数、最终上下文可审计）
□ Embedding 模型版本管理（升级模型后需要重新入库的全部书籍）
□ 用户层面的问答交互（当前是命令行直接调用函数）
```

这些缺口正是面试官想听到的"你知道还缺什么"——证明你不只是跑通了 Demo，还对生产有清醒的认知。

---

## 结语：真正的 RAG 工程能力体现在"设计"而非"调用"

把一本《天龙八部》变成可问答的知识库，技术栈本身不复杂：EPubLoader + RecursiveCharacterTextSplitter + Milvus + OpenAI Embedding + LLM。但让面试官记住你的，不是你会调用这些 API，而是你能解释：

- 为什么用流式处理而不是一把梭
- 为什么复合主键比自增 ID 更适合这个场景
- 为什么 nlist=1024 而不是 128 或 2048
- 为什么 collection 名称要集中管理
- 为什么空召回要有独立处理路径

这些设计决策背后的工程思维，才是生产级 RAG 的核心竞争力。
