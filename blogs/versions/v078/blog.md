# 单词数据入库与多端学习应用：脚本化清洗、drizzle 建表，与两项目共库的迁移隔离

第六十六天（2026-08-27）在 danci 项目里一口气推进了五个环节：从 GitHub 下载的 178KB 单词 JSON 被导入数据库、后台系统做完了单词书的完整增删改查、项目明确了 PC / H5 / 客户端 / 桌面端四端架构并初始化了 H5 学习应用、为 H5 应用设计了"用户学习进度"表，还补了两份需求与设计文档。把它们串起来的是一条主线——**一条单词数据，怎么从本地文件变成多端应用里"能查、能背、能续学"的产品**。围绕这条主线有三个技术核心：**数据导入靠"让 AI 写转换脚本"，而不是把大文件喂进模型上下文；建表靠 drizzle 的 schema 声明，同一套 ORM 下既有 json 大字段列、也有数组列、还有"只映射不动表"的已存在表；两个项目共用一个数据库时，迁移要隔离、更要兼容已有的表和数据**。这篇文章按落地顺序讲：先看数据怎么进库，再看表和 CRUD，然后是四端架构与 H5 应用，最后落到一张学习进度表和它背后的迁移工程。

---

## 一、数据导入：让 AI 写脚本，而不是把 178KB 喂进上下文

单词数据的源头是 GitHub 上一个高星的单词资料库，下载解压后得到一个 **178KB 的 JSON 文件**。要把它变成应用能用的数据，第一步是建表导入。drizzle 的 schema 里先声明 `words` 表——注意 `content` 这一列的类型是 `json`：

```ts
export const words = pgTable("words", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  wordRank: integer("wordRank"),
  headWord: text("headWord"),
  content: json("content"),
  bookId: text("bookId"),
});
```

一个单词除了拼写之外，还有音标、中文释义、英文释义、例句、同近义词、同根词、记忆法等一大坨信息。把它们拆成几十个字段不值得，所以用一个 `json` 列**整块存**。看实际数据（`PEPXiaoXue3_1.csv` 的一行），`content` 里是一个完整的词条对象：

```json
{
  "word": {
    "wordHead": "ruler",
    "wordId": "PEPXiaoXue3_1_1",
    "content": {
      "usphone": "'rulɚ", "ukphone": "'ruːlə",
      "sentence": { "sentences": [{ "sContent": "a 12-inch ruler", "sCn": "一把12英寸的尺子" }], "desc": "例句" },
      "syno": { "synos": [{ "pos": "n", "tran": "[计量]尺；统治者", "hwds": [{ "w": "governor" }] }], "desc": "同近" },
      "relWord": { "rels": [{ "pos": "adj", "words": [{ "hwd": "ruling", "tran": "统治的" }] }], "desc": "同根" },
      "remMethod": { "val": "没有规矩(rule)，不成方圆", "desc": "记忆" },
      "trans": [{ "tranCn": "尺子", "tranOther": "a long flat straight piece of plastic..." }]
    }
  }
}
```

建好表之后，怎么把这个 178KB 的文件塞进去？笔记点破了一个很关键的取舍：

> ai 上下文 #json 转成 csv 格式，字段... 178kb token开销大；ai 写一段格式转换脚本(开销小)，本地运行。

**不要把 178KB 原文喂给 AI 让它转格式**——那会烧掉海量 token。正确做法是**让 AI 生成一段体积很小的转换脚本，在本地把 json 转成 csv / sql，再把产物导入数据库**。AI 只负责写"怎么做"的几十行代码，不消费大文件本身，成本差几个数量级。这就是 `scripts/json2csv.mjs` 的由来。脚本本身有两个值得拆开看的点。

