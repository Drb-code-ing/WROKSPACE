# Next.js 后台的认证与权限防线：首个超级管理员的事务锁初始化、会话令牌哈希，与四道管理员保护规则

一个只给管理员用的后台系统，最要紧的代码往往不是界面，而是两句话的答案：**谁能进得来，谁进来之后能干什么**。第六十五天用 Next.js 16 + supabase + drizzle 从零搭了一个"单词管理后台"（danci-admin），把这两件事落到了一条完整的链路上：supabase 这种 BaaS 数据库让"数据库 + 部署"的开销趋近于零，drizzle ORM 让"建表"变成写一个 TypeScript 对象，而认证和权限则靠三块设计撑起来——**首个账号用数据库事务锁安全地初始化成超级管理员、会话令牌只在 Cookie 里放随机串而数据库只存它的哈希、以及 PATCH 接口里四道"防误操作"的管理员保护规则**。这篇文章按代码落地的顺序讲：先看技术底座和表结构，再拆认证三步（初始化、签发会话、守卫接口），最后讲管理员管理里那些容易被忽略的保护规则，以及数据清洗和组件库怎么把重复劳动交给工具。

---

## 一、技术底座：BaaS 数据库 + ORM，不自己搭服务器、不手写建表 SQL

后台系统的第一块地基是数据。这个项目没有自建 MySQL，也没有自己写建表 SQL，而是用了两样东西把"数据层"的成本压到最低：**supabase** 和 **drizzle**。

**supabase 是云端 BaaS 数据库（Backend as a Service）。** 笔记里的原话是"性能、安全、可扩展性、部署成本几乎为 0"——它提供的是云端的 PostgreSQL 数据库（psql 内嵌 + 关系数据库），还能扩展向量数据库支持。对后台项目来说，这意味着数据库在云端已经建好，本地只需要在 `.env` 里配一行 `DATABASE_URL` 连接字符串，不用自己买机器、配权限、做备份。

**drizzle 是 ORM（对象关系映射）。** ORM 解决的核心问题是"**不用写 SQL、不用做数据库的底层处理**"。看 `lib/db.ts`，整个连接只有几行：

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
export const client = postgres(connectionString, { max: 1 });
export const db = drizzle(client);
```

`postgres` 是驱动，`drizzle(client)` 把连接包装成 `db` 这个**数据库操作句柄**。之后业务代码里 `db.select(...)`、`db.insert(...)` 都是在操作"对象"，由 drizzle 翻译成 SQL。笔记用一句话讲透了 ORM 的映射关系：

> next.js 面向对象编程 Object 高级 —— User；drizzle orm 映射翻译 —— psql User Table 低级。

也就是**高级语言里的 `User` 对象，对应数据库里低级的 `users` 表的一行记录**。对象和记录一一对应，`todo.save()` 就是保存这一行。

drizzle 还配套了一系列命令，构成建表到上线的完整闭环：

- `db:generate`：根据 schema 生成数据库操作代码（加表、改字段、添索引，多一个 schema 文件）；
- `db:migrate`：执行数据库迁移；
- `db:push`：把 schema 推送到云端数据库；
- `db:studio`：数据库可视化工具。

也就是说，"建表"这件事从"手写 `CREATE TABLE` 并手动在云端执行"变成了**在 schema 文件里声明结构，再跑迁移命令**。这正是后面两张表能"对象化"地定义出来的前提。

---

## 二、两张表：`admin-users` 与 `admin-session`，枚举、外键与索引各司其职

后台的权限模型需要两张表：一张存管理员身份，一张存会话。它们在 `lib/schema.ts` 里用 drizzle 的对象写法定义：

```ts
import { index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["super_admin", "content_admin"]);
export const userStatus = pgEnum("user_status", ["active", "disabled"]);

