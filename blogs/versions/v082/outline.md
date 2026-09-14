# v082 博客大纲

**标题**：ES 关键词检索：倒排索引、ik 分词与 BM25——给 RAG 装上精确匹配这条腿
**日期**：2026-09-14
**目标平台**：稀土掘金（juejin.cn）
**学习笔记**：第七十五天（`ai/agent/agentic_rag/elastic-search/`，git 短提交号 `b93816f`；主线是 Agentic RAG 检索层的第三块拼图——向量检索的盲区靠关键词检索补齐：倒排索引、text/keyword 双类型、DSL、ik 双分词器，延伸到 BM25 打分与 RRF 融合）

## 结构

| 章节 | 内容 | 来源 |
| --- | --- | --- |
| 引言 | 开门见山：Agentic RAG（native → 路由 → 多跳）已经闭环，但向量检索有盲区——专业术语、精确实体匹配不准；三大存储分工（mysql 行列 / milvus 语义 / es 关键词） | agentic_rag/readme.md + elastic-search/readme.md |
| 一、正向索引的困境 | MySQL LIKE 逐行遍历、逐字匹配；数据量越大、文本越长越慢；不适合大规模关键词检索 | agentic_rag/readme.md「倒排索引」 |
| 二、倒排索引：查询快是因为提前算完了 | 正向"文档→关键词" vs 倒排"关键词→文档"；写入时分词建表；posting list 带 TF 和位置；O(1) 查表 + BM25 排序；"写入时的计算换查询时的速度"；refresh 1 秒近实时 | 笔记 + 课堂推导 |
| 三、动手建索引与检索 API | 9200 端口存索引；GET /_cat/indices；PUT /article 建 mappings（title/content: text 分词，author: keyword 不分词）；GET /_search match 查询；text 全文检索 + keyword 精确过滤；DSL 领域特定语言（MySQL SQL / Milvus embedding / ES http） | elastic-search/readme.md |
| 四、ik_max_word + ik_smart：索引细、查询粗 | 非对称设计的说法：召回靠索引侧的多、精确靠查询侧的少；铁律"索引粒度 ≥ 查询粒度"；为什么反过来不行；为什么查询侧不用 max_word；图书馆类比；代价（索引膨胀、改分词器要 reindex） | elastic-search/readme.md + 课堂推导 |
| 五、打分：从 TF-IDF 到 BM25 | TF×IDF 骨架；BM25 两个修正——词频饱和（k1，防长文堆词刷分）与文档长度归一（b，短文命中更可信）；长短文档例子；ES 5.x 起默认 BM25 | 课堂推导 |
| 六、混合检索与 RRF：两路召回怎么合 | BM25 分数无界 vs cosine 有界，分数不可比 → 弃分数只看排名；RRF 公式与 k=60 平滑；双路共识；局限（丢量级信息）→ 两阶段重排；回到 Agentic RAG 闭环（用什么检索、信息够不够、要不要重搜） | elastic-search/readme.md + 课堂推导 |
| 面试问答 | 倒排索引为什么快、text 与 keyword 区别、ik 双分词器、BM25 vs TF-IDF、RRF 为什么弃分数、混合检索在 RAG 里的位置 | 综合 |
| 结语 | 检查清单 | 综合 |

## 核心结论

- **向量检索的盲区**：专业术语、精确实体在语义空间里是"模糊点"，纯向量检索容易匹配不准；关键词检索补齐精确匹配这条腿。三大存储分工：MySQL 管行列、Milvus 管语义、ES 管关键词索引；
- **倒排索引是 ES 快的根因**：正向索引"文档→关键词"要逐行遍历；倒排索引"关键词→文档"在写入时分词建表，查询 O(1) 查表 + BM25 排序——用写入时的计算换查询时的速度；posting list 里存的不止文档 ID，还有词频（打分用）和位置（短语匹配用）；
- **写入即索引，查询只查表**：文档入库时完成分词与倒排表构建；默认 1 秒 refresh 生成可搜索 segment（近实时）；改分词器不会重分老数据，必须 reindex；
- **text 与 keyword**：text 入库分词走全文检索，keyword 整值进词典走精确过滤/聚合；"全文检索 + 精确过滤"是标准组合拳；ES 的查询语言是 DSL（领域特定语言），与 MySQL 的 SQL、Milvus 的 embedding 检索并列；
- **ik_max_word + ik_smart 是非对称设计**：索引侧细粒度多留钩子（召回高），查询侧粗粒度少而准（精确高）；铁律是索引粒度 ≥ 查询粒度，反过来查询词在索引里不存在直接漏召回；
- **BM25 = TF-IDF + 两个修正**：词频饱和（k1 控制增益递减，防长文堆词刷分）+ 文档长度归一（b 控制，短文命中更可信）；ES 5.x 起默认 BM25；
- **混合检索的融合靠 RRF**：BM25 无界、cosine 有界，分数不可比，所以弃分数只看排名；综合分 = 各路 1/(k+rank) 之和，k=60 平滑头部差距，"双路都靠前"的文档胜出；进阶方案是召回融合 + cross-encoder 重排两阶段；
- **回到 Agentic RAG 闭环**：检索层现在是 web search + milvus + es 三路；Agentic RAG 要解决的是——用什么检索、信息够不够、要不要重新搜，具体图结构按业务场景设计，理解闭环思路即可。
