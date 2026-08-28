# v079 博客大纲

**标题**：Milvus 向量数据库：AI 日记本的三组件部署、集合字段建模与余弦索引
**日期**：2026-08-28
**目标平台**：稀土掘金（juejin.cn）
**学习笔记**：第六十五天（backend/docker/milvus-docker，git 短提交号 3104f16；侧重点 Milvus 三组件 Docker 部署、ai_diary 集合建模、IVF_FLAT+COSINE 索引与加载、embedding 生成与插入）

## 结构

| 章节 | 内容 | 来源 |
| --- | --- | --- |
| 引言 | 开门见山：AI 日记本一条数据两个库（MySQL 管 CRUD 精确查找、Milvus 管语义检索）；三个技术核心（三组件部署、集合字段建模、索引/加载/插入流程） | index.mjs + readme 注释综合 |
| 一、向量数据库与关系型数据库的分工 | 传统库精确匹配（id / like / CRUD）vs 向量库语义检索；RAG 把相关文档放 prompt；AI 日记本场景：日记 CRUD 在 MySQL、entity 向量化存 Milvus | readme.md、笔记注释（"最近心情比较好的日记"） |
| 二、三组件部署 | Milvus standalone 是 etcd（元数据）+ MinIO（对象存储，9000/9001）+ standalone（引擎，19530 gRPC / 9091 健康检查）三个服务；环境变量 ETCD_ENDPOINTS/MINIO_ADDRESS 串联；healthcheck + start_period 90s；seccomp:unconfined；volumes 持久化 | milvus-standalone-docker-compose.yml |
| 三、集合建模 | ai_diary 集合六字段四类型：VarChar 业务主键（diary_001）、FloatVector dim=1024（维度由 embedding 模型定）、标量字段 content/date/mood 随向量存（命中直接带原文）、Array 数组字段 tags（element_type/max_capacity/max_length） | index.mjs（createCollection 字段定义） |
| 四、建索引与加载 | IVF_FLAT 倒排文件索引（nlist 聚类中心）、COSINE 余弦度量、nlist=1024；loadCollection 查询前必经（数据在对象存储，load 进内存）；先 load 后 insert 合法（Milvus 支持增量加载），生产更常见 insert→index→load | index.mjs（createIndex / loadCollection） |
| 五、嵌入与插入 | OpenAIEmbeddings 配置（apiKey/model/baseURL 来自 .env、dimensions 1024）；embedQuery 单条转向量；Promise.all 并行向量化 + `{ ...diary, vector }` 组装；insert 返回 insert_cnt 确认 | index.mjs（embeddings 配置、getEmbedding、insert 段） |
| 面试问答 | 双库存分工、三容器职责、dim 由模型定、IVF_FLAT/COSINE/nlist、load 必要性、Array 标签、记录结构 | 综合 |
| 结语 | 部署→建模→索引→入库链路图 + 检查清单 | 综合 |

## 核心结论

- **Milvus standalone = 三个服务**：etcd 管元数据、MinIO（S3 兼容）管向量与索引落盘、standalone 管检索引擎；三容器通过环境变量（ETCD_ENDPOINTS / MINIO_ADDRESS / MINIO_REGION）串联，对外只暴露 19530（gRPC）与 9091（健康）两个端口；
- **集合字段类型按规则定**：主键用 VarChar 业务字符串 id；`vector` 的 `dim` 必须与 embedding 模型输出维度严格一致（1024）；标量字段随向量一起存，检索命中直接带原文；tags 用 Array 数组字段表达"多个值"；
- **查询前必须 loadCollection**：数据在对象存储上，load 把数据和索引加载进内存才能检索；先 load 后 insert 合法（Milvus 支持增量加载），生产更常见 insert→index→load；
- **IVF_FLAT + COSINE + nlist=1024**：倒排文件索引是入门最稳选择，余弦度量适合文本语义，nlist 聚类中心数配查询参数 nprobe 平衡精度与耗时；
- **数据入库 = 标量 + 向量**：OpenAIEmbeddings 从 .env 读配置、embedQuery 逐条向量化，Promise.all 并行组装 `{ ...diary, vector }`，insert 用 insert_cnt 确认写入条数。

## 引用说明

- 基于第六十五天学习笔记（git 提交号 `3104f16`）：
  - `E:/WROKSPACE/backend/docker/milvus-docker/readme.md`（Milvus 安装说明）——`3104f16`；
  - `E:/WROKSPACE/backend/docker/milvus-docker/index.mjs`（连接 / createCollection / createIndex / loadCollection / embedding 生成 / insert）——`3104f16`；
  - `E:/WROKSPACE/backend/docker/milvus-docker/milvus-standalone-docker-compose.yml`（etcd + minio + standalone 三服务 compose）——`3104f16`。
- 素材说明：v054（Milvus 与 RAG / Embedding / ANN 原理）与 v055（EPUB→RAG 全链路，含 collection 生命周期与 IVF_FLAT 调优）已讲过向量检索的理论体系与 RAG 工程，本篇是**从 0 用 docker compose 部署 Milvus standalone + 最新 SDK（@zilliz/milvus2-sdk-node v3.0.4）建"AI 日记本"集合到数据入库**的落地线，覆盖 v054/v055 未展开的部署与字段建模细节；检索（query）代码不在本次提交内，只作为下一步提及。不登记 package.json / package-lock.json / volumes 运行时数据 / .env（含密钥，不入库）；`volumes/` 目录为 Milvus 运行时数据被误提交进 git，已按"非讲解价值文件"跳过，另见提交时提醒。
