# v067 博客大纲

**标题**：Next.js 全栈框架：CSR 与 SSR 的本质差异、SEO 的三层做法，与 App Router 的文件即路由
**日期**：2026-08-13
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源 |
| --- | --- | --- |
| 引言 | 开门见山：同一段 React 组件在 SPA 和 Next.js 里，爬虫看到两个世界；"组件在哪里渲染"是钥匙 | 综合 |
| 一、Next.js 是谁 | Next/Nuxt/Nest 三者区分；Next 全栈（页面+API）；背靠 Vercel、SEO 好；create-next-app | readme.md |
| 二、SPA 好坏两面 | 好处：前端挂载不刷新、前端路由快；短板：不为 SEO、#root 空壳 | readme.md |
| 三、CSR 与 SSR | SEO 根本=组件在哪里渲染；CSR 浏览器/SSR 服务器；CSR 链路（Server 返回 index.html → Client 挂载） | readme.md |
| 四、前后端分离 vs 全栈 | /todos 返回 JSON 还是 HTML；jsx+数据=服务端 UI html；服务器是字符串格式化 | readme.md |
| 五、App Router | 约定大于配置；文件即路由；page.tsx/layout.tsx；渲染顺序 layout→page | readme.md |
| 六、Demo 源码 | 根布局（metadata+nav+children）、服务端组件 page.tsx、嵌套布局 dashboard/layout.tsx、SPA 计数器对照 | layout.tsx / page.tsx / dashboard/layout.tsx / App.jsx |
| 七、SEO 三层做法 | 第一层 title/description/keywords；第二层内容；第三层 SSR；GEO 延伸 | readme.md |
| 八、面试问答 | Next/Nuxt/Nest、CSR/SSR 本质、SPA 为什么不 SEO、/todos 两种返回、App Router 约定、什么组件能 SSR、SEO 三层 | 综合 |
| 结语 | 从"组件在哪里渲染"出发的总结；检查清单 | 综合 |

## 核心结论

- Next 是 React 全栈框架、Nuxt 是 Vue 全栈框架、Nest 是后端框架；Next 既能写页面也能写 API，背靠 Vercel、SEO 好；
- **CSR 与 SSR 的本质 = 组件在哪里渲染**：CSR 在浏览器（SPA），SSR 在服务器（Next.js）；
- SPA 的 `index.html` 只有 `#root` + `<script>`，内容要浏览器执行 JS 后才出现，爬虫抓不到，所以天生不 SEO；
- 前后端分离的 `/todos` 返回 JSON 数组，全栈项目的 `/todos` 返回 `jsx + todos 数据` 编译后的 HTML——服务器端不是 DOM，是字符串格式化；
- App Router"约定大于配置"：`page.tsx` 是页面、`layout.tsx` 是布局，文件即路由、目录即嵌套；访问路径先到 `layout.tsx` 再编译 `page.tsx`；
- 不做事件监听、不用 `useEffect` 的组件可在服务器编译成 HTML（SSR）；带 `useState` 等交互的组件只能浏览器跑（CSR）；
- SEO 三层做法：第一层 `title`/`description`/`keywords`（对应 `metadata`）、第二层内容、第三层 SSR 整站收录加权；GEO 是新延伸。

## 引用说明

- 全部基于第五十七天提交 `7a81453`（"第五十七天 next.js理解与CSR、SSR、SEO理解"）：
  - `fe/fullstack/nextjs/readme.md`（Next/Nuxt/Nest、SPA 好坏、CSR/SSR、前后端分离 vs 全栈、App Router、SEO 三层）；
  - `fe/fullstack/nextjs/next-demo/app/layout.tsx`（根布局 metadata + nav + children）；
  - `fe/fullstack/nextjs/next-demo/app/page.tsx`（服务端组件 jsx->html）；
  - `fe/fullstack/nextjs/next-demo/app/dashboard/layout.tsx`（嵌套布局）；
  - `fe/fullstack/nextjs/spa-demo/src/App.jsx`（SPA 计数器 CSR 对照）。
