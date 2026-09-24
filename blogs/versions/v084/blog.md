# 混合检索 RAG 全链路：查询增强、双路召回与重排——向量库和搜索引擎联手补齐召回

上一篇把 Agentic RAG 的"决策层"画完了：路由、评估、多跳、联网兜底。这一篇回到**检索层**做最后一个升级——把向量检索和关键词检索**真正接进同一张图**：查询先用 LLM 改写成多条检索句，ES（BM25）和 Milvus（向量）两路**并行召回**，合并去重后交给**重排模型**精读打分，取 top 3 再喂给大模型。整套流水线在 LangGraph 里一次性跑通，实测案例见文末复盘。

---

## 一、为什么单路检索不够用

向量检索和关键词检索各自有一块**致命的盲区**，恰好互补：

| | 向量检索（Milvus） | 关键词检索（ES） |
| --- | --- | --- |
| 本质 | 语义相似度（"像不像"） | 字面命中（BM25 打分） |
| 强项 | 换说法也能找到（"无线断流" ≈ "WiFi 断断续续"） | 专有名词、型号、订单号一字不差命中 |
| 盲区 | 对 **SN-MILO-77821** 这种字面串，语义距离完全无效 | 用户换个说法同义词就全漏 |

用户的问题五花八门，你永远猜不到下一句话靠的是语义还是字面。答案是**两条路都要走**：这就是混合检索（Hybrid Retrieval）。

但把两路接起来不是"各查一次拼起来"这么简单，要跨过四道坎：

1. **用户口语化的问题，直接拿去检索效果差**——需要**查询增强**；
2. **两路返回格式完全不同**（ES 命中结构 vs Milvus Document）——需要**归一化**；
3. **同一篇笔记两路都命中**——需要**去重**（重复即强调）；
4. **合并后条目太多，塞不进上下文**——需要**重排模型**精读筛选。

下面按流水线的真实顺序，一段一段讲。

---

## 二、地基：一份数据，双库灌入

混合检索的前提是**同一批笔记在 ES 和 Milvus 里各存一份**。灌库脚本 `seed-data.mjs` 把 10 条生活笔记双写：

```text
              10 条生活笔记（id: life_01 ~ life_10）
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
   ES: life_notes          Milvus: life_notes
   建 mapping               建 collection（1024 维 FloatVector）
   ik_max_word 索引分词      embedDocuments 批量向量化
   bulk 交替动作流写入       insert + flushSync 落盘
```

三个细节决定成败：

**① 两个库的 `id` 必须是同一套**（`life_04` 在两边都叫 `life_04`）。后面合并去重、引用溯源全靠这个字段对齐——这是灌库阶段就要定下的"契约"。

**② 向量化 API 选对**。批量文本要用 `embedDocuments(texts)`（返回数组），而不是 `embedQuery(text)`（只收单个字符串，只返回一条向量）。传错会报 `text.replace is not a function`——字符串方法用在数组上。

**③ Milvus 写入闭环**：`insert` 返回只代表进了缓冲区（WAL），脚本退出前必须 `flushSync` 强制封口落盘。注意 `flushSync` 的参数 `collection_names` 是**数组**，传字符串会被 SDK 的 `Array.isArray` 校验拒掉，而报错文案还在说单数的 `collection_name`，很误导。

ES 侧的 mapping 设计（ik 分词、text/keyword 分工）在上篇 ES 博客已经展开，不重复。

---

## 三、查询增强：把口语化问题改写成 4 路检索句

用户问的是口语：**"家里无线老是断断续续的咋整啊"**。直接拿这句去查两路库，召回质量看运气。查询增强（Query Augmentation）的思路：**让 LLM 先把原问题改写成 3 条角度不同的检索句，加上原句一共 4 路查询**。

```text
"家里无线老是断断续续的咋整啊"
   ├─ 原句（保留，万一是专有名词）
   ├─ 改写1：WiFi 信号不稳定排查方法
   ├─ 改写2：路由器断流 网络断断续续 解决
   └─ 改写3：家庭无线网络故障修复步骤
```

为什么有效：LLM 最擅长"同一句话的 N 种说法"。改写句会主动补出**同义词**（无线 → WiFi、无线网络）、**书面化**（咋整 → 排查/解决）、**领域词**（路由器、断流）——每一条都在覆盖检索模型可能听不懂的表达缺口。

实现上就是结构化输出调一次 LLM（Zod schema 约束恰好 3 条）：

```js
const QueryAugmentSchema = z.object({
  queries: z.array(z.string()).length(3)
})
const structured = chatModel.withStructuredOutput(QueryAugmentSchema, { method: "jsonMode" });
```

两个工程坑（deepseek 思考模式的老结论）：

- `jsonSchema`/`functionCalling` 都 400，**只能 `jsonMode`**，且 prompt 里必须出现 "json" 这个词并写明输出格式；
- prompt 里写 JSON 示例时，**花括号要双写转义** `{{"queries": [...]}}`——LangChain 模板把单花括号当变量占位符。