**1. 一个"括号配对"的解析器，兼容多种 JSON 形态。** 下载的 JSON 可能是标准数组，也可能是"逗号分隔的多个对象"、"纯换行分隔的多个对象"这类不严格格式。`parseRecords` 先试 `JSON.parse`，失败就退化成手动扫描：用一个 `depth` 计数器在遇到 `{`/`}` 时加减，`depth === 0` 时切出完整对象；同时维护 `inString` 和 `escaped` 状态，保证大括号出现在字符串里（比如例句里的 `{}`）时不会误判：

```js
function parseRecords(text) {
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch { /* 忽略，使用括号配对方式提取顶层对象 */ }

  const records = [];
  let depth = 0, start = -1, inString = false, escaped = false, lineNumber = 1;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === "\n") lineNumber += 1;
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') { inString = true; continue; }
    if (char === "{") {
      if (depth === 0) start = i;
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        try { records.push(JSON.parse(text.slice(start, i + 1))); }
        catch { console.warn(`跳过无法解析的对象（结束于第 ${lineNumber} 行）`); }
        start = -1;
      }
    }
  }
  return records;
}
```

**2. CSV 的转义与 BOM。** `content` 是 JSON 字符串，里面一定含双引号和逗号，所以每个单元格都要用 `escapeCsv` 包一层引号、内部引号翻倍；最后在文件头加 `﻿`（BOM），让 Excel 打开 UTF-8 的 CSV 不会乱码：

