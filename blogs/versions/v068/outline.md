# v068 博客大纲

**标题**：Next.js 全栈实战：Redis 数据层、规范驱动组件规划，与 RSC/CSR 的拆分边界
**日期**：2026-08-14
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源 |
| --- | --- | --- |
| 引言 | 开门见山：从 CSR/SSR 理论落到搭全栈项目，三件实事（npx 起步、Redis 数据层、组件拆分） | 综合 |
| 一、npx 到 create-next-app | npx 是什么、npx = npm i -g + 执行一次、create-next-app 脚手架能力（SSR/SEO/RSC/hydration） | readme.md |
| 二、需求先行 | 笔记系统 CRUD；存 markdown、展示 html（marked）；五条需求；路由 /add /note/[id] /edit/[id] | readme.md |
| 三、规范驱动编程 | 先规划组件再写代码；组件=工作单元=AI 交付单元；Sidebar/Note 两颗组件树；目录约定 lib 放数据逻辑 | readme.md |
| 四、@ 别名与布局 | @ 路径别名解决 ../../../；layout 语义化结构（html/head/body/nav/section/children）；注释大法；tailwind vs BEM | readme.md |
| 五、数据服务选型 | Redis key:value NOSQL 内存库、6379、无表无 SQL、字符串 set/get 哈希 hset/hget、缓存/计数器/榜单、Redis+MySQL | readme.md |
| 六、lib/redis.js | ioredis 客户端、hash 存 JSON 序列化字符串、hgetall 懒初始化、异步 await | lib/redis.js |
| 七、组件拆分 | Sidebar(async)→SidebarNoteList(RSC)→SidebarNoteItem(dayjs)→SidebarNoteItemContent('use client')；RSC/CSR 边界 | Sidebar.js / SidebarNoteList.js / SidebarNoteItem.js / SidebarNoteItemContent.js / layout.js / page.js |
| 八、面试问答 | npx/npm、markdown 与 html、Redis vs MySQL、Redis 类型、Redis+MySQL 缓存、组件三层拆分、'use client' | 综合 |
| 结语 | 先规划再动手、把边界落实成组件树；检查清单 | 综合 |

## 核心结论

- `npx` 是 npm 自带的包运行器，直接运行 node 包而不全局安装，等价于"临时下载并执行一次"；
- 笔记系统"存 markdown、展示 html（marked）"体现了**存储模型与展示模型分离**；
- **规范驱动编程**：动手前先分析需求、技术方案、任务细节，规划好路由 + 组件；组件是工作单元、是 AI 的交付单元；
- Next.js 目录约定：`app` 页面、`components` 组件、`lib` 数据业务逻辑、`public` 静态资源；`@` 别名一步回到根目录；
- Redis 是 key:value 的 NOSQL 内存库（6379、无表、无 SQL、在内存中），字符串 `set/get`、哈希 `hset/hget`，做缓存/计数器/榜单；
- Redis + MySQL 分工：**Redis 是缓存层，MySQL 是主存储层**——热数据先查 MySQL 存入 Redis，后续直接读 Redis；
- `lib/redis.js` 用 hash 存笔记集合：field 是笔记 ID，value 是 JSON 序列化字符串；`hgetall` 拿空则懒初始化；
- 组件拆分边界：`Sidebar`/`SidebarNoteList` 是 `async` 服务端组件（RSC，读数据 + SEO），`SidebarNoteItem` 用 dayjs 格式化，叶子 `SidebarNoteItemContent` 标 `'use client'` 是交互占位；**`'use client'` 就是 RSC/CSR 的分界标记**。

## 引用说明

- 全部基于第五十八天两个提交 `2df34fd`（"next-blog 项目初步"）与 `9015011`（"redis 引入以及组件拆分"）：
  - `fe/fullstack/next-blog/README.md`（npx/create-next-app、需求、规范驱动、目录与 @ 别名、Redis 选型、布局）；
  - `fe/fullstack/next-blog/lib/redis.js`（ioredis 客户端、hash 存储、懒初始化）；
  - `fe/fullstack/next-blog/components/Sidebar.js`（async 服务端组件、读数据、语义化）；
  - `fe/fullstack/next-blog/components/SidebarNoteList.js`（RSC 列表、Object.entries + JSON.parse）；
  - `fe/fullstack/next-blog/components/SidebarNoteItem.js`（dayjs 时间格式化、content 截断）；
  - `fe/fullstack/next-blog/components/SidebarNoteItemContent.js`（'use client' 交互占位）；
  - `fe/fullstack/next-blog/app/layout.js`（根布局 metadata/SEO、Sidebar + children）；
  - `fe/fullstack/next-blog/app/page.js`（空状态占位）。
