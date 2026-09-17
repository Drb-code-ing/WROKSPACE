# Agentic RAG 四级进化：路由分流、多跳拆解与联网兜底——把死板的"检索-生成"升级成会思考的闭环

前两篇笔记把 RAG 的"检索层"铺满了：Milvus 向量检索管语义泛化，ES 关键词检索管精确命中，混合检索用 RRF 融合两路召回。工具齐了，但架构还是死的——这一篇回到主线，讲这些天动手完成的**四张 LangGraph 图**：从最原始的 native RAG 出发，逐级加装**路由分流、多跳循环检索、充分性评估与联网兜底**，最终把"死板的检索-生成管道"升级为**会思考、会判断、会纠错的 Agentic RAG 闭环**。

---

## 一、演进的地图：死板链路的四大缺陷

升级之前先知道为什么要升级。最原始的 RAG 是一条固定管道：**所有问题 → 向量检索 → 塞进 prompt → 生成**。四个先天缺陷：

1. **所有问题都走检索**——问"1+1=?"也要先查一次向量库，浪费 token、时间和成本；
2. **没有评估和纠错机制**——检索回来的内容好不好、够不够，没人把关，好坏全靠运气；
3. **处理不了多步推理问题**——"四大恶人排行第二是谁？此人之子在身世揭晓前的江湖身份是什么？"这种要先查 A、再拿 A 的答案查 B 的问题，一次检索必然缺环；
4. **出不了本地知识库**——本地没有的内容（比如"2013 版电视剧第几集"），模型没有上下文就倾向编造。

对应的解法恰好构成四级台阶：**路由分流**（治缺陷①）、**评估器**（治②）、**多跳拆解 + 循环检索**（治③）、**联网兜底**（治④）。而把这些"思考动作"画进程序里的工具，就是 LangGraph——用图（Graph）描述流程，用状态（State）在节点间传数据，用条件边（Conditional Edge）做决策分叉。

动手搭图之前，得先有语料库。

---

## 二、地基：把《天龙八部》灌进 Milvus

整个 RAG 实验以一部《天龙八部》epub 为语料（168 章，灌库后 3042 条向量）。灌库脚本的流水线是 RAG 数据侧的标准范式——**Loader → Splitter → Embedding → VectorStore**：

```js
// 1. Loader：EPubLoader 按章节加载
const loader = new EPubLoader(EPUB_FILE, { splitChapters: true });
const documents = await loader.load();   // 168 个章节 Document

// 2. Splitter：章节太长，二次切分
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,      // 每片约 500 字符
  chunkOverlap: 50,    // 重叠 50，保持上下文连贯
});

// 3~4. 每章切完立即向量化并插入 Milvus（边处理边插入，流式省内存）
```

三个设计点值得展开：

**为什么 chunkOverlap 要留 50？** 切分是按字符数的硬边界，一句话可能被拦腰截断。相邻片段重叠 50 字符，相当于每片都"带着上一片的尾巴"，边界处的语义就不会丢。

**schema 怎么设计才可溯源？** 每条记录带完整出处元数据，主键用复合 ID 保证唯一：

```
id:          `${bookId}_${chapterNum}_${chunkIndex}`   // 复合主键，全局唯一
book_id / book_name / chapter_num / index              // 出处四件套
content / vector                                       // 正文 + 1024 维向量
```

后面多跳检索做去重靠 `id`，答案引用出处靠 `chapter_num`——元数据设计在灌库那刻就决定了上层应用的能力上限。

**索引怎么选？** 向量字段建 **IVF_FLAT** 索引（`nlist: 1024`）+ **COSINE** 度量。IVF_FLAT 的思想是"先分桶、再桶内暴力比对"：把全库 3042 条向量聚成 1024 个桶，查询时只扫最相关的几个桶，而不是全库逐条算距离——用一点召回损失换大幅速度提升。

---

## 三、第一级 Native RAG：固定链路，一切从这开始

```text
START → retrieve → generate → END
```

最简的一张图：`retrieve` 节点拿问题去做向量检索，`generate` 节点把检索结果塞进 prompt 流式生成。两个工程要点：

