# v083 博客大纲

**标题**：Agentic RAG 四级进化：路由分流、多跳拆解与联网兜底——把死板的"检索-生成"升级成会思考的闭环
**日期**：2026-09-17
**目标平台**：稀土掘金（juejin.cn）
**学习笔记**：第七十二～七十六天（`ai/agent/agentic_rag/advanced-rag/`，git 短提交号 `ac7926a` / `5499c90` / `69c7554`；主线是 Agentic RAG 架构演进——从固定链路的 native RAG 出发，逐级加装路由分流、多跳循环检索、充分性评估与联网兜底，全部用 LangGraph 建模）

## 结构

| 章节 | 内容 | 来源 |
| --- | --- | --- |
| 引言 | 检索层三路已齐（MySQL/Milvus/ES），回到架构主线：死板 RAG 链路的四大缺陷（全都检索、无评估纠错、多跳无解、出不了本地知识库）→ 用四张 LangGraph 图逐级升级 | agentic_rag/readme.md |
| 一、地基：把《天龙八部》灌进 Milvus | EPubLoader 按章加载 → RecursiveCharacterTextSplitter（500/重叠50）→ embedding 1024 维 → schema 设计（复合主键 id = bookId_chapter_chunkIndex）→ IVF_FLAT（nlist 1024）+ COSINE；168 章 3042 条 | ebook-writter.mjs |
| 二、第一级 Native RAG：固定链路 | START → retrieve → generate → END；fromExistingCollection 只连接不建索引；similaritySearchWithScore；indexCreateOptions 声明随搜索携带 vs indexSearchParams；prompt 引用原文要求；缺陷引出下一级 | native-rag.mjs |
| 三、第二级 路由 RAG：先分流再干活 | simple 直答 / complex 检索；条件边 decideNext；Zod + withStructuredOutput 结构化输出；思考模式模型 method 取舍（jsonMode + prompt 写明格式）；为什么用 LLM 做路由而非规则 | rag-query-router.mjs |
| 四、第三级 多跳 RAG：子问题拆解 + 循环检索 | 单跳失败案例（四大恶人第二 → 叶二娘 → 其子虚竹 → 身世揭晓前的江湖身份）；DecomposeSchema 有序拆解（禁指代、链式顺序、1~8 条）；retrieve 自循环（nextSubIdx 推进）；计数出口（retrieveCount / maxRetrievals 安全上限）；mergeUnique 按 id 去重保最高分；单跳 vs 多跳同题对比 | rag-mutihop.mjs |
| 五、第四级 自纠错 RAG：评估器 + 联网兜底 | evaluate_local（enough / missing / web_query）；不够 → 博查 web_search → 回边二次评估 → generate；hasWeb 防死循环；生成时引用分级（本地原文 / URL / 明确标注上下文外补充）；"评估器"思想 | rag-webfallback.mjs |
| 六、LangGraph 建模套路总结 | Annotation.Root 状态 schema；节点写 state / 路由函数返回字符串；三种循环出口模式（计数出口、状态标志出口、评估布尔出口）；maxRetrievals 防失控 | 四张图综合 |
| 面试问答 | native RAG 缺陷与演进、路由省成本、结构化输出、多跳 vs 单跳、循环图防死循环、评估器设计、联网兜底流程与风险 | 综合 |
| 结语 | 四级演进总图 + 检查清单 | 综合 |

## 核心结论

- **死板链路的四大缺陷是演进地图**：①所有问题都走检索（浪费 token/时间/成本）②没有评估纠错机制（检索好坏全靠猜）③处理不了多步推理的复杂问题（先查 A 再查 B）④本地知识库没有的内容无法兜底（模型容易编造）。四级进化逐级对症下药；
- **灌库是 RAG 的地基**：EPub 按章加载 + RecursiveCharacterTextSplitter 二次切分（chunkSize 500、重叠 50 保持上下文连贯）→ 1024 维向量入库；schema 用复合主键 `bookId_chapterNum_chunkIndex` 保证唯一可溯源；IVF_FLAT 索引 = 先分桶（nlist 1024）再桶内暴力比对，COSINE 度量；
- **Native RAG 是"检索→生成"的固定管道**：fromExistingCollection 只连接既有集合不重建索引，metric_type 声明会随搜索携带（必须与建索引时一致），nprobe 决定查多少个桶；一切问题都检索、检索好坏无判断，是后续所有升级的起点；
- **路由是性价比的一级**：LLM 按问题特征分流，simple（常识/定义）直答省掉检索开销，complex（情节/人物/证据）才走向量库；实现靠条件边 + Zod 结构化输出约束（enum 强制二选一）；思考模式模型下 method 用 jsonMode + prompt 写明 JSON 格式；
- **多跳 RAG 解决"一次检索装不下的问题"**：链式推理问题（四大恶人→叶二娘→虚竹→少林小僧）单跳检索的上下文必然缺环；LLM 把问题拆成有序子问题（禁指代、保链式顺序），retrieve 节点自循环逐条检索，mergeUnique 按 id 去重保最高分防"重复即强调"的错觉，计数出口（maxRetrievals=8 安全上限）防死循环；
- **自纠错 RAG 的灵魂是评估器**：检索完先问"上下文够不够"——enough / missing（缺失点清单）/ web_query（建议的联网查询句）；不够就联网搜索兜底，回边到评估器做二次评估再生成；有 webContext 直接生成，避免"搜了又评、评了又搜"的死循环；生成时引用分级：本地原文、可核对 URL、明确标注"上下文外补充"；
- **LangGraph 建模三件套**：Annotation.Root 声明状态 schema（节点函数返回增量 state，路由函数返回字符串选路）；条件边 addConditionalEdges 挂路由函数；循环必须配出口——计数出口（多跳）、状态标志出口（hasWeb）、评估布尔出口（enough），外加 maxRetrievals 兜底上限；
- **Agentic RAG 的闭环问题**：用什么检索？信息够不够？要不要重新搜？——这三大判断全部由 LLM 在图里完成，RAG 从"死板的管道"升级为"会思考、会判断、会纠错的智能架构"。
