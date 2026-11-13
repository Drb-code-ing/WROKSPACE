# 企业知识库的 PostgreSQL 与 MongoDB 职责

核对日期：2026-11-12。

## 当前材料能够确认什么

- [学习笔记](readme.md#L52-L68)提出 PostgreSQL 保存文档元数据，MongoDB 保存正文，通过 ID 关联。
- [PostgreSQL 初始化脚本](backend/init-scripts/postgresql/init.sql#L1-L26)定义 `kh_document`，包括标题、分类、部门、作者、状态、可见性与 `content_id`。
- 同一脚本的 [AI 会话定义](backend/init-scripts/postgresql/init.sql#L219-L240)已有 `kh_ai_session` 与 `kh_ai_message`；消息正文为 `TEXT`，引用信息为 `JSONB`，并有会话历史查询索引。
- [MongoDB 初始化脚本](backend/init-scripts/mongodb/init.js#L9-L12)建立 `document_content` 集合，注释明确 `_id` 对应 `kh_document.content_id`、`documentId` 对应 `kh_document.id`，并为 `documentId` 建立唯一索引。

上述证据确认存储设计与初始化定义。它们本身不证明跨库文档服务、发布流程与故障补偿已经集成完成。以下真实场景流程和版本方案是架构建议，不是新增的运行验证结论。

## 建议职责

| 组件 | 保存内容 | 主要访问场景 |
| --- | --- | --- |
| PostgreSQL | 用户、角色、权限、文档元数据、审核记录、版本发布状态、会话与消息 | 文档列表筛选、权限判断、发布审核、历史消息分页、业务统计 |
| PostgreSQL / pgvector | 检索片段、向量及其文档和版本关联 | 带业务条件的语义召回；具体片段表和索引仍需实现 |
| MongoDB | 解析正文、富文本块；按需增加 OCR 页块、表格结构、转录段落及定位字段 | 文档详情、正文编辑、解析结果查看、内容转换与分片 |
| MinIO | PDF、Word、原图、音频、视频及衍生媒体对象 | 上传、下载、预览；MongoDB 内容只引用对象标识 |
| Redis | 近期会话上下文和可重建缓存 | 低延迟上下文读取；历史消息从 PostgreSQL 恢复 |
| Mem0 | 用户偏好、经过提炼的长期事实与摘要的管理和召回 | 跨会话个性化；不是完整消息记录，也不是独立数据库产品的同义词 |

Elasticsearch 的全文索引和 Neo4j 的实体关系仍由文档 ID、片段 ID、版本关联到内容；权限与发布状态的权威判断保留在 PostgreSQL。

## 为什么 MongoDB 适合正文，但不是必需

销售列表页需要标题、分类、部门、状态和更新时间，不需要一次加载每篇文章全文。点击装修案例详情时，服务端先在 PostgreSQL 校验权限和有效版本，再读取 MongoDB 对应正文；正文中的施工照片通过受控对象访问取得。

正文如果包含富文本树、OCR 页块、表格单元格、带时间戳的语音段落，不同资料会有不同的嵌套结构。MongoDB 的文档模型可按内容聚合组织这类数据，适合按文档或内容块读取。官方说明嵌入模型能够在一次操作中读取关联内容，并在单文档内执行原子更新，但这不等于跨 PostgreSQL 和 MongoDB 的原子提交。[MongoDB 嵌入建模](https://www.mongodb.com/docs/v8.0/data-modeling/embedding/)

如果正文只是 Markdown 字符串、资料量不大、没有单独扩展需求，PostgreSQL 的独立正文表加 `TEXT` / `JSONB` 也是合理的更简单方案。`JSONB` 支持索引；TOAST 能压缩或将大字段移到行外存储，未改变的行外字段在普通更新时通常可以复用。因此不能仅凭正文达到 KB 或 MB 就断言 PostgreSQL 性能不好，或者 MongoDB 一定更快。[PostgreSQL JSON 类型](https://www.postgresql.org/docs/current/datatype-json.html)、[TOAST](https://www.postgresql.org/docs/current/storage-toast.html)

两库拆分让内容有独立的数据模型和扩展空间，也增加连接、备份、监控、恢复与一致性成本。是否值得应结合正文体积、编辑频率、查询方式和实测决定，不能只为增加技术栈。

## 两条典型业务链路

1. 新建培训文档：PostgreSQL 建立草稿与权限；MinIO 保存原件；后台解析正文写入 MongoDB；分片写入检索索引；对应版本达到可用条件后，由 PostgreSQL 切换有效版本。
2. 销售追问售后政策：PostgreSQL 保存 session/message 及答案引用，Redis 加载近期上下文，Mem0 召回用户长期偏好；检索受 PostgreSQL 中的权限及有效版本约束。MongoDB 仅在需要原文或证据展开时读取，不必每次检索后再取完整正文。

不要让每个 SSE token 都产生一次永久数据库写入。可以在生成完成时落库，或者按明确的分段策略保存；采用哪种方式取决于中断恢复要求。

## 跨库一致性需要明确设计

当前 `document_content.documentId` 唯一索引只表达一篇文档对应一份内容。如果需要草稿、历史版本和旧引用回放，应考虑 `(documentId, version)` 唯一约束，并由 PostgreSQL 保存有效的 `content_id` 和版本。这里的 `version` 是建议字段，现有脚本还没有它。

示例：新内容写入 MongoDB 成功，但 PostgreSQL 的发布事务失败时，新内容应仍不可见；旧版本继续服务，后台重试或清理孤立内容。发布可采用 PostgreSQL 状态记录与 Outbox、按文档版本幂等的处理任务以及失败补偿，不能把一次 PostgreSQL 事务描述成同时提交了 MongoDB。删除、权限变更和跨库备份恢复也需遵守同一文档版本约束。

MongoDB 单个 BSON 文档上限为 16 MiB。长转录、超长文档或不断增长的内容数组应按页、章节或时间段拆分；已有 MinIO 时，原始图片、音视频继续保存到对象存储。[MongoDB 文档限制](https://www.mongodb.com/docs/manual/core/document/)

## 简历表述

> 以 PostgreSQL 管理文档元数据、权限及会话消息，MongoDB 保存解析正文，MinIO 保存原文件与媒体对象，通过文档 ID 关联内容；结合 Redis 会话上下文与 Mem0 用户长期记忆支持连续问答。

这是职责描述，不应附带未经测试的性能提升数字。按完成态组织简历文字与证明功能已集成运行是两件不同的事。