另外一个防御性设计：`normalizeThreeQueries` 兜底——LLM 少给了就用原句补齐到 3 条，保证下游永远拿到固定数量的查询。

---

## 四、双路并行召回：Promise.all + flatMap 拍平

改写出的每条查询句，**ES 和 Milvus 各查一遍**。N 条查询句 × 2 路库，全部并行：

```js
// ES 侧：每条查询句一次 multi_match，Promise.all 并发
const batches = await Promise.all(
  qs.map(q => esClient.search({
    index: INDEX,
    size: kEach,          // 每句查 kEach 条，总预算 ES_K=15 均摊
    query: { multi_match: {
      query: q,
      fields: ['note_title^2', 'note_body'],  // 标题权重 ×2
      type: 'best_fields',   // 取单字段最高分，防止长文本稀释
      analyzer: 'ik_smart'
    }}
  }))
)
const flat = batches.flatMap(b => b.hits?.hits?.map(docFromEsHit) ?? [])

// Milvus 侧：similaritySearch 直接返回 Document[]，batches.flat() 即可
```

四个关键设计：

**① `note_title^2` 标题加权**。标题命中比正文命中更可能是"正题"，BM25 打分乘 2——一句话调权重，不用改任何数据。

**② `best_fields` 而非 `most_fields`**。取各字段里的最高分而不是加总，防止"正文里零散提到几次"的长文档靠凑次数干掉"标题正中"的短文档。

**③ `flatMap` 拍平二维结果**。`batches` 是"每句一批"的数组的数组，合并前必须压成一维 `Document[]`。这里有个真实的 bug 教训：`map(docFromEsHit)` **只能调一次**——套两层会把已经转好的 Document 再当 ES 命中处理一遍，`pageContent` 全变空串，下游静默丢光。

**④ ES 命中要归一化成 LangChain `Document`**：`_source` 拼成 `pageContent`，`_id` 和原字段塞进 `metadata`，并打上 `source: 'es'` 标记——两路在 Document 格式上统一了，后面才能合并。

---

## 五、合并去重：重复即强调

两路拍平后 `merge` 直接拼接，然后 `dedupeDocsById` 按 id 去重：

```js
function dedupeDocsById(docs) {
  const seen = new Set()
  const output = []
  for (const d of docs ?? []) {
    if (!d?.pageContent) continue        // 空文档兜底
    const id = String(d.metadata.id ?? '').trim()
    if (!id || seen.has(id)) continue    // 无 id 或已见过 → 跳过
    seen.add(id)
    output.push(d)
  }
  return output
}
```

**为什么必须去重**：同一篇笔记被 ES 和 Milvus 同时命中（说明它确实相关！），如果两份都留下：

1. **重复即强调**——重排和生成时，同一内容出现两次等于人为加权，扭曲相关性排序；
2. **浪费上下文**——LLM 的 token 配额有限，一份原文占两份位置。

`Set` 记账 + 单次遍历，O(n) 解决。实测里 `life_04`（路由器笔记）和 `life_05`（净水器）两路都中，合并后各留一份——ES 3 条 + Milvus 4 条 = 去重后 5 条。

---

## 六、重排：让模型精读一遍再砍到 top 3

合并去重解决的是"数量"，还没解决"质量"——5 条里有的是真相关（路由器排查），有的只是字面沾边（酒店网速、净水器）。**重排模型**（Rerank）登场：把 query 和每条文档**一起塞进模型精读**，输出 0~1 的语义相关性分。

实现上继承 LangChain 的 `BaseDocumentCompressor` 基类——它定义了"文档压缩器"的统一接口 `compressDocuments(docs, query)`，实现后可以直接插进任何标准检索链：

```js
class DashscopeRerank extends BaseDocumentCompressor {
  async compressDocuments(documents, query) {
    // 1. query + 全部文档发给 qwen3-rerank API
    // 2. 按 relevance_score 重排序，top_n 裁剪
    // 3. 分数挂进 metadata.rerank_score 带出去（可供下游按阈值再过滤）
  }
}
```

这就是 RAG 经典的**粗排 + 精排**两段式：

```text
向量/BM25 召回 15~30 条     （粗排：快而广，只看"像不像/含不含"）
        ↓
rerank 精读打分，top_n=3    （精排：慢而准，读懂 query 和文档的真实关系）
        ↓
top 3 喂给 LLM              （上下文省 token，答案更聚焦）
```

和 RRF 的分工也值得再说一遍：**RRF 是排名融合公式**（无模型，管多路合流），**rerank 是语义精读模型**（管质量筛选）——一个管"合"，一个管"砍"，先后串联。

---

## 七、LangGraph 接线：扇出 + 扇入 + 空召回兜底

