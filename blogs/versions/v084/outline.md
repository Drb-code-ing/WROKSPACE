# v084 大纲

## 标题
混合检索 RAG 全链路：查询增强、双路召回与重排——向量库和搜索引擎联手补齐召回

## 结构
1. 为什么单路检索不够用（向量 vs 关键词盲区互补表）
2. 地基：一份数据双库灌入（id 对齐契约、embedDocuments、flushSync 数组参数）
3. 查询增强（LLM 改写 3 条检索句 + 原句、jsonMode 三坑、normalizeThreeQueries 兜底）
4. 双路并行召回（Promise.all、note_title^2、best_fields、flatMap 只转一次、Document 归一化）
5. 合并去重（重复即强调、Set O(n)）
6. 重排（BaseDocumentCompressor 接口、粗排+精排两段式、rerank vs RRF 分工）
7. LangGraph 接线（扇出/扇入、空召回兜底双 prompt）
8. 实测复盘（路由器断流案例全表）
9. 面试快问快答 ×7
10. 结语：上线前自查清单

## 核心结论
- 混合检索的收益 = 字面精确（ES/BM25）+ 语义泛化（Milvus/向量），单路各有致命盲区
- 查询增强是用一次小 LLM 调用换召回率的杠杆
- 粗排（召回）+ 精排（rerank）两段式是成本与质量的最优折中
- 空上下文必须有独立兜底 prompt，防幻觉最后一道闸