**连接已有集合，而不是重建。** 检索侧用 `Milvus.fromExistingCollection(embeddings, {...})`——它**只连接、不建索引**，前提是传入的 embeddings 必须与灌库时完全一致（同模型、同维度 1024），否则查出来的向量空间都不在一个坐标系里：

```js
vectorStore = await Milvus.fromExistingCollection(embeddings, {
  collectionName: "ebook_collection",
  textField: "content", primaryField: "id", vectorField: "vector",
  indexCreateOptions: {
    metric_type: "COSINE",       // 必须与建索引时一致，搜索时会自动带上
    index_type: "IVF_FLAT",      // 实际索引灌库时已建好，这里只是声明
    search_params: { nprobe: 16 } // 查 16 个桶（默认 10，调大召回更准、更慢）
  }
})
```

这里有个容易混的点：`indexCreateOptions` 里的 `metric_type` 声明**会随每次搜索携带**给 Milvus，所以必须与建索引时一致；而 `search_params.nprobe` 是运行时的搜索参数——nlist 是"分多少桶"（建库时定死），nprobe 是"查多少桶"（查询时调）。

**检索带分数、生成引原文。** `similaritySearchWithScore` 返回相似度分数，方便观察命中质量；生成 prompt 里明确要求"引用原文内容支持回答"、"片段中没有相关信息就如实告知"——这两条 prompt 约束是后面所有级别的标配。

跑通之后立刻能看到天花板：**问"阿朱的结局"没问题，但问"四大恶人第二是谁、他儿子身世揭晓前在江湖上的身份"就崩了**——一次检索根本装不下这条推理链。而且不管检索质量好坏，图都闷头往生成走。开始升级。

---

## 四、第二级 路由 RAG：先分流，别啥问题都查库

```text
              ┌─ simple ──→ direct_answer → END
START → route─┤
              └─ complex ─→ retrieve → rag_generate → END
```

新增一个 `route_question` 节点，让 LLM 先判断问题类型：

- **simple**：常识问答、简短定义，无需小说细节——直接让 LLM 回答，**省掉整次检索的开销**；
- **complex**：需要具体情节、人物关系、原文证据——走完整检索链路。

**分流怎么实现？** 两个 LangGraph 机制配合：

```js
// 1. 用 Zod 约束 LLM 的输出形状——枚举强制二选一
const RouteSchema = z.object({
  strategy: z.enum(["simple", "complex"]),
  reason: z.string()
});

// 2. 路由函数读 state 返回字符串，条件边按字符串选路
const decideNext = (state) =>
  state.strategy === "simple" ? "direct_answer" : "retrieve"

graph.addConditionalEdges("route_question", decideNext, {
  direct_answer: "direct_answer",
  retrieve: "retrieve"
})
```

`withStructuredOutput(schema)` 让 LLM 的自由文本变成**强类型对象**——`z.enum` 保证 strategy 只可能是两个值之一，路由函数才敢直接拿它做分支判断。

一个工程注脚：`withStructuredOutput` 支持多种 method（jsonSchema / functionCalling / jsonMode），对思考模式的对话模型，实测只有 **jsonMode** 可用——代价是 prompt 里必须手动写明"请只输出 JSON 对象，格式为 {...}"。约束从 schema 层挪到了 prompt 层，但 `z.enum` 的**运行时校验**仍然兜底。

路由的价值是**成本结构级的**：生产环境的问答系统里大量流量是闲聊和常识问题，一个路由节点就把这部分的全套检索成本（embedding 调用 + Milvus 查询 + 长 prompt）清零。

但路由只解决了"要不要查"，没解决"查一次够不够"——多跳问题依然无解。

---

## 五、第三级 多跳 RAG：子问题拆解 + 循环检索

先看单跳为什么败。问：**"四大恶人排行第二的是谁？此人之子在身世揭晓前，在江湖上的身份是什么？"**

这条问题的推理链是：`四大恶人 → 排行第二 = 叶二娘 → 叶二娘之子 = 虚竹 → 身世揭晓前的身份 = 少林寺小和尚`。第二跳的查询词（"叶二娘的儿子"）**依赖第一跳的答案**——可单跳 RAG 只拿原始问题检索一次，向量库里"叶二娘与虚竹"的段落和"四大恶人"的段落未必同时出现在 top-k 里，推理链从第一环就断了。

