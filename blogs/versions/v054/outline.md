# v054 大纲

- 向量数据库在 RAG 中的职责，以及与关系型数据库、全文检索的边界
- 离线建库和在线问答的端到端链路
- Milvus collection schema、Embedding 维度与版本生命周期
- COSINE / IP / L2，FLAT / IVF_FLAT / HNSW 的原理和调优
- Top-N、Top-K、过滤、混合检索、重排、阈值与拒答
- Recall@K、MRR、NDCG、延迟和成本观测
- 写入到查询的生命周期、更新删除、多租户与容量规划
- 日记语义检索案例、从 Demo 到生产的治理缺口
- 高频面试题和结构化回答

## 覆盖边界

- 聚焦 Milvus / Zilliz Cloud 语境下的生产级向量检索与 RAG
- 不提供特定云厂商控制台操作或完整集群部署命令
- 不讲解 Embedding 模型训练与微调
