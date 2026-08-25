# v076 博客大纲

**标题**：博客后端的 SQL 表设计：主键、联合主键与外键级联的取舍，与 nginx 反代下的跨域解法
**日期**：2026-08-25
**目标平台**：稀土掘金（juejin.cn）
**学习笔记**：第六十四天（sql 上 `e64a413` + sql 下 `9225c50`，backend/sql + backend/docker，侧重点 SQL 表设计、DNS/nginx/CDN 架构、跨域）

## 结构

| 章节 | 内容 | 来源 |
| --- | --- | --- |
| 引言 | 开门见山：博客后端几张表 + 索引/约束的取舍，到 DNS→nginx→CDN 的请求路径，再到全栈项目的跨域解法 | backend/sql/readme.md 综合 |
| 一、`user` 表 | 后端业务有哪些表；user 表只存 id/username/password 核心字段（小表利于分布式、快速查询、分表）；头像单独建表存文件元数据，图片放静态服务器/OSS 返回阿里云地址 | backend/sql/readme.md（用户表/头像表） |
| 二、索引的取舍 | 高频查询安排索引：/user/:id 主键、搜索用户唯一键、avatar KEY userId；点赞表联合主键 (userId, postId)，最左前缀原则下省掉 userId 索引、补 postId 索引 | backend/sql/readme.md（索引/点赞表） |
| 三、外键与级联 | post 外键 userId；comment 自引用 parentId 实现"评论的评论"、ON DELETE CASCADE；post_tag 中间表联合主键 + 双侧级联 | backend/sql/readme.md（文章/评论/tag/post_tag/文件表） |
| 四、DNS 解析 | juejin.cn 逐级递归：浏览器/本地缓存→局域网 DNS→运营商 DNS（账本）→国家服务器→根服务器（.com 美国）；返回最近的 nginx IP 而非后端 IP | backend/sql/readme.md（DNS 段落） |
| 五、nginx 反向代理 | nginx 不做具体代码，只做负载均衡、挑健康服务器代理；后端集群独立 IP 都能服务；隐藏后端、统一入口 | backend/sql/readme.md（nginx 段落） |
| 六、静态资源与 CDN | img/css/js 静态服务器特征；CDN 内容分发网络、就近获取；完整请求路径串联 | backend/sql/readme.md（静态服务器/CDN 段落） |
| 七、Dockerfile | 蜜雪冰城 SOP 类比（先加奶茶加奶放 3 勺糖）；Dockerfile 文本配方；build/login/push/pull 发布流程；my-docker-demo/Dockerfile 最小例子 | backend/docker/file/readme.md、my-docker-demo/Dockerfile |
| 八、跨域 | todos 全栈（react+ts+zustand / nest / nginx 80→3000）；同源策略端口不同即跨域；enableCors 在 NestJS main.ts 放行；nginx 反代 baseURL '/api' 相对路径让跨域不发生；两条路本质区别 | todos-fullstall：todos-backend/src/main.ts、src/api/config.ts、src/store/todoStore.ts |
| 面试问答 | 主键/唯一键/普通索引区别；联合主键+最左前缀为何省索引；ON DELETE CASCADE 与自引用；user 表小而头像单独建表；DNS 过程为何返回 nginx 地址；nginx 负载均衡；CDN 为何快；跨域是什么；enableCors 与 nginx 反代区别 | 综合 |
| 结语 | 一条"数据存→域名找→流量分→静态发→部署定→跨域解"的完整链路 + 检查清单 | 综合 |

## 核心结论

- **表设计围绕查询做取舍**：索引跟着高频查询走——按 id 查主键、按名字查唯一键、按外键查普通索引；user 表刻意只存核心字段，行短索引小、利于分布式与分表；
- **联合主键 + 最左前缀是省索引的钥匙**：点赞表 `(userId, postId)` 联合主键已覆盖"按 userId 查"，不再单独建 userId 索引省空间；单独按 postId 查用不上右侧，须补 `KEY postId`；
- **外键 + 级联把"清理"下沉到数据库**：删文章自动删评论、删父评论自动删楼中楼、删文章/标签自动清 post_tag 关联，靠 ON DELETE CASCADE，而不是业务代码手写清理；
- **请求链路是一层层网关**：DNS 逐级递归返回最近 nginx IP → nginx 不写业务代码、只负载均衡到健康集群服务器 → 静态资源走 CDN 就近分发，后端真实地址被隐藏；
- **Dockerfile 是发布的标准配方（SOP）**：任何人照着构建出味道一致的镜像，build → login → push → pull；
- **跨域有两条解法且各管一段**：`enableCors` 在 HTTP 头层面承认跨域并放行；nginx 反代让前端发同源 `/api` 相对路径、在服务端转发到后端 3000，跨域根本不发生。生产通常两者配合。

## 引用说明

- 基于第六十四天学习笔记（上 `e64a413`、下 `9225c50`，最终状态均在 `9225c50`）：
  - `backend/sql/readme.md`（SQL 表设计 / DNS 解析 / nginx 反代 / 静态服务器 / CDN）——`9225c50`；
  - `backend/docker/file/readme.md`（Dockerfile SOP 配方 / todos 全栈项目与 nginx 80→3000 / 跨域）——`9225c50`；
  - `backend/docker/file/my-docker-demo/Dockerfile`（最小 Dockerfile：FROM/WORKDIR/COPY/CMD）——`9225c50`；
  - `backend/docker/todos-fullstall/todos-backend/src/main.ts`（NestJS `app.enableCors()` 跨域放行）——`9225c50`；
  - `backend/docker/todos-fullstall/src/api/config.ts`（axios 实例 baseURL '/api' 配合 Nginx 反代 + 拦截器）——`9225c50`；
  - `backend/docker/todos-fullstall/src/store/todoStore.ts`（zustand store，`fetch('/api/todos')` 走 Nginx 代理）——`9225c50`。
- 素材说明：v070 已讲镜像/容器与 nginx 80→1314 反代，本篇聚焦新增的 SQL 表设计、DNS/nginx/CDN 架构与跨域；跳过 package.json/tsconfig 等非讲解价值文件。
