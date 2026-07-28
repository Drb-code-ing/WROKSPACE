# v055 大纲

- EPubLoader 按章节加载：splitChapters 与流式处理策略
- RecursiveCharacterTextSplitter：chunkSize/chunkOverlap/分隔符优先级
- Milvus ebook collection schema：复合主键 (bookId_chapterNum_chunkIndex) 设计
- IVF_FLAT 索引参数 nlist=1024 的选择逻辑与调优方向
- 流式逐章入库：Promise.all 并行 embedding + 批量 insert
- Collection 生命周期管理：hasCollection/createCollection/createIndex/loadCollection
- 语义检索：COSINE metric + output_fields 控制返回内容
- RAG 问答：检索 → 上下文组装 → Prompt 约束链 → LLM 生成
- 生产踩坑：collection 名称跨文件不一致导致静默空召回
- 与日记 RAG (milvus-demo) 的对比分析
- 高频面试题与结构化答题框架（7 题）

## 覆盖边界

- 聚焦 Day 47 上/下/补三次提交：天龙八部 EPUB → RAG 问答全链路
- 涵盖 EPubLoader、RecursiveCharacterTextSplitter、IVF_FLAT + nlist 实战配置
- 不与 V054（生产级向量检索与 RAG 面试指南）内容重复
- V054 侧重理论体系与架构设计，V055 侧重文档加载/切块/流式处理的工程实战
- 不讲解 Embedding 模型训练与微调
- 不提供特定云厂商控制台操作或完整集群部署命令
