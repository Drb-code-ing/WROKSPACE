# v058 博客大纲

**标题**：前端路由的第一性原理：从 hashchange 手写路由，到 React Router 的嵌套与懒加载  
**日期**：2026-08-05  
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源 |
| --- | --- | --- |
| 引言 | 从"页面白一下"切入，引出前端路由 | 综合 |
| 一、传统多页面 | 整页刷新的代价与 SPA 诉求 | fe/html5/history/readme.md |
| 二、URL 结构 | protocol / host / path / queryString / hash | fe/html5/history/readme.md |
| 三、hashchange | 锚点、事件对象 newURL/oldURL | fe/html5/history/demo2/demo.html |
| 四、手写 HashRouter | 注册表、hashchange、bind(this) 完整实现 | fe/html5/history/demo2/index.html |
| 五、React Router 集成 | HashRouter / Routes / Route 三件套 | fe/React/router/readme.md + App.jsx |
| 六、Link vs a | 拦截点击、不刷新、不触发 hashchange | Navigation.jsx |
| 七、动态路由 | /user/:id 与 useParams | User/index.jsx |
| 八、嵌套路由 | Outlet、相对路径、布局复用 | Products/index.jsx + App.jsx |
| 九、路由懒加载 | lazy + Suspense、首屏速度 | App.jsx |
| 十、404 与导航 | path="*"、Navigate 重定向、useNavigate vs location.href | NotFound/index.jsx + App.jsx |
| 十一、面试问答 | hash 原理、Link、useParams、Outlet、懒加载、导航 | 综合 |
| 结语 | 原理不变，框架只是工程化 + 检查清单 | 综合 |

## 核心结论

- hash 路由利用"改变 # 不刷新页面 + URL 仍改变"实现 SPA 路由；
- 手写 HashRouter = 注册表 + hashchange 监听 + 内容替换，约 30 行；
- React Router 用组件（HashRouter/Routes/Route/Link/Outlet）封装同一套原理；
- 动态路由用 `:id` + `useParams`，嵌套路由用父 Route + Outlet；
- `lazy` + `Suspense` 做按需加载，`Navigate` 做重定向，`path="*"` 兜底 404；
- `useNavigate` 在 SPA 内部跳转，优于整页刷新的 `location.href`。