export const users = pgTable("admin-users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull().default("content_admin"),
  status: userStatus("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("admin-session", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("admin_session_user_id_idx").on(table.userId), index("admin_session_expires_at_idx").on(table.expiresAt)]);
```

`admin-users` 表有几个刻意为之的设计：

- **`pgEnum` 定义角色和状态**：`user_role` 只有 `super_admin`（超级管理员）和 `content_admin`（内容管理员）两个取值，`user_status` 只有 `active` / `disabled`。用数据库枚举而不是自由文本，是让"角色、状态这类有限集合"在数据库层面就不能写错——这是约束，不只是约定；
- **`email` 唯一键**：一个邮箱只能注册一个管理员，同时登录时按邮箱查也正好用上这个唯一索引；
- **默认值兜底**：新管理员默认 `content_admin` + `active`——**没有显式声明，就进不了特权**；
- **`passwordHash` 不存密码明文**：这一列放的是 bcrypt 哈希，后面会看到。

`admin-session` 表是会话存储，三个设计对应三种语义：

- `userId` 外键指向 `users.id`，`onDelete: "cascade"`——**管理员被删，它的所有会话级联清空**，这是"删人即下线"的数据库级保证；
- `tokenHash` 是**会话令牌的哈希**（唯一键），后面详解为什么库中存哈希不存令牌本身；
- 给 `userId` 和 `expiresAt` 各建了一个索引——按用户查会话、按过期时间清理会话是两条高频查询路径，索引跟着查走走。

`migrate` 生成的 SQL 里能看到最终落库形态：两个 `CREATE TYPE ... AS ENUM`、两张表、外键 `ON DELETE CASCADE`、两个索引，和 schema 声明一一对应。**对象声明即表结构**，这是 ORM 带给建表环节最直接的收益。

---

## 三、首个账号：事务锁保证"超级管理员只初始化一次"

一个后台总得有第一个管理员。常见做法是注册页面谁都能来，第一个注册的人自动成为超级管理员。但这里藏着一个并发问题：**两个请求同时来注册怎么办？** 如果没有保护，两个人都可能被当成"第一个"，系统就出现了两个超管。

`signup` 路由的解法是用**数据库事务锁**把"初始化"这一动作串行化：

```ts
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createSession, hashPassword, normalizeEmail } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";

export async function POST(request: Request) {
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
    return NextResponse.json({ error: "请填写有效姓名、邮箱和至少 8 位密码" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  const user = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(392017)`);
    const existing = await tx.select({ id: users.id }).from(users).limit(1);
    if (existing.length) return null;
    const [created] = await tx.insert(users).values({ name, email, passwordHash, role: "super_admin" }).returning();
    return created;
  });
  if (!user) return NextResponse.json({ error: "系统已完成初始化，请直接登录" }, { status: 409 });
  await createSession(user.id);
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status } }, { status: 201 });
}
```

关键在事务里的这一句：

```sql
select pg_advisory_xact_lock(392017)
```

`pg_advisory_xact_lock` 是 PostgreSQL 的**咨询锁（advisory lock）**，`392017` 是这个项目约定的锁编号。它的语义是：**同一把咨询锁同时只允许一个事务持有，其他事务必须等它提交或回滚才能拿到**。把"查有没有用户 → 没有就插入"放进同一个事务、并先抢咨询锁，就能保证：

- 两个并发的注册请求，只有一个能拿到锁进入"检查是否已有用户"；
- 拿到锁的那个发现表是空的，插入超级管理员，提交事务；
- 另一个等锁释放后再查，发现已经有用户了，走 `return null` 分支，返回 `409 "系统已完成初始化，请直接登录"`。

**"先检查再写入"这个竞态窗口，被数据库级锁关死了**。如果只用应用层判断"表里有没有人"，两个请求在并发下可能都读到"空"，然后都插入——这就是经典的竞态条件。把决策下沉到数据库事务里，是"只初始化一次"这种一次性逻辑最稳妥的做法。

其余细节同样是安全底线：

- **bcrypt 哈希密码**：`hash(password, 12)`，cost 12 是一个在安全与性能之间折中的强度档位；
- **首个账号的角色显式指定为 `super_admin`**：不依赖 `users` 表的默认值（默认是 `content_admin`），初始化这个场景要的就是"第一个进来的人是最高权限"；
- **前端配合文案**：注册页标题直接写"初始化超级管理员"，副标题"仅系统首个账号可通过此页面创建"——从 UI 上就告诉用户这是单次操作；
- **邮箱规范**：`normalizeEmail` 做了 `trim + toLowerCase`，注册、登录都先归一化，避免 `A@B.com` 和 `a@b.com` 被当成两个账号。

注册成功后再 `createSession(user.id)` 直接建立会话，用户不用二次登录，衔接登录态。

---

## 四、会话令牌：Cookie 里放随机串，数据库里只存它的哈希

初始化之后就是日常登录。这套会话系统在 `lib/auth.ts` 里，先看它怎么**签发**会话：

```ts
export const SESSION_COOKIE = "danci_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function digest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const store = await cookies();
  const currentToken = store.get(SESSION_COOKIE)?.value;
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  await db.transaction(async (tx) => {
    if (currentToken) await tx.delete(sessions).where(eq(sessions.tokenHash, digest(currentToken)));
    await tx.insert(sessions).values({ userId, tokenHash: digest(token), expiresAt });
  });

  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}
```

拆开看，这套"会话令牌"的设计有三个层次：

**1. 令牌本身是随机数，且只出现在 Cookie 里。** `randomBytes(32).toString("base64url")` 生成 32 字节的高熵随机串，作为会话令牌写进 Cookie。它没有任何业务含义，不包含用户 id、不包含过期时间——**令牌就是一把"随机钥匙"，它指向数据库里哪一行会话，由服务端自己查**。这比"把用户信息加密进 token"简单，也比把 token 明明白白存在数据库里安全。

**2. 数据库里只存令牌的 SHA-256 哈希。** `token_hash` 这一列存的不是令牌本身，而是 `digest(token)`。为什么要存哈希？因为**一旦数据库泄露，攻击者拿到的是一堆哈希，而不是能直接用的会话令牌**。数据库（尤其是 BaaS 云数据库）比浏览器端更容易成为泄露面，存哈希就让"盗库"无法直接变现成"盗号"。这也是 OWASP 对服务端会话存储的标准建议。

**3. 单会话策略：新登录挤掉旧登录。** 签发前先看 Cookie 里有没有旧令牌，有就在事务里把它对应的会话行删掉，再插入新的。这样同一个账号**同时只存在一个有效会话**——后登录的踢掉先登录的。对后台管理系统来说，这比"多设备同时在线"更符合安全直觉：管理员换了电脑或密码泄露后重新登录，旧会话立即失效。

Cookie 的属性也各有用意：

- `httpOnly: true`——**JS 读不到这个 Cookie**，XSS 攻击者无法通过脚本偷走会话令牌；
- `sameSite: "lax"`——缓解 CSRF：跨站请求默认不带上这个 Cookie；
- `secure: process.env.NODE_ENV === "production"`——生产环境只允许 HTTPS 传输；
- `maxAge: SESSION_MAX_AGE`——7 天有效期，和数据库里的 `expires_at` 对齐。

**验证**的入口是 `getCurrentUser`——它把"凭令牌查会话"和"凭会话查用户"用一次 JOIN 完成：

```ts
export async function getCurrentUser(): Promise<SafeUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db.select({
    id: users.id, name: users.name, email: users.email, role: users.role, status: users.status,
  }).from(sessions).innerJoin(users, eq(sessions.userId, users.id)).where(and(
    eq(sessions.tokenHash, digest(token)),
    gt(sessions.expiresAt, new Date()),
    eq(users.status, "active"),
  )).limit(1);
  return row ?? null;
}
```

三个条件一次校验：**令牌哈希匹配、会话未过期、账号仍是启用状态**。任何一个不满足，都返回 `null`（视为未登录）。`gt(sessions.expiresAt, new Date())` 是过期检查，`eq(users.status, "active")` 是"账号被停用后立即失效"——**停用一个人，他的会话即使还没过期也立刻查不出用户**，这是权限模型里的"一票否决"。`signout` 则是对应的逆操作：删掉数据库会话行 + 删掉 Cookie。

这里有一个值得记住的取舍：**令牌是随机的，所以服务端必须查数据库才能验证**（无状态验证做不了）。代价是"每个请求一次数据库查询"，换来的是"随时可以精准吊销某一个人的会话"。后台系统的管理员数量级很小，这个代价完全可以接受。

---

## 五、权限守卫与四道保护规则：能删的管理员，恰恰最容易被人删掉

有了登录态，接下来是"谁能调哪个接口"。`lib/api-auth.ts` 把鉴权收敛成一个函数：

```ts
import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function requireApiUser(superAdmin = false) {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "请先登录" }, { status: 401 }) };
  if (superAdmin && user.role !== "super_admin") {
    return { error: NextResponse.json({ error: "没有操作权限" }, { status: 403 }) };
  }
  return { user };
}
```

它把三种状态映射成两种响应：**没登录 → 401"请先登录"；登录了但权限不够（要求超管而你只是内容管理员）→ 403"没有操作权限"**。业务路由开头统一 `const auth = await requireApiUser(true); if (auth.error) return auth.error;`，一行就把"这条路只有超管能走"立住了。`admin-users` 的 GET（列表）和 POST（新增）都这样守卫，只放行超级管理员。

最有意思的部分在 `app/api/admin-users/[id]/route.ts` 的 PATCH——更新一个管理员。它在一个事务里先锁、再查、再算，最后落库，把"防误操作"做成了**四条保护规则**：

```ts
const isSelf = auth.user.id === id;
if (isSelf && existing.role === "super_admin" && role !== "super_admin") return { error: "cannot_demote_self" as const };
if (isSelf && existing.status === "active" && status === "disabled") return { error: "cannot_disable_self" as const };
if (!isSelf && existing.role !== "super_admin" && role === "super_admin") return { error: "cannot_promote" as const };

const removesEnabledSuperAdmin = existing.role === "super_admin" && existing.status === "active" && (role !== "super_admin" || status !== "active");
if (removesEnabledSuperAdmin) {
  const anotherEnabledSuperAdmin = await tx.select({ id: users.id }).from(users).where(and(
    eq(users.role, "super_admin"),
    eq(users.status, "active"),
    ne(users.id, id),
  )).limit(1);
  if (!anotherEnabledSuperAdmin.length) return { error: "last_super_admin" as const };
}
```

这四条规则，每一条都对应一个真实的产品事故场景：

1. **`cannot_demote_self`：不能把本人降级为内容管理员。** 否则超管一个手滑把自己降级，就再也没有人能管理管理员了；
2. **`cannot_disable_self`：不能停用本人账号。** 停用 = 账号立即失效，等于管理员亲手把自己锁在门外；
3. **`cannot_promote`：不能把其他管理员提升为超级管理员。** 超管可以自己初始化，但**没有"经手人"授权就提权他人**是权限体系的红线——这防止一个内容管理员拿到一个能改自己角色的接口后自我提权；
4. **`last_super_admin`：必须至少保留一个启用的超级管理员。** 这是最容易被忽略的一条。它单独算了一笔账：如果这次修改会让"一个当前启用的超管"变成"非超管或停用"，就再去查表里**还有没有另一个启用状态的超管**；一个都没有，就拒绝。它防的是"最后一个超管被降级/停用，系统从此无人能登后台"的灾难。

这四条规则加起来，本质是在回答一个问题：**管理员是唯一有权限删管理员的人，那么谁来保护"管理员"这个集合本身？** 答案是把保护写进更新接口的事务里，让"降级、停用、提权"这些操作在数据库层面对"系统里还有没有可用超管"做兜底校验。

PATCH 里还有一处很关键的联动——**改密码或停用后，强制该账号下线**：

```ts
if (passwordHash || status === "disabled") await tx.delete(sessions).where(eq(sessions.userId, id));
```

修改密码时删除该用户所有会话，让旧密码签发的令牌全部作废（防止改密码前泄露的会话继续有效）；停用时同样清会话。配合前面 `getCurrentUser` 里的 `eq(users.status, "active")`，停用一个人 = **会话立刻无效 + 数据库行删除**，双保险。

前端同样把这些规则"锁死"在 UI 层。`admin-users.tsx` 里编辑自己的账号时（`isSelf`），角色下拉只有"超级管理员"一个选项、状态下拉只有"启用"一个选项，并提示"不能降低本人角色、停用本人或新增超级管理员"；新增管理员固定为内容管理员。**后端规则 + 前端选项双写**，即便前端被绕过，PATCH 接口的四条规则仍然拦得住。

---

## 六、数据清洗与组件库：把"重复劳动"交给脚本和现成组件

后台系统真正的业务是管单词书。笔记里有一个很典型的"喂数据"问题：从 GitHub 下载的高星单词资料库是一个 **178KB 的 JSON 文件**，想把它导入数据库。

直观的想法是把 JSON 内容直接丢给 AI，让它帮忙转成能导入的格式。但笔记点破了问题：**178KB 进 AI 上下文，token 开销太大**。正确做法是反过来——**让 AI 写一段格式转换脚本（脚本本身很小），本地运行脚本完成 json → csv（或 sql）的转换，再把产物导入数据库**：

> ai 上下文 #json 转成 csv 格式，字段... 178kb token开销大；ai 写一段格式转换脚本(开销小)，本地运行。

这条思路可以抽象成一句话：**大文件不要整个塞进模型上下文，而是让模型生成处理它的代码**。数据的清洗（选择、格式化、审核）由本地脚本做，AI 只负责写"怎么做"的几十行代码，成本差几个数量级。这在处理任何大体积数据时都适用。

页面层同理。后台管理系统 80% 的组件（表格、弹窗、输入框、下拉）在不同业务里长得几乎一样，笔记给的策略是**不重复造轮子**：

> 80% 前端组件业务趋同，不用重复造轮子，选用第三方组件库。element-ui / ANT Design / shadcn。

项目选的是 **shadcn/ui**，理由写得很具体：定制性很好、配合 TailwindCSS、语义化、AI 友好、按需加载，组件落在 `components/ui` 目录下。从 `app/admin-users.tsx` 的 import 能看到实际用法——`Button`、`Dialog`、`Input`、`Label`、`Select` 全部来自 `@/components/ui/*`，业务代码只负责组装。**把样式和可访问性交给成熟组件，把注意力留给真正属于业务的部分**，这和"数据交给脚本清洗"是同一个取舍：重复劳动交给工具。

最后，代码提交也有一套约定。笔记明确列了 **Conventional Commits（约定式提交）**——`feat` 新增功能、`fix` 修复 bug、`docs` 文档变更、`refactor` 代码重构、`style` 样式变更、`test` 测试变更、`chore` 构建工具变更，这也是目前最主流的 Git 提交信息风格。看 danci 仓库的提交记录就能对上：`feat: 完成后台管理系统前端UI开发`、`feat: 管理员注册登录功能`、`fix：超级管理员权限`——**一条提交只干一件事，类型前缀让人一眼看懂这次提交改变了什么**，这也是 coding agent 内置的 git 提交习惯。

---

## 面试问答

**问：BaaS 和自建数据库相比，优势在哪？ORM 解决了什么问题？**

> BaaS（Backend as a Service，如 supabase）把数据库、鉴权、存储这类后端能力作为云服务提供，性能、安全、可扩展性、部署成本几乎为 0，本地只需要一个连接串（`DATABASE_URL`）。ORM（对象关系映射，如 drizzle）解决的是"不用写 SQL、不用做数据库底层处理"——高级语言里的 `User` 对象通过映射对应数据库 `users` 表的一行记录，建表变成写一个 schema 对象，配 `generate`/`migrate`/`push`/`studio` 命令完成建表、迁移、推送和可视化。

**问：drizzle 里怎么定义一张表？为什么用 `pgEnum`？**

> 用 `pgTable("表名", { 列: 类型配置 })` 定义表，列类型来自 `drizzle-orm/pg-core`：`uuid("id").defaultRandom().primaryKey()` 定义主键，`email.unique()` 定义唯一键，`references(() => users.id, { onDelete: "cascade" })` 定义外键级联，索引在表定义末尾的数组里声明。`pgEnum` 用于角色、状态这类取值有限的列，在数据库层面生成真正的枚举类型，让"非法取值"在写入时就被数据库拒绝，而不是靠业务代码自觉。

**问：为什么"首个账号初始化成超级管理员"要用 `pg_advisory_xact_lock`？**

> 因为"先检查表里有没有用户，没有就插入"存在竞态窗口：两个并发注册请求可能同时读到"空表"，然后各自插入，产生两个超管。`pg_advisory_xact_lock(392017)` 是 PostgreSQL 咨询锁，同一把锁同时只允许一个事务持有；把"检查 + 插入"放进同一个事务并先抢锁，第二个请求必须等第一个提交后才查得到已有用户，从而走 `409` 拒绝。把一次性初始化决策下沉到数据库事务里，从根上消除竞态。

**问：会话令牌为什么要在 Cookie 里放随机串，数据库只存 SHA-256 哈希？**

> 令牌是 `randomBytes(32)` 生成的高熵随机串，本身不含用户信息，只是"指向数据库某行会话的钥匙"。数据库里只存它的 SHA-256 哈希，是防止"数据库泄露直接变成账号泄露"——攻击者拿到的是哈希而非可用令牌。这是 OWASP 对服务端会话存储的建议。验证时把 Cookie 令牌哈希后查 `token_hash`，再校验 `expires_at > now` 和 `status = active` 三个条件。

**问：Cookie 上的 `httpOnly`、`sameSite`、`secure` 各防什么？**

> `httpOnly` 让 JS 无法读取该 Cookie，防 XSS 脚本偷令牌；`sameSite: "lax"` 让跨站请求默认不携带 Cookie，缓解 CSRF；`secure` 在生产环境只允许 HTTPS 传输，防明文泄露。`maxAge` 则把有效期对齐数据库里的 `expires_at`。

**问：`requireApiUser(true)` 里 401 和 403 分别代表什么？**

> 401 Unauthorized 表示"没登录"——`getCurrentUser()` 返回 `null`（无令牌、令牌无效、会话过期或账号停用），提示"请先登录"；403 Forbidden 表示"登录了但权限不够"——接口要求超级管理员，当前用户只是内容管理员，提示"没有操作权限"。一个是身份问题，一个是授权问题。

**问：更新管理员的 PATCH 接口为什么要有那四条保护规则？**

> 因为管理员是唯一有权限管理管理员的人，必须防止误操作把系统锁死。四条规则分别是：不能降级本人（否则失去管理能力）、不能停用本人（等于把自己锁在门外）、不能把别人提升为超管（防止无权提权）、必须保留至少一个启用的超管（防止"最后一个超管被移除"导致无人能登后台）。前三条是单条记录内的自洽约束，第四条要额外查库确认系统里还有没有可用的超管，是全局兜底。

**问：停用/改密后为什么要删除该用户的全部会话？**

> 改密码后旧会话令牌仍然有效，删除全部会话让旧密码签发的令牌立即作废，防止密码泄露前的会话继续使用；停用账号同理。同时 `getCurrentUser` 里还有 `status = active` 校验，即使会话没删，停用的账号也查不出用户。数据库行删除 + 查询条件校验双保险，让"停用/改密"立即生效。

**问：178KB 的单词 JSON 怎么导入数据库？为什么不让 AI 直接处理原始数据？**

> 不让 AI 直接处理原始数据，因为 178KB 进上下文 token 开销太大。正确做法是让 AI 写一段体积很小的格式转换脚本，本地运行把 json 转成 csv 或 sql，再导入数据库。AI 只负责生成"怎么做"的代码，不消费大文件本身，成本差几个数量级。大文件一律"生成处理它的代码"，而不是把它塞进上下文。

**问：后台管理系统为什么倾向用 shadcn/ui 这类组件库？**

> 因为后台 80% 的组件（表格、弹窗、输入框、下拉等）在不同业务里高度趋同，不值得重复造轮子。shadcn/ui 定制性好、配合 TailwindCSS、语义化、AI 友好、按需加载，组件落在 `components/ui` 目录，业务代码只负责用现成组件组装界面，把可访问性和样式细节交给成熟组件。

---

## 结语：从一张空表到一套能拦住误操作的权限体系

第六十五天的 danci-admin，把"后台权限系统"从概念落成了可运行的代码，核心是这条链路：

```text
技术底座   supabase（BaaS 云数据库）+ drizzle（ORM，schema 即建表）
数据模型   admin-users 存身份，admin-session 存会话，外键级联 + 索引
首次初始化 pg_advisory_xact_lock 事务锁 → 只产生一个超级管理员
会话签发   随机令牌进 Cookie，SHA-256 哈希进数据库，单会话 + 7 天过期
会话验证   tokenHash 匹配 + 未过期 + 账号启用，三条件 JOIN 一次查
权限守卫   requireApiUser：401 未登录 / 403 无权限，接口按需放行
管理保护   不能降级/停用自己、不能提权他人、必须保留最后一个超管
下线联动   改密码/停用 → 删除全部会话，立即失效
```

动手前，拿这份清单自检：

- [ ] 能否说清 BaaS 与 ORM 分别解决了什么，drizzle 的 schema 如何映射成一张数据库表？
- [ ] 能否讲出 `admin-users` 用 `pgEnum` 定义角色/状态、`admin-session` 用外键级联和双索引的用意？
- [ ] 能否解释 `pg_advisory_xact_lock` 为什么能保证"超级管理员只初始化一次"，以及竞态条件发生在哪？
- [ ] 能否讲清"Cookie 存随机令牌、数据库存 SHA-256 哈希"的设计，以及验证时校验哪三个条件？
- [ ] 能否说出 `httpOnly`、`sameSite`、`secure` 分别防御什么？
- [ ] 能否区分 401 和 403 的含义，以及 `requireApiUser(true)` 的守卫方式？
- [ ] 能否背出更新管理员时的四道保护规则，并说出第四条为什么需要额外查库？
- [ ] 能否解释"改密码/停用 → 删除会话"的下线联动，和 `getCurrentUser` 里的账号状态校验如何双保险？

**权限系统的本质，是把"谁能进、能干什么"从口头约定变成代码约束**：数据库枚举挡住非法取值，事务锁挡住并发竞态，令牌哈希挡住盗库变现，四道保护规则挡住最后一个超管被误删。把这些防线写进对应层，一个后台才算真正"锁好了门"。
