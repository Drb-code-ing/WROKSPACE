# 天龙八部 RAG
我们学习了 loader、splitter、milvus、RAG 流程完整跑通了
- loader 从各种来源加载文档
  epud csv... 相应的 loader 加载器
- splitter 分块
  separator 分隔符 。，！
  chunk_size 分块大小
  overlap 分块重叠大小
- embedding
  1024 百万字
  - milvus 数据库
  - rag
  cosine  top_k 