解法是**让 LLM 先规划，再循环检索**：

```text
              ┌─ simple ──→ direct_answer → END
START → route─┤
              └─ complex ─→ decompose → retrieve ─┐
                                ↑________________|  还有子问题?
                                                 └─→ rag_generate → END
```

### 拆解器：把一问变多问

```js
const DecomposeSchema = z.object({
  sub_questions: z.array(z.string()).min(1).max(8), // 1~8 条子问题
  reason: z.string()
})
```

拆解 prompt 的三条规则直接决定检索质量：

1. **禁止指代**——每条子问题必须是可独立检索的完整问句，"他/她/此人"一律写全名。因为每条子问题要**单独**去做向量检索，检索器看不懂上下文指代；
2. **链式顺序**——先查前置实体/事实，再查后续结论。第二跳的检索词依赖第一跳的结论，顺序不能乱；
3. **控制粒度**——1~8 条，不拆成关键词碎片，也不把原题原样复制。

对上面那题，LLM 拆出三条：`①四大恶人分别是谁，排行第二的是谁？②叶二娘的儿子是谁？③虚竹在身世揭晓之前在江湖上是什么身份？`

### 循环：retrieve 自己指向自己

```js
graph.addConditionalEdges("retrieve", planNextStepNode, {
  retrieve: "retrieve",        // 还有子问题 → 自循环
  rag_generate: "rag_generate" // 查完 → 生成
})
```

`retrieve` 节点每轮做四件事：取 `subQuestions[nextSubIdx]` → 向量检索 → **合并去重** → `nextSubIdx + 1` 推进游标。出口条件是纯计数的：

```js
const planNextStepNode = (state) => {
  const idx = state.nextSubIdx ?? 0
  const count = state.retrieveCount ?? 0
  const max = state.maxRetrievals ?? 8   // 安全上限：防拆解异常导致无限循环
  return (idx < subs.length && count < max) ? "retrieve" : "rag_generate"
}
```

### 去重：多轮检索的隐形坑

多轮检索很可能捞回重复片段，而重复在 prompt 里是**有害的**——LLM 会把反复出现的内容理解为"作者在强调"，生成被扭曲。所以合并时按 `id` 去重、保留更高分的那条：

```js
function mergeUnique(existingDocs, newDocs) {
  const map = new Map()
  for (const d of [...existingDocs, ...newDocs]) {
    const prev = map.get(String(d.id))
    if (!prev || +d.score > +prev.score) map.set(String(d.id), d)
  }
  return [...map.values()].sort((a, b) => +b.score - +a.score)
}
```

同一题对比：单跳 RAG 的答案在第二环就开始编（把虚竹身份答成"聚贤庄少庄主"之类）；多跳 RAG 三轮循环后按链式推理答出"叶二娘 → 虚竹 → 少林寺小和尚"，每一步都有检索片段支撑。代价也很清楚：**3 次 LLM 拆解 + 3 轮检索 + 1 次生成，成本约为单跳的 3~4 倍**——这正是为什么路由层要先把简单问题分走。

---

## 六、第四级 自纠错 RAG：评估器把关，联网兜底

多跳解决了"链条长"，但还有一个更根本的问题没答：**检索回来的东西，到底够不够回答问题？** 之前所有级别里，检索完就直接生成，质量全碰运气。第四级加装**评估器（Evaluator）**：

```text
                ┌─ simple ──→ direct_answer → END
START → route ──┤
                └─→ local_retrieve → evaluate_local ─┬→ generate → END
                                    ↑      │         └→ web_search ─┐
                                    │      └─(不够)────────────────┘
                                    └──────────(二次评估)←──────────┘
```

### 评估器：LLM 当质检员

```js
const EvaluateSchema = z.object({
  enough: z.boolean(),                 // 上下文够不够
  missing: z.array(z.string()).max(6), // 缺失点清单
  reason: z.string(),
  web_query: z.string().optional()     // 建议的联网查询句
})
```

评估器读"用户问题 + 本地检索上下文"，输出三样东西：**够不够（enough）**、**缺什么（missing，具体到信息点）**、**去哪搜（web_query，一句完整的中文搜索查询）**。注意 `web_query` 是评估器**顺便规划**出来的——它最清楚缺的是什么，由它写搜索词最准。

