# v080 博客大纲

**标题**：全栈项目部署到公网：五步部署链路、DNS 与安全组，和 nginx 反向代理的分流
**日期**：2026-08-31
**目标平台**：稀土掘金（juejin.cn）
**学习笔记**：第六十六天（backend/online/readme.md + baotao-tutorial 全栈项目，git 短提交号 cf31ee6；侧重点全栈项目部署全流程、DNS/安全组/防火墙/端口、nginx 静态与动态分流、宝塔面板与 nvm/MySQL 服务器准备，以及配套的 Future Capsule 时间胶囊应用）

## 结构

| 章节 | 内容 | 来源 |
| --- | --- | --- |
| 引言 | 开门见山：本地项目走向公网部署；四个技术核心（五步部署链路、DNS/安全组/防火墙、nginx 分流、宝塔面板与服务器准备）+ 时间胶囊项目 | readme + baotao-tutorial 综合 |
| 一、部署全流程 | 五步：买服务器 → 买域名备案 10-20 天 → 配置 HTTPS → nginx 反向代理 → 服务器安全；Vercel 对比（固定 vs 自由度，国内用腾讯云）；前后端分离：react+ts build 出 dist 静态资源、node /api 接口 JSON | readme.md「使命」「部署全流程」 |
| 二、用户访问网站到底发生了什么 | DNS 先查地址再敲门、解析链 browser→系统→局域网→城域网→根服务器、多级缓存；安全组（云厂商网络层）vs 防火墙（系统内部）两道门卫；端口 80/443/3306 与最小开放 | readme.md「用户访问网站到底发生了什么」 |
| 三、nginx：真正的入口与分流 | 高性能 web 服务器三件事（接收/静态/转发）；静态资源 dist 直接返回、/api 反代后端；`/api/todos → :3000/todos` 示例；跨域在生产同源消失 | readme.md「Nginx 真正的入口（分流）」 |
| 四、宝塔面板与服务器准备 | 宝塔可视化面板（/www/wwwroot、8888 端口、自由度高）；Node 项目用 nvm 管版本（指针切换）、HTML 项目装 nginx、MySQL 建 dev/prod 两库隔离 | readme.md「宝塔的优势」「服务器准备」 |
| 五、部署的对象：Future Capsule 前端 | 时间胶囊应用：WaterfallLayout 响应式列数（<600→1/<900→2/else 3 + index%columns 分列）、CapsuleCard 倒计时解锁（setInterval + hasTriggeredUnlock ref 防重复）、useInfiniteScroll 无限滚动（loadingRef 并发闸门 + refresh）、CapsuleForm 本地时间 getMinDateTime、api.js axios（VITE_API_URL 部署切换） | baotao-tutorial/client/src/**（Home/CapsuleCard/CapsuleForm/WaterfallLayout/useInfiniteScroll/api） |
| 六、Future Capsule 后端 | Express+TS+MySQL：app.ts 启动前 testConnection、db.ts 连接池与错误分类（ECONNREFUSED/ER_ACCESS_DENIED_ERROR/ER_BAD_DB_ERROR）、getCapsules 分页 + 服务端算 is_unlocked 未解锁 content 返回 null、createCapsule 未来时间校验与匿名默认、types 契约（content: string \| null） | baotao-tutorial/server/src/**（app/db/capsuleController/routes/types） |
| 面试问答 | 部署五步、DNS 与多级缓存、安全组 vs 防火墙、nginx 分流与跨域消失、nvm、dev/prod 双库、解锁判断放服务端、loadingRef 闸门、hasTriggeredUnlock 防重复 | 综合 |
| 结语 | 部署链路 + 访问链路 + 项目准备三线图 + 检查清单 | 综合 |

## 核心结论

- **部署全流程五步**：买服务器（轻量云，公网 IP）→ 买域名并备案（国内 10-20 天）→ 配置 HTTPS → nginx 反向代理 → 服务器安全加固；Vercel 对 Next.js 友好但固定，Java/Go/Python 要自由度，国内用腾讯云；
- **用户访问 = DNS 先找地址再敲门**：解析链 browser→系统→局域网→城域网→根服务器，逐级缓存；服务器门口两道门卫——安全组（云厂商网络层）与防火墙（系统内部），端口尽量少开（80/443 必要、3306 按需）；
- **nginx 是生产真正的入口**：静态资源（react build 的 dist）直接返回文件，`/api` 请求反向代理给 Node 后端（:3001）；前后端同源后跨域在生产不存在；
- **服务器准备三件套**：宝塔面板可视化管理（/www/wwwroot + 8888 端口）、nvm 管多个 Node 版本（指针切换）、MySQL 建 dev/prod 两库隔离开发与线上；
- **Future Capsule 时间胶囊**：前端 React（瀑布流响应式列数、倒计时解锁卡片、无限滚动、axios 层 VITE_API_URL）；后端 Express+TS+MySQL（启动前连库、连接错误分类、分页 + 服务端算 is_unlocked、未解锁 content 返回 null）；`tsc`/`vite build` 产出的 dist 正是要部署的两端产物。

## 引用说明

- 基于第六十六天学习笔记（git 提交号 `cf31ee6`）：
  - `E:/WROKSPACE/backend/online/readme.md`（全栈项目部署全流程 / 运维笔记）——`cf31ee6`；
  - `E:/WROKSPACE/backend/online/baotao-tutorial/baotao-tutorial/client/src/pages/Home.jsx`（首页 / 瀑布流 + FAB + 错误横幅）——`cf31ee6`；
  - `E:/WROKSPACE/backend/online/baotao-tutorial/baotao-tutorial/client/src/components/CapsuleCard.jsx`（时间胶囊卡片 / 倒计时解锁）——`cf31ee6`；
  - `E:/WROKSPACE/backend/online/baotao-tutorial/baotao-tutorial/client/src/components/CapsuleForm.jsx`（新建胶囊表单 / 本地时间与校验）——`cf31ee6`；
  - `E:/WROKSPACE/backend/online/baotao-tutorial/baotao-tutorial/client/src/components/WaterfallLayout.jsx`（瀑布流布局 / 响应式列数）——`cf31ee6`；
  - `E:/WROKSPACE/backend/online/baotao-tutorial/baotao-tutorial/client/src/hooks/useInfiniteScroll.js`（无限滚动 Hook / 分页追加与刷新）——`cf31ee6`；
  - `E:/WROKSPACE/backend/online/baotao-tutorial/baotao-tutorial/client/src/services/api.js`（axios API 层 / VITE_API_URL）——`cf31ee6`；
  - `E:/WROKSPACE/backend/online/baotao-tutorial/baotao-tutorial/server/src/app.ts`（Express 入口 / 中间件与启动前连库）——`cf31ee6`；
  - `E:/WROKSPACE/backend/online/baotao-tutorial/baotao-tutorial/server/src/config/db.ts`（MySQL 连接池 / 连接测试错误分类）——`cf31ee6`；
  - `E:/WROKSPACE/backend/online/baotao-tutorial/baotao-tutorial/server/src/controllers/capsuleController.ts`（胶囊控制器 / 分页 + 服务端解锁逻辑）——`cf31ee6`；
  - `E:/WROKSPACE/backend/online/baotao-tutorial/baotao-tutorial/server/src/routes/capsule.ts`（胶囊路由 / GET POST）——`cf31ee6`；
  - `E:/WROKSPACE/backend/online/baotao-tutorial/baotao-tutorial/server/src/types/index.ts`（胶囊类型契约 / PaginatedResponse）——`cf31ee6`。
- 素材说明：v070（Docker 镜像与容器 + nginx 反代）讲过 nginx.conf 的反向代理写法，v076（博客后端 SQL 表设计 + nginx 反代下跨域）讲过反代消解跨域；本篇是**从"买服务器/域名备案/安全组"到"宝塔面板与 nvm/MySQL 服务器准备"的部署全流程认知，并落到配套的 Future Capsule 时间胶囊全栈项目**，部署动作本身（宝塔实操、HTTPS 证书、上线命令）是后续步骤，只作流程提及。未登记无讲解价值的文件：package.json / package-lock.json / pnpm-lock.yaml / tsconfig.json / vite.config.js（默认模板）/ index.html / main.jsx / App.jsx（仅 `<Home />`）/ index.css / README.md（Vite 默认模板）/ eslint.config.js / public 资源 / `__MACOSX`（macOS 垃圾目录）/.gitignore / .env 类。
