# v077 博客大纲

**标题**：Next.js 后台的认证与权限防线：首个超级管理员的事务锁初始化、会话令牌哈希，与四道管理员保护规则
**日期**：2026-08-26
**目标平台**：稀土掘金（juejin.cn）
**学习笔记**：第六十五天（danci 单词后台管理系统，E:\ai-coding\danci，git 短提交号 `a30e4e6`；侧重点 Next.js 16 + supabase BaaS + drizzle ORM + 后台认证权限）

## 结构

| 章节 | 内容 | 来源 |
| --- | --- | --- |
| 引言 | 开门见山：后台系统的门和锁——谁能进、进来能干什么；三块核心设计（事务锁初始化超管、会话令牌哈希、四道保护规则）+ 技术底座（BaaS + ORM） | danci/README.md + lib/schema.ts + lib/auth.ts 综合 |
| 一、技术底座 | supabase 云端 BaaS 数据库（性能/安全/可扩展性/部署成本几乎为 0，psql 内嵌）；ORM 不用写 SQL，`User` 对象 ↔ `users` 表一行；db.ts 连接几行代码；drizzle 的 generate/migrate/push/studio 四命令闭环 | danci/README.md（supabase/ORM/drizzle 段落）、lib/db.ts |
| 二、两张表 | admin-users（pgEnum 角色/状态、email 唯一、默认 content_admin+active、passwordHash 不存明文）；admin-session（userId 外键级联、tokenHash 唯一、双索引） | lib/schema.ts、drizzle/0000_charming_warhawk.sql |
| 三、首个账号初始化 | signup 路由：校验 name/email(正则)/password(≥8)；事务里 pg_advisory_xact_lock(392017) 咨询锁串行化"检查+插入"，第二个请求 409"系统已完成初始化"；bcrypt cost 12；角色显式 super_admin；normalizeEmail 归一化；前端文案"仅系统首个账号可通过此页面创建" | app/api/auth/signup/route.ts、app/auth-pages.tsx |
| 四、会话令牌 | createSession：randomBytes(32) base64url 随机令牌进 Cookie，库中只存 SHA-256 digest；单会话（新登录删旧）；7 天过期；httpOnly/sameSite lax/secure/maxAge；getCurrentUser 一次 JOIN 校验 tokenHash 匹配 + 未过期 + status active；signout 删行删 Cookie；"随机令牌必须查库"的取舍 | lib/auth.ts、app/api/auth/signout/route.ts |
| 五、权限守卫与四道保护规则 | requireApiUser(true)：401 未登录 / 403 无权限；admin-users GET/POST 只放行超管；PATCH 事务里四道规则（不能降级/停用自己、不能提权他人、必须保留最后一个启用的超管，第四条额外查库）；改密码/停用 → delete sessions 强制下线；前端 isSelf 锁死角色/状态选项 | lib/api-auth.ts、app/api/admin-users/route.ts、app/api/admin-users/[id]/route.ts、app/admin-users/admin-users.tsx |
| 六、数据清洗与组件库 | 178KB 单词 JSON 不进 AI 上下文（token 开销大），让 AI 写格式转换脚本本地运行 json→csv/sql；shadcn/ui：80% 组件趋同不重复造轮子，按需加载、components/ui 目录；Conventional Commits（feat/fix/docs/refactor）与 danci 实际提交对应 | danci/README.md（数据清洗/shadcn/Conventional Commits 段落）、app/admin-users.tsx import |
| 面试问答 | BaaS/ORM；pgEnum；pg_advisory_xact_lock 防竞态；令牌哈希；httpOnly/sameSite/secure；401 vs 403；四道保护规则；改密/停用下线；178KB 数据处理；为什么用 shadcn | 综合 |
| 结语 | 从空表到权限体系的链路图 + 检查清单 | 综合 |

## 核心结论

- **BaaS + ORM 把数据层成本压到最低**：supabase 云端 Postgres 只需一个 `DATABASE_URL`；drizzle 让"建表"变成写 schema 对象，`generate/migrate/push/studio` 完成建表到上线的闭环；
- **"只初始化一次"要靠数据库级锁**：`pg_advisory_xact_lock` 把"检查是否已有用户 + 插入"串行化，从根上消除两个并发注册产生两个超管的竞态窗口；
- **会话令牌的存储分层是安全的核心**：Cookie 放 `randomBytes(32)` 随机串、数据库只存 SHA-256 哈希（盗库无法直接变现成盗号），验证时一次 JOIN 校验令牌哈希、未过期、账号启用三个条件；
- **权限保护的常识是把决策下沉到接口事务**：四道规则（不能降级/停用自己、不能提权他人、必须保留最后一个启用的超管）让"管理员集合"本身也被保护，改密码/停用时删全部会话强制下线，前端选项再双写一遍；
- **大文件不塞进模型上下文**：178KB JSON 让 AI 写转换脚本本地运行，而不是直接喂原文；后台 80% 组件趋同选 shadcn 不重复造轮子。

## 引用说明

- 基于第六十五天学习笔记（E:\ai-coding\danci，git 提交号 `a30e4e6`）：
  - `E:/ai-coding/danci/README.md`（BaaS / ORM / drizzle / shadcn / 数据清洗 / Conventional Commits 概念）——`a30e4e6`；
  - `E:/ai-coding/danci/danci-admin/lib/schema.ts`（admin-users 与 admin-session 表设计、pgEnum、外键级联、索引）——`a30e4e6`；
  - `E:/ai-coding/danci/danci-admin/lib/db.ts`（drizzle 连接、db 操作句柄）——`a30e4e6`；
  - `E:/ai-coding/danci/danci-admin/lib/auth.ts`（bcrypt 哈希、会话签发/验证/删除、Cookie 属性）——`a30e4e6`；
  - `E:/ai-coding/danci/danci-admin/lib/api-auth.ts`（requireApiUser 权限守卫、401/403）——`a30e4e6`；
  - `E:/ai-coding/danci/danci-admin/app/api/auth/signup/route.ts`（pg_advisory_xact_lock 单次初始化）——`a30e4e6`；
  - `E:/ai-coding/danci/danci-admin/app/api/auth/signout/route.ts`（会话删除）——`a30e4e6`；
  - `E:/ai-coding/danci/danci-admin/app/api/admin-users/route.ts`（列表与新增，requireApiUser(true)）——`a30e4e6`；
  - `E:/ai-coding/danci/danci-admin/app/api/admin-users/[id]/route.ts`（PATCH 四道保护规则、改密/停用删会话）——`a30e4e6`；
  - `E:/ai-coding/danci/danci-admin/app/admin-users/admin-users.tsx`（前端 isSelf 锁定角色/状态选项）——`a30e4e6`；
  - `E:/ai-coding/danci/danci-admin/app/auth-pages.tsx`（初始化/登录页文案）——`a30e4e6`。
- 素材说明：v072 已讲 JWT 无状态登录，本篇是**服务端会话 + 权限管理**的另一条路线（随机令牌 + 库中哈希 + 事务锁初始化 + 管理员保护规则），与 JWT 互补；跳过 package.json/globals.css 等非讲解价值文件。