```js
const escapeCsv = (value) => `"${String(value).replaceAll('"', '""')}"`;
const header = ["wordRank", "headWord", "content", "bookId"];
const csv = "﻿" + [header.map(escapeCsv).join(","), ...rows].join("\r\n");
```

脚本从命令行参数读输入路径（默认 `temp/PEPXiaoXue3_1.json`），在同目录产出同名 `.csv`。**"大文件 = 让模型生成处理它的代码，而不是把文件塞进上下文"**，这个原则处理任何大体积数据都适用。

---

## 二、drizzle 的建表：words 用 json 列，books 用数组列

同一个 schema 文件里，`books` 表展示了另一种列类型——`tags` 是 PostgreSQL 的 `text[]` **数组列**：

```ts
export const books = pgTable("books", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookId: text("book_id").notNull().unique(),
  title: text("title").notNull(),
  wordCount: integer("word_count").notNull().default(0),
  coverUrl: text("cover_url"),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

几个设计点：

- **`book_id` 是业务唯一键**：一本书有稳定的业务 ID（如 `PEPXiaoXue3_1`），`words.bookId` 通过它关联到书。主键仍是 `uuid`，业务 ID 和主键分离；
- **`tags` 用数组列而不是逗号分隔字符串**：标签本身就是一组值，"存多个值"这种形态交给数据库的数组类型，查询、更新都比字符串拼接干净；默认值是 `'{}'::text[]`（空数组）；
- **`word_count` 是冗余统计字段**：默认 0，由业务在维护时更新，避免每次统计都要 `count(*)`。

这张表的迁移 SQL（`drizzle/0001_striped_killraven.sql`）和 schema 声明逐字段对应——`uuid PRIMARY KEY DEFAULT gen_random_uuid()`、`book_id UNIQUE`、`tags text[] DEFAULT '{}'::text[] NOT NULL`。**drizzle 的"schema 即建表"在两张形态不同的表上都成立**：建表环节从"手写 CREATE TABLE"变成了"声明对象 + 跑迁移"，列类型则跟着数据的真实形态走——一大坨结构化内容用 `json`，一组有限取值用数组，一个账号一条记录用普通标量列。

---

## 三、单词书管理：应用层校验、去重，与事务级联删除

后台系统的第一个业务模块是单词书管理：列表、新增、编辑、删除。数据落在 `books` 表，接口在 `app/api/books/*`，校验逻辑收敛在 `lib/books.ts`。

**1. 载荷解析与校验。** `parseBookPayload` 把前端传来的任意 body 收紧成结构化的 `BookPayload`：`title`、`bookId` 去空格后必须非空，`wordCount` 必须是非负整数，`coverUrl` 为空串转 `null`；`tags` 支持中文逗号/英文逗号拆分、去重、去空白：

```ts
export function parseBookPayload(body: unknown): BookPayload | null {
  if (typeof body !== "object" || body === null) return null;
  const record = body as Record<string, unknown>;
  const title = typeof record.title === "string" ? record.title.trim() : "";
  const bookId = typeof record.bookId === "string" ? record.bookId.trim() : "";
  const wordCount = Number(record.wordCount);
  const coverUrl = typeof record.coverUrl === "string" && record.coverUrl.trim() ? record.coverUrl.trim() : null;
  if (!title || !bookId || !Number.isInteger(wordCount) || wordCount < 0) return null;
  return { title, bookId, wordCount, coverUrl, tags: parseTags(record.tags) };
}
```

**2. 新增与去重。** POST 先查一遍 `book_id` 是否已存在，存在就回 `409`；通过则插入并 `returning` 回显：

```ts
const duplicate = await db.select({ id: books.id }).from(books).where(eq(books.bookId, payload.bookId)).limit(1);
if (duplicate.length) return NextResponse.json({ error: "该 bookId 已存在" }, { status: 409 });
const [book] = await db.insert(books).values(payload).returning(bookFields);
```

**3. 编辑时去重要排除自己。** PATCH 更新 `book_id` 时，"查有没有重复"必须把当前记录排除在外，否则改别的字段也会因为"和自己是同一个 book_id"误判重复：

```ts
const duplicate = await db.select({ id: books.id }).from(books)
  .where(and(eq(books.bookId, payload.bookId), ne(books.id, id))).limit(1);
```

**4. 删除用事务，应用层做"级联"。** 这是最值得看的一段。`words.bookId` 只是普通文本列，**没有数据库外键**，所以删一本书时，它下面的单词不会自动消失。DELETE 用一个事务保证"删书 + 删词"原子完成——要么都成功，要么都不成功：

```ts
const deleted = await db.transaction(async (tx) => {
  const [book] = await tx.delete(books).where(eq(books.id, id)).returning({ id: books.id, bookId: books.bookId });
  if (!book) return null;
  await tx.delete(words).where(eq(words.bookId, book.bookId));
  return book;
});
```

这里有两个层次的理解：**为什么是级联**——单词和书的从属关系是"书删了词就没意义了"，语义上就该级联；**为什么用应用层事务**——`words` 表没有 `on delete cascade` 外键，数据库没法自动级联，那就把"删主表 + 删关联表"放进一个事务，用代码补上外键本该做的事。笔记里"cascade 级联删除：外键说明后面加上 `on delete cascade`"讲的是数据库外键的做法（后面 H5 侧的学习进度表就会真正用上），而这里展示的是**没有外键时用事务达成同样的语义**。前端 `books.tsx` 同样把"删除后果"写清楚了：删除确认弹窗里提示"该书中 N 个单词将一并删除，此操作不可撤销"。

前端模块完整走了一遍 shadcn 组件：搜索框过滤书名或 bookId、分页（每页 5 条）、`Dialog` 做新增/编辑表单、`AlertDialog` 做删除确认；封面因为 `next/image` 需要预配置域名，改用了原生 `<img>`。**校验在接口层收紧、去重在数据库唯一键上双保险、级联删除在事务里补上**，一个 CRUD 模块的三处关键决策就这么定下来了。

---

## 四、多端架构与 H5 应用的定位

后台系统做完，项目进入了第二阶段：**多端**。笔记里画出了四端形态：

| 端 | 技术形态 | 定位 |
| --- | --- | --- |
| PC 端 | 网页（SEO） | 办公场景，即已完成的 danci-admin 后台 |
| H5 手机网页端 | 移动端网页 | 用户碎片时间背单词 |
| 客户端 | Android / iOS，React Native / Flutter | 原生体验 |
| 桌面端 | C/S 架构，Electron | 桌面应用 |

一天内不可能四端全做，笔记给的推进顺序是"**用 nextjs 模版起步，不用从 0 开始开发**"。于是第六十六天初始化了 H5 学习应用（`nextjs-typescript-starter`）——一个基于 `vercel/nextjs-postgres-auth-starter` 的模板项目，自带 NextAuth 邮箱密码登录、Drizzle、Postgres 连接。这里有一个很实用的工程习惯值得记下：

> 新项目，重新启动新的对话窗口；clear/compact 上下文。

**新项目开新对话**，是为了让新项目的上下文干净（clear/compact），不被旧项目（后台）的历史对话污染。这和后文"文档 + prompt 颗粒度"是同一件事的两个面：上下文要么精简，要么写清楚。

H5 应用的页面骨架在 `app/` 下成型：首页（未登录隐藏"最近学习"、展示全部单词书）、学习页（进入后从上次位置继续）、单词详情页（音标、例句、同近义词、同根词、记忆法分区展示）、我的（登录态展示账户与进度、未登录引导登录）。底部 Tab 切换首页/我的，登录用 `AuthModal` 双 Tab（登录/注册）。当前阶段数据来自 `lib/mock-data.ts` 的三本单词书和 7 个示例单词，进度存在 `localStorage`（`wordly_progress`）——**先把页面和数据流跑通，再接真实数据库**，是典型的先骨架后接线的开发顺序。

---

## 五、学习进度表：联合唯一约束，与"最近已完成单词"的语义

H5 应用要回答一个产品问题：**用户背到哪了，下次打开怎么继续**。答案是一张新表 `user_learning_progress`，它在 H5 侧的 schema（`app/schema.ts`）里定义，也是本次真正的建表迁移：

```ts
export const userLearningProgress = pgTable(
  'user_learning_progress',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: integer('user_id').notNull(),
    bookId: text('book_id').notNull(),
    currentWordId: bigint('current_word_id', { mode: 'number' }),
    learnedCount: integer('learned_count').notNull().default(0),
    completed: boolean('completed').notNull().default(false),
    lastStudiedAt: timestamp('last_studied_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('user_learning_progress_user_book_unique').on(table.userId, table.bookId),
    index('user_learning_progress_user_recent_idx').on(table.userId, table.lastStudiedAt),
    index('user_learning_progress_book_idx').on(table.bookId),
  ],
);
```

**1. `(user_id, book_id)` 联合唯一：一个用户一本书只允许一条进度。** 这是整张表的数据约束核心。没有它，"每个用户每本书一条进度"就只是口头约定，重复插入会制造出同一条进度互相打架的记录。联合唯一键把这条规则钉死在数据库层。

**2. `current_word_id` 的语义必须固定为"最近一次已完成的单词"。** 技术文档里专门强调：它是"用户最近一次点击'下一个'之后完成学习的那个单词"，**不是当前正在展示、但还没点'下一个'的单词**。为什么这么较真？因为"续学"的实现是"找到 `current_word_id` 对应单词、取它在当前单词书里的**下一个** `wordRank`"。如果语义模糊成"当前正在看的"，那么"用户看到了第 5 个但没点继续"和"点完了第 5 个"会指向同一个位置，续学逻辑就乱了。**一个字段的语义定义清楚，下游逻辑才不需要猜测**——这是表设计里最容易忽略、却最能避免 bug 的一点。

**3. `learned_count` 与 `completed` 分工。** `learned_count` 是累计完成数（幂等：重复提交同一单词不重复增加），`completed` 是整本学完的布尔标记（最后一个单词推进后置 `true`），重置学习时两者一起归零。**累计值和"是否完成"分开存**，比用一个"已学数量是否等于总数"的推断更直接、也更抗并发。

**4. 两个索引对应两条查询路径。** `(user_id, last_studied_at)` 服务"首页展示最近学习的单词书"，`book_id` 服务"进入某本书时查进度"。**索引跟着查走走**——哪些查询高频，就在哪些列上建索引。

**5. 外键策略：能级联的级联，不能确定的先不做。** 技术文档（`design.md` 4.4 节）给出推荐：`book_id` 加外键指向 `books(book_id)`，`on update cascade on delete cascade`——**书删了，所有用户对它的进度记录跟着级联删除**，这正是笔记里"cascade 级联删除：外键说明后面加上 `on delete cascade`"落地的位置；而 `user_id` 是否加外键取决于认证用户表（模板的 `"User"` 表）最终确认的主键类型——**主键不是 integer 时，`user_id` 类型要跟着改，不能依赖隐式转换**。能确定的约束先定死，依赖未知信息的约束留到确认后再补，是"逐步收紧"的正确姿态。

---

## 六、共库迁移的工程细节：隔离与兼容

`nextjs-typescript-starter` 和 `danci-admin` **共用同一个 Supabase 数据库**——后台的 `books`、`words` 表已经建在库里，H5 应用要复用它们。这带来两个工程问题：**两条迁移链不能互相污染；新迁移不能破坏已存在的表和已有数据**。

**1. 迁移记录隔离。** drizzle 默认把迁移历史记在表里的固定位置，两个项目如果各自 `migrate`，会互相覆盖对方的迁移记录。`drizzle.config.ts` 的解法是让 H5 项目的迁移记录落在**独立的迁移表 + 独立的 schema**：

```ts
export default defineConfig({
  dialect: 'postgresql',
  schema: './app/schema.ts',
  out: './drizzle',
  // 与 danci-admin 共用一个数据库，迁移记录使用独立 schema，避免迁移链互相污染
  migrations: {
    table: '__h5_migrations',
    schema: 'h5_drizzle',
  },
  dbCredentials: { url: process.env.POSTGRES_URL! },
});
```

H5 的迁移历史写进 `h5_drizzle.__h5_migrations`，后台的迁移历史留在它自己的位置，**两条迁移链各记各的账，互不干扰**。

**2. 兼容已存在的表和数据。** 第一个迁移（`0000_complex_screwball.sql`）面对的情况是：认证用的 `"User"` 表**可能已经被模板运行时创建过**，里面甚至可能有用户数据。所以它不能简单 `CREATE TABLE`（会报"已存在"），也不能重建（会丢数据），而是：

```sql
CREATE TABLE IF NOT EXISTS "User" (
  "id" serial PRIMARY KEY NOT NULL,
  "email" varchar(64),
  "password" varchar(64)
);
--> statement-breakpoint
DO $$
BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_email_unique" UNIQUE ("email");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
```

`CREATE TABLE IF NOT EXISTS` 幂等建表；唯一约束用 `DO $$ ... EXCEPTION WHEN duplicate_object` 包裹——**约束已经存在就静默跳过，而不是报错中断迁移**。第二个迁移（`0001_known_miracleman.sql`）更克制：注释写明"books、words 表已存在于数据库中，此迁移仅创建 user_learning_progress"，只建新表 + 两个索引，**不重复创建、不修改已有单词数据**。

**3. 文档把规则写清楚。** 第六十六天还补了两份文档：`docs/proposal.md`（需求文档：项目目标、页面与路由、线框、接口需求、关键业务流程）和 `docs/design.md`（技术设计：连接配置、现有表结构、学习进度表设计、API 设计、迁移步骤与要求、测试设计）。`design.md` 12.1 给出迁移步骤（确认现有表 → 确认认证表 → 建进度表 → 建索引 → 补外键 → 更新 schema → 生成并执行迁移 → 测试账号验证），12.2 给出迁移要求（不重复创建 `books`/`words`、不修改已有数据、执行前检查表和约束是否存在、生产前备份、迁移文件入库而非只在控制台手工执行）。这就是笔记里"Prompt 颗粒度"的具体实践：

> 规则或规范，表单字段，业务场景，功能描述，详细表达，不能让 llm 去猜；llm 擅长的，比如生成代码，让它去跑。

**把数据表、技术架构、字段规则写进文档给模型当上下文，模型就不用靠猜来写代码。** 这同时回答了"为什么共库迁移要这么小心"——因为约束和风险都被写清楚了，迁移就是照着清单执行，而不是临场拍脑袋。

---

## 面试问答

**问：178KB 的单词 JSON 为什么不直接喂给 AI 让它转成导入格式？**

> 因为 178KB 进模型上下文，token 开销太大。正确做法是让 AI 生成一段体积很小的格式转换脚本，本地运行脚本把 json 转成 csv / sql，再把产物导入数据库。AI 只写"怎么做"的几十行代码，不消费大文件本身，成本差几个数量级。"大文件 = 生成处理它的代码，而不是把它塞进上下文"是通用原则。

**问：`scripts/json2csv.mjs` 里的"括号配对解析器"解决什么问题？**

> 下载的 JSON 可能不是严格的标准数组格式，可能是"逗号分隔的多个对象""纯换行分隔的多个对象"。解析器先用 `JSON.parse`，失败就退化成手动扫描：用 `depth` 计数器在 `{`/`}` 处加减，`depth === 0` 时切出完整对象；同时维护字符串/转义状态，保证例句里的 `{}` 不会误判为对象边界。切出的片段仍用 `JSON.parse` 校验，失败就按行号警告跳过。

**问：`words` 表为什么用 `json` 列存 `content`？**

> 一个单词的音标、中英释义、例句、同近义词、同根词、记忆法是一大坨结构化信息，拆成几十个字段既繁琐又不灵活。`json` 列允许整块存一个词条对象，读取时按需取字段，数据的天然形态和列类型一致。`content` 列里就是上面那串带 `wordHead`/`sentence`/`syno`/`relWord`/`remMethod`/`trans` 的完整对象。

**问：`books.tags` 为什么用 `text[]` 数组列而不是逗号分隔字符串？**

> 标签本身就是一组值。"存多个值"这种形态交给数据库的数组类型，比字符串拼接干净：不用自己 split/join、语义明确，默认值直接是空数组 `'{}'::text[]`。数组列和 `json` 列一样，都是"列类型跟着数据的真实形态走"。

**问：单词书的 POST 和 PATCH 都做 bookId 去重，两者有什么区别？**

> POST 直接查 `book_id` 是否已存在，存在回 409。PATCH 是更新已有记录，去重查询必须**排除当前记录自己**（`and(eq(bookId, payload.bookId), ne(id, id))`），否则改个无关字段也会因为"和自己是同一个 bookId"误判重复。新增去重和更新去重，差一个排除自身的条件。

**问：删除单词书为什么用事务？`words` 表没有外键，级联怎么实现？**

> `words.bookId` 只是普通文本列，没有 `on delete cascade` 外键，删书时单词不会自动消失。所以 DELETE 用一个事务把"删 books 行 + 按 bookId 删关联 words 行"包在一起，要么都成功要么都不成功，用代码补上外键本该做的事。这也是"没有外键时用事务达成级联语义"的典型写法；真正有外键的地方（H5 学习进度表的 `book_id`）就可以直接 `on delete cascade`。

**问：`user_learning_progress` 表的联合唯一约束 `(user_id, book_id)` 解决什么问题？**

> 约束"每个用户对每本书只有一条进度记录"。没有它，这条规则只是口头约定，重复插入会产生多条进度互相打架。联合唯一键把规则钉死在数据库层，违反时数据库直接拒绝。

**问：`current_word_id` 为什么语义必须是"最近一次已完成学习的单词"，而不是当前展示的单词？**

> 因为续学逻辑是"找到该单词、取它在书里的下一个 `wordRank`"。如果语义模糊成"当前正在看的"，"看到了第 5 个但没点继续"和"点完了第 5 个"会指向同一个位置，续学就会跳过或重复单词。字段语义定义清楚，下游逻辑才不需要猜测。

**问：两个项目共用一个数据库，迁移为什么会互相污染？怎么隔离？**

> drizzle 默认把迁移历史记在迁移表里，两个项目各自 migrate 会覆盖对方的历史记录，导致状态错乱。隔离做法是在 `drizzle.config.ts` 里给迁移记录指定独立的表和 schema（`migrations: { table: '__h5_migrations', schema: 'h5_drizzle' }`），H5 的迁移账本和后台的分开记，互不干扰。

**问：第一个迁移里 `CREATE TABLE IF NOT EXISTS` 和 `DO $$ ... EXCEPTION WHEN duplicate_object` 分别防什么？**

> `"User"` 表可能已被模板运行时创建、里面还有数据，`CREATE TABLE IF NOT EXISTS` 保证幂等建表不报"已存在"；唯一约束用 DO 块包一层，约束已存在时 `WHEN duplicate_object` 捕获异常静默跳过，而不是中断整个迁移。目的是兼容已存在的表和已有数据，而不是重建。

**问：需求文档和技术文档在"prompt 颗粒度"里扮演什么角色？**

> 把规则、表单字段、业务场景、功能描述写详细，让模型不用猜；把数据表、技术架构写清楚，模型写代码就有据可依。`proposal.md` 管"要什么"（需求、页面、线框、接口），`design.md` 管"怎么做"（表结构、外键策略、API、迁移步骤、测试）。模型擅长的生成代码让它去跑，需要准确清晰的上下文则用文档喂足——这就是"prompt 颗粒度"的两面。

---

## 结语：从 178KB 文件到多端应用里的一张进度表

第六十六天，danci 项目从"数据在文件里"推进到了"用户在多端应用里能背、能续学"，核心链路是：

```text
数据导入   178KB JSON → 让 AI 写 json2csv 脚本本地转换 → words 表（content 用 json 列）
建表       同一 schema：words 用 json 列、books 用数组列、book_id 唯一键
后台 CRUD   载荷校验（parseBookPayload）→ 409 去重（PATCH 排除自身）→ 事务级联删除
多端架构   PC 后台 / H5 网页 / 客户端（RN·Flutter）/ 桌面端（Electron），H5 用模板起步
学习进度   user_learning_progress：联合唯一 (user_id, book_id) + current_word_id 语义 + 双索引
共库迁移   独立迁移表/schema 隔离两条链 + IF NOT EXISTS / DO 块兼容已有表与数据
文档前置   proposal（需求）+ design（技术）把规则写清楚，模型写代码不靠猜
```

动手前，拿这份清单自检：

- [ ] 能否说清"大文件 = 让 AI 生成处理它的代码，而不是喂进上下文"，以及 json2csv 括号配对解析器在防什么？
- [ ] 能否讲出 `words.content` 用 `json` 列、`books.tags` 用 `text[]` 数组列各自的理由？
- [ ] 能否解释新增去重（POST）与更新去重（PATCH 排除自身）的区别？
- [ ] 能否讲清"没有外键时用事务实现级联删除"，和真正的 `on delete cascade` 各自适用的场景？
- [ ] 能否画出四端架构，并说出 H5 应用为什么用模板起步、新项目为什么要开新对话窗口？
- [ ] 能否解释联合唯一 `(user_id, book_id)` 的意义，和 `current_word_id` 语义必须固定为"最近一次已完成"的原因？
- [ ] 能否讲出共库时迁移隔离的做法（独立迁移表 + schema），和兼容已有表/数据的两个迁移技巧？
- [ ] 能否说出需求文档与技术文档在"prompt 颗粒度"中分别管什么？

**这一天的本质，是把"数据形态"逐层翻译成"产品能力"**：json 列接住复杂的词条数据，数组列接住一组标签，联合唯一键接住"一人一书的进度"，事务和级联接住删除语义，独立迁移链接住两个项目共库的协作。每一处都不是魔法，而是**把真实的数据形态和业务规则，落成了数据库和代码里的显式约束**。