实测一次真实运行，问题混合了小说情节和 2013 版电视剧集数：

- 评估器判定 `enough=false`，缺失点列出：慕容复的最终结局、2013 版集数、可核对的来源链接——**缺失点是具体的，不是一句"信息不足"**；
- `web_search` 节点拿着评估器给的 `web_query` 调博查 API，返回 8 条带 URL 的网页摘要；
- 搜完**回到评估器做二次评估**（图中那条回边），确认补充后的材料再进生成。

### 两个防失控的细节

**防死循环**：二次评估入口先检查 `webContext` 非空就直接放行去 generate——"搜过一次就不再搜"，否则评估器永远可以判不够，图就在 evaluate ↔ web_search 之间转圈：

```js
const afterEvaluateLocal = (state) => {
  if (state.webContext && String(state.webContext).trim()) return "generate"
  return parsed.enough ? "generate" : "web_search"
}
```

**诚实的生成**：生成 prompt 要求引用分级——本地知识库的**原文片段**、联网结果的**可核对 URL**、以及**明确标注**"此点不在上下文中，按通行版本补充"。这样用户能分清每个事实的来源成色，模型不把"编的"和"查的"混在一起。

到这里，Agentic RAG 的闭环问题——**用什么检索？信息够不够？要不要重新搜？**——全部有了程序化的答案，而且每一步的判断都由 LLM 在图里完成。

---

## 七、四张图背后的 LangGraph 建模套路

四个项目写下来，建模方式完全一致，可以抽象成三件套：

**① 状态先行。** `Annotation.Root` 声明整张图共享的状态 schema，节点函数返回增量 state（写什么键就更新什么键）：

```js
const GraphState = Annotation.Root({
  question: Annotation,      // 输入
  strategy: Annotation,      // 路由决策
  subQuestions: Annotation,  // 多跳：子问题队列
  nextSubIdx: Annotation,    // 多跳：循环游标
  evaluation: Annotation,    // 自纠错：评估结论
  localContext: Annotation,  // 检索上下文
  webContext: Annotation,    // 联网补充
  generation: Annotation     // 输出
})
```

**② 两种函数分工明确。** 节点函数（async）干活并写 state；路由函数（纯同步）读 state 返回字符串，交给 `addConditionalEdges` 选路。把"干活的"和"决策的"分开，图的逻辑一眼可读。

**③ 循环必须配出口。** 四张图里出现了三种出口模式，覆盖了绝大多数场景：

| 出口模式 | 判断依据 | 出处 |
| --- | --- | --- |
| 计数出口 | `nextSubIdx` 走完子问题队列 + `maxRetrievals` 上限 | 多跳 RAG |
| 状态标志出口 | `webContext` 非空即放行 | 自纠错 RAG |
| 评估布尔出口 | `enough === true` | 自纠错 RAG |

共同铁律：**凡是能转圈的边，必须有终止条件，且最好有独立于 LLM 判断的硬上限**——LLM 的判断永远可能出错，`maxRetrievals` 这种机械保险丝是最后一道防线。

---

## 面试问答

**问：Native RAG 有什么缺陷？你是怎么一步步演进的？**

> 四个缺陷：所有问题都走检索浪费成本；没有评估纠错；处理不了多步推理问题；本地知识库没有的内容无法兜底。对应四级演进：路由分流让简单问题直答省掉检索；评估器判断检索质量；多跳拆解把链式问题拆成有序子问题循环检索；联网兜底在本地不够时搜索补充。每一级都是对上一级一个具体缺陷的修复。

**问：为什么用 LLM 做路由，而不是关键词规则？**

> 问题类型的边界是模糊的——"天龙八部的作者是谁"看似常识，但"雁门关事件的细节"无法用几个关键词界定。LLM 路由是语义级判断，泛化能力强，还能输出判断理由便于调试；规则路由维护成本高、误判率高。用 Zod 的 enum 约束输出后，LLM 路由的结果是强类型的，可以直接驱动分支。

**问：withStructuredOutput 的底层是什么？**