整张流水线用 LangGraph 编排，图的形状：

```text
START → query_augment ──┬──→ es_recall ──────┐
                        └──→ milvus_recall ──┴──→ merge → rerank → generate_answer → END
```

三个接线知识点：

**① 扇出（fan-out）**：`query_augment` 出两条边分别指向两个召回节点，两路并行执行（LangGraph 自动并发调度）。

**② 扇入（fan-in）**：`merge` 有**两条入边**（来自 es_recall 和 milvus_recall）——LangGraph 会等两路**都完成**后才执行 merge。写法是两条独立 `addEdge`，不是数组形式。

**③ 空召回兜底分支**：如果两路都召回 0 条，重排直接跳过；生成节点判断 `topDocuments` 为空时换 `NO_CONTEXT_PROMPT`——不硬编上下文，礼貌告诉用户"笔记里没提到，换个说法试试"。**没有数据的回答和基于数据的回答，用两套 prompt**，避免模型在空上下文上自由发挥。

生成节点拿到 top 3 后，把文档格式化成带 id/source 的上下文字符串，拼进 prompt 一次性生成（非流式，因为 LangGraph 节点内流式收益不大）。

---

## 八、实测复盘：一条问题的完整旅程

问题：**"家里无线老是断断续续的咋整啊"**（知识库 10 条生活笔记）。

| 环节 | 输出 | 观察 |
| --- | --- | --- |
| query_augment | 原句 + 3 条改写句 | 覆盖了 WiFi/路由器/排查等同义表达 |
| es_recall | 3 条 | 命中：路由器排查、租房合同、净水器（关键词字面沾边） |
| milvus_recall | 4 条 | 命中：路由器排查、酒店网速、失眠、净水器（语义相关） |
| merge | 5 条 | life_04/life_05 双路命中，去重后各留一份 |
| rerank (top 3) | 路由器、酒店网速、（第三条） | 语义精读把真相关的路由器笔记顶到第一 |
| generate | 按笔记给出 4 步排查 + 保守建议 | 严格基于检索片段，未编造 |

最终回答的质量验证了两件事：**两路互补真实发生**（酒店网速这种"语义相关但字面无'无线'"的笔记，只有 Milvus 能捞到）；**重排的筛选真实有效**（租房合同这种字面沾边但语义无关的，被 rerank 压出了 top 3）。

---

## 九、面试快问快答

**Q1：混合检索和向量检索比，核心收益是什么？**
关键词检索补字面精确命中（型号、订单号、人名），向量检索补语义泛化。单路各有盲区，混合召回上限更高。

**Q2：为什么需要查询增强？不能直接用用户问题吗？**
用户口语化表达和文档书面化表达有鸿沟。LLM 改写产出同义/多角度检索句，一次检索变成多角度撒网，召回率显著提升，成本只是一次小的 LLM 调用。

**Q3：两路结果怎么合并？为什么要去重？**
统一成 Document 格式后按 id 去重拼接。不去重会导致同一内容被重复计算（重复即强调），还浪费上下文。

**Q4：重排和召回的分工？**
召回（向量/BM25）是粗排，快而广；重排是精排，慢而准，把 query 和文档精读打分。先召回 30 条，再重排砍到 3~5 条，是成本和质量的最优折中。

**Q5：rerank 和 RRF 是一回事吗？**
不是。RRF 是无模型的排名融合公式（管多路合流），rerank 是有模型的语义精读（管质量筛选）。先 RRF/去重合流，再 rerank 裁剪。

**Q6：LangGraph 里两路并行召回怎么写？**
扇出：一个节点出多条边；扇入：多条边指向同一节点，该节点自动等所有前驱完成。两路召回天然并行。

**Q7：两路都召回 0 条怎么办？**
生成节点做空上下文分支，换专用 prompt 礼貌兜底，绝不在空上下文上让模型自由发挥——这是防幻觉的最后一道闸。

---

## 结语：上线前自查清单

- [ ] 两个库的文档 id 是同一套，可对齐、可溯源
- [ ] 灌库用 `embedDocuments` 批量向量化，Milvus 写完 `flushSync`
- [ ] 查询增强有数量兜底（LLM 少给就拿原句补）
- [ ] ES 查询带 `best_fields` + 标题加权，analyzer 与 mapping 对齐
- [ ] `flatMap` 拍平只转换一次（别把成品再扔回流水线）
- [ ] 合并按 id 去重，rerank 分数挂 metadata 可追溯
- [ ] 空召回有兜底 prompt，不让模型在真空里编答案
- [ ] 重排 top_n 与上下文预算匹配（宁少勿滥）

至此，RAG 检索层的拼图完整了：**单库向量检索 → ES 关键词检索 → 混合双路 + 重排**。加上上一篇的决策层（路由/评估/多跳/联网），这套 Agentic RAG 已经具备了生产级检索系统的完整骨架。
