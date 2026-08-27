# v078 博客大纲

**标题**：单词数据入库与多端学习应用：脚本化清洗、drizzle 建表，与两项目共库的迁移隔离
**日期**：2026-08-27
**目标平台**：稀土掘金（juejin.cn）
**学习笔记**：第六十六天（danci 单词后台 + H5 多端应用，E:\ai-coding\danci，git 短提交号 447988b / d301b13 / c68eb6a / 341db6c / ace6c40；侧重点数据导入、drizzle 建表与迁移、单词书 CRUD、多端架构、H5 学习进度表）

## 结构

| 章节 | 内容 | 来源 |
| --- | --- | --- |
| 引言 | 开门见山：一条单词数据从本地 JSON 文件到多端应用"能查、能背、能续学"的五个环节；三个技术核心（脚本化导入、schema 建表、共库迁移隔离兼容） | 今日五笔提交综合 |
| 一、数据导入 | 178KB 单词 JSON 不进模型上下文，让 AI 写 json2csv 脚本本地转 csv/sql；words 表 content 用 json 列整块存词条；parseRecords 括号配对解析器（JSON.parse 兜底、depth/字符串状态、行号警告）；escapeCsv 引号转义 + BOM 让 Excel 识别 UTF-8 | danci-admin/scripts/json2csv.mjs、danci-admin/lib/schema.ts（words）、temp CSV 样例、README（数据清洗段） |
| 二、drizzle 建表 | words 用 json 列、books 用数组列（tags text[] 默认 '{}'）；book_id 业务唯一键与 uuid 主键分离、word_count 冗余统计字段；迁移 SQL 与 schema 逐字段对应 | danci-admin/lib/schema.ts（words/books）、danci-admin/drizzle/0001_striped_killraven.sql |
| 三、单词书 CRUD | lib/books.ts：bookFields 投影、parseTags 拆分、parseBookPayload 校验（title/bookId 必填、wordCount 非负整数、coverUrl 空转 null）；POST 409 去重、PATCH 排除自身去重、DELETE 事务"先删书再删词"补级联语义；前端搜索/分页（每页5）/Dialog/AlertDialog/原生 img | danci-admin/lib/books.ts、app/api/books/route.ts、app/api/books/[id]/route.ts、app/books/books.tsx |
| 四、多端架构与 H5 | 四端表格（PC 网页/SEO、H5 手机网页、客户端 RN·Flutter、桌面端 Electron C/S）；H5 用 nextjs 模板起步、新项目开新对话窗口（clear/compact 上下文）；H5 页面骨架（首页/学习/详情/我的 + 底部 Tab + AuthModal），当前用 mock 数据 + localStorage 存进度 | README（多端/h5 web 应用段）、nextjs-typescript-starter app 页面、lib/mock-data.ts、components/app-shell.tsx、wordly-ui.tsx |
| 五、学习进度表 | user_learning_progress：联合唯一 (user_id, book_id)、current_word_id 语义="最近一次已完成"、learned_count/completed 分工、双索引对应两条查询路径、外键策略（book_id 级联、user_id 依认证表主键） | nextjs-typescript-starter/app/schema.ts、drizzle/0001_known_miracleman.sql、docs/design.md 第 4、5 节 |
| 六、共库迁移工程 | 两项目共用一个 Supabase；drizzle.config.ts 迁移表/schema 独立（__h5_migrations + h5_drizzle）避免迁移链互相污染；0000 迁移 CREATE TABLE IF NOT EXISTS + DO 块 EXCEPTION duplicate_object 兼容已有表/数据；0001 迁移只建新表不动 books/words；design.md 12.1/12.2 迁移步骤与要求；proposal/design 文档即"prompt 颗粒度"上下文 | nextjs-typescript-starter/drizzle.config.ts、drizzle/0000_complex_screwball.sql、drizzle/0001_known_miracleman.sql、docs/proposal.md、docs/design.md、README（Prompt 颗粒度段） |
| 面试问答 | 大文件脚本化导入、括号配对解析器、json 列/数组列、新增与更新去重区别、无外键时事务级联 vs on delete cascade、四端架构、联合唯一与 current_word_id 语义、共库迁移隔离、IF NOT EXISTS/DO 块兼容、文档与 prompt 颗粒度 | 综合 |
| 结语 | 从 178KB 文件到一张进度表的链路图 + 检查清单 | 综合 |

## 核心结论