> 本质是把 schema 翻译成模型的结构化输出约束：jsonSchema 方式直接把 JSON Schema 传给 API 的 response_format；functionCalling 方式包装成一个工具让模型填参；jsonMode 只开 JSON 输出模式，schema 约束靠 prompt 描述 + 客户端用 schema 校验兜底。思考模式的模型不支持 functionCalling 的 tool_choice，所以工程上常用 jsonMode + prompt 写明格式 + Zod 运行时校验的组合。

**问：多跳 RAG 和单跳的本质区别？**

> 单跳一次检索的查询词是原始问题，而多跳问题的中间实体（先查 A 拿到答案才能查 B）根本不在原始问题里，一次 top-k 检索装不下整条推理链。多跳让 LLM 先拆出有序子问题（禁止指代、保链式顺序），逐条检索、逐环接龙，每轮结果合并去重后一起进生成。本质是把"检索"从一次性动作变成受控循环，代价是成本翻倍，所以上游要靠路由把不需要多跳的问题分走。

**问：LangGraph 里的循环图怎么防止死循环？**

> 三层：循环游标推进（nextSubIdx 每轮 +1，走完即出口）、状态标志（webContext 非空直接放行，不再触发新一轮搜索）、硬上限（maxRetrievals 兜底，防 LLM 拆解异常或评估器永远判不够）。原则是 LLM 的判断可以参与出口决策，但不能是唯一防线，机械上限必须有。

**问：评估器怎么判断"上下文够不够"？**

> 让 LLM 对照"用户问题"和"已检索上下文"输出结构化结论：enough 布尔值、missing 缺失点清单（具体到信息点，最多 6 条）、web_query 建议的联网搜索句。关键是评估器同时负责规划——它最清楚缺什么，由它写搜索词比拿原始问题重搜准得多。二次评估后仍不够也会进入生成，但生成 prompt 要求明确标注哪些点无法确认，宁可诚实也不编造。

**问：联网兜底有什么风险，怎么控制？**

> 三个风险：联网内容质量不可控（SEO 垃圾、过时信息）；答案可溯源性下降；成本和延迟增加。控制手段：只在评估器判定本地不足时才触发（不是每次都搜）；搜索结果带 URL 让用户可核对；生成时引用分级——本地原文、联网 URL、上下文外补充三类来源明确标注，混合检索的融合和重排可以进一步过滤低质网页内容。

---

## 结语：从管道到闭环

四张图画完，RAG 的形态已经完全不同：

```text
第一级 native      START → retrieve → generate → END                  人人都查、查完就答
第二级 router      START → route ─┬→ direct_answer                    简单问题不查库
                                 └→ retrieve → generate
第三级 multi-hop   route → decompose → retrieve ⟲（计数出口）          链式问题逐环检索
                                     └→ generate
第四级 webfallback retrieve → evaluate ⟲（联网兜底后二次评估）          够不够由评估器把关
                              ├→ generate（引用分级，诚实标注）
```

动手前，拿这份清单自检：

- [ ] 能否说出死板 RAG 链路的四大缺陷，以及四级演进分别治哪个？
- [ ] 能否讲清灌库流水线 Loader → Splitter → Embedding → VectorStore，以及 chunkOverlap 和复合主键的意义？
- [ ] 能否说清 fromExistingCollection 的前提（embeddings 与灌库一致）和 nlist / nprobe 的分工？
- [ ] 能否实现一个 Zod 约束的路由节点，并解释 jsonMode 下 schema 约束挪到了哪里？
- [ ] 能否说清多跳拆解的三条规则（禁指代、链式顺序、控粒度）为什么直接影响检索质量？
- [ ] 能否写出 mergeUnique 的去重逻辑，并解释"重复片段会让 LLM 产生强调的错觉"？
- [ ] 能否画出评估器的回边结构，说清 hasWeb 放行和 maxRetrievals 各防什么？
- [ ] 能否总结 LangGraph 三种循环出口模式，并说出"LLM 判断不能是唯一防线"的铁律？

到这里，"会思考的 RAG"骨架已经立起来了：路由决定要不要查，拆解决定怎么查，评估器决定查得够不够，联网兜底决定去哪补。剩下的优化在检索质量本身——混合检索、重排序、更好的切分策略，都是在为这张图里的 `retrieve` 节点换更强的引擎。