- **大文件不喂模型上下文**：178KB 单词 JSON 让 AI 生成 json2csv 脚本本地转换，AI 只写"怎么做"的代码，token 开销差几个数量级；括号配对解析器用 depth 计数 + 字符串状态扫描，兼容对象/数组/逗号分隔/换行分隔等多种 JSON 形态；
- **列类型跟着数据形态走**：一大坨结构化词条用 `json` 列整块存，一组标签用 `text[]` 数组列，业务唯一键 `book_id` 与 uuid 主键分离；schema 声明与迁移 SQL 逐字段对应；
- **CRUD 的三处关键决策**：载荷在校验层收紧（parseBookPayload）、去重靠数据库唯一键双保险（PATCH 排除自身）、`words` 表没有外键就用事务"删书 + 删词"补上级联语义；
- **多端架构各端就位**：PC 后台 / H5 手机网页 / 客户端（RN·Flutter）/ 桌面端（Electron C/S）；H5 用模板起步、新项目开新对话窗口保持上下文干净；
- **学习进度表把规则钉进数据库**：联合唯一 `(user_id, book_id)` 保证一人一书记录唯一，`current_word_id` 语义固定为"最近一次已完成"让续学逻辑免猜，双索引跟查询走；
- **共库迁移隔离 + 兼容**：独立迁移表/schema（`__h5_migrations` + `h5_drizzle`）避免两条迁移链互相污染；`IF NOT EXISTS` + `DO $$ EXCEPTION duplicate_object` 兼容已存在的模板表和已有数据；文档（proposal/design）把规则写清楚，模型写代码不靠猜。

## 引用说明

- 基于第六十六天学习笔记（E:\ai-coding\danci，git 提交号 447988b → d301b13 → c68eb6a → 341db6c → ace6c40）：
  - `E:/ai-coding/danci/README.md`（数据清洗/words 表/多端/h5 web 应用/Prompt 颗粒度/cascade 概念）——`c68eb6a`（今日最终态）；
  - `E:/ai-coding/danci/danci-admin/scripts/json2csv.mjs`（json→csv 转换脚本、括号配对解析器、BOM）——`447988b`；
  - `E:/ai-coding/danci/danci-admin/lib/schema.ts`（words json 列、books 数组列与唯一键）——`d301b13`；
  - `E:/ai-coding/danci/danci-admin/lib/books.ts`（bookFields、parseTags、parseBookPayload 校验）——`d301b13`；
  - `E:/ai-coding/danci/danci-admin/app/api/books/route.ts`（GET 列表、POST 409 去重）——`d301b13`；
  - `E:/ai-coding/danci/danci-admin/app/api/books/[id]/route.ts`（PATCH 排除自身去重、DELETE 事务级联删除）——`d301b13`；
  - `E:/ai-coding/danci/danci-admin/app/books/books.tsx`（搜索/分页/Dialog/AlertDialog/原生 img 封面）——`d301b13`；
  - `E:/ai-coding/danci/danci-admin/drizzle/0001_striped_killraven.sql`（books 表迁移 SQL）——`d301b13`；
  - `E:/ai-coding/danci/nextjs-typescript-starter/app/schema.ts`（User/books/words 映射 + user_learning_progress 新建）——`ace6c40`；
  - `E:/ai-coding/danci/nextjs-typescript-starter/app/db.ts`（postgres-js + drizzle 连接、getUser/createUser + bcrypt）——`ace6c40`；
  - `E:/ai-coding/danci/nextjs-typescript-starter/drizzle.config.ts`（共库迁移隔离配置）——`ace6c40`；
  - `E:/ai-coding/danci/nextjs-typescript-starter/drizzle/0000_complex_screwball.sql`（IF NOT EXISTS + DO 块兼容已有 User 表）——`ace6c40`；
  - `E:/ai-coding/danci/nextjs-typescript-starter/drizzle/0001_known_miracleman.sql`（仅建 user_learning_progress + 索引）——`ace6c40`；
  - `E:/ai-coding/danci/nextjs-typescript-starter/docs/proposal.md`（H5 需求文档）——`341db6c`；
  - `E:/ai-coding/danci/nextjs-typescript-starter/docs/design.md`（连接配置、现有表、进度表设计、迁移步骤与要求）——`341db6c`。
- 素材说明：v077 已讲后台认证权限（事务锁初始化、会话令牌哈希、四道保护规则），本篇是**数据导入 + 建表/迁移 + 多端 H5 应用**这条新线，与昨日不重叠；H5 的页面层（app/books、app/my、components、lib/mock-data.ts）当前为仓库**未提交状态**，博客如实描述其 mock 数据 + localStorage 进度的骨架，但 coverage.json / manifest 只登记有 git 提交号的源码；跳过 package.json / globals.css / auth 模板脚手架等非讲解价值文件。
