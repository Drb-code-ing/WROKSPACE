# v065 博客大纲

**标题**：前端接口工程：axios 统一封装、baseURL 一键切换与 Mock 先行的并行开发  
**日期**：2026-08-12  
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源 |
| --- | --- | --- |
| 引言 | 开门见山：前后端分离后前端最大的卡点是"等后端接口"，解法是前端自建接口层 | 综合 |
| 一、前后端职责分离 | 前端三驾马车（组件+路由+状态管理） vs 后端 koa+mysql 提供 /todos；唯一耦合点是 /api | readme.md |
| 二、解耦关键 | 前端不做路由也要能独立做数据接口；傻等后端是下策；mock 先行、后端写好再切 | readme.md |
| 三、api 目录 | 前端接口层四职责：管接口 / axios 配置 / 先伪造数据 / baseURL 一键切换；目录结构 | readme.md |
| 四、axios 实例 | config.js：axios.create baseURL '/api'、timeout 5000；fetch 缺点；baseURL 一键切换 | api/config.js |
| 五、api 模块 | 一个模块一个文件、一个接口一个函数；getTodos 返回 res.data；职责是提供接口非直连后端 | api/todos.js |
| 六、页面消费 | Todos.jsx：useEffect + IIFE 调 getTodos、setTodos、map 渲染；页面不知道数据来源 | pages/Todos.jsx |
| 七、Mock 先行 | vite.config.js viteMockServe(mockPath/localEnable)；mock 接口 {url,method,timeout,response}；接口路由非 react-router 范围；code+todos 契约观察 | vite.config.js / mock/todos.js |
| 八、联调切换 | baseURL 从 /api 切到 http://localhost:3000，前端代码零改动 | api/config.js |
| 九、面试问答 | 耦合点解耦、api 目录必要性、fetch vs axios、baseURL 切换、mock 原理、两套路由、无缝切换 | 综合 |
| 结语 | 前端接口工程让前后端真正并行；检查清单 | 综合 |

## 核心结论

- 前后端分离后唯一的耦合点是 `/api` 接口请求；要解耦，前端不能傻等后端给接口；
- 前端独立开发的"三驾马车"（组件 + 路由 + 状态管理）之外，还需接口工程（API 工程）这一环，才能独立完整地开发整个 App；
- 接口层四职责：管理所有接口、axios 配置、先伪造数据、baseURL 一键切换；
- axios 是 App 级标准请求库，弥补 fetch 功能小（统一配置/超时/拦截/错误处理）；
- baseURL 一键切换：开发走 `/api`（mock 拦截），联调切 `http://localhost:3000`，页面与 api 模块零改动；
- Mock 先行：vite-plugin-mock 扫描 mockPath，`{url, method, timeout, response}` 定义接口，前端在无后端时跑通"页面→api→数据→渲染"全链路；
- 两套路由体系：页面级路由（pages/…）归 react-router，接口级路由（/api/…）归 api 目录 + mock；
- 工程观察：mock 的 response 用 `{code, todos}` 包一层贴近真实约定，但页面 `setTodos(data)` 直接把整个对象当列表——契约未对齐，真实项目应在 api 模块解构 `data.todos`；mock 结构必须按真实接口契约写，切换时才零改动。

## 引用说明

- 全部基于第五十六天提交 `1398a83`（"第五十六天学习 接口"）：
  - `fe/React/basic/todos-fullstack/readme.md`（前后端职责分离、api 目录、mock 先行、baseURL 切换、两套路由笔记）；
  - `fe/React/basic/todos-fullstack/frontend/todos/src/api/config.js`（axios 实例 baseURL 一键切换）；
  - `fe/React/basic/todos-fullstack/frontend/todos/src/api/todos.js`（getTodos 接口封装）；
  - `fe/React/basic/todos-fullstack/frontend/todos/src/pages/Todos.jsx`（useEffect + IIFE 消费接口）；
  - `fe/React/basic/todos-fullstack/frontend/todos/mock/todos.js`（vite-plugin-mock 接口伪造）；
  - `fe/React/basic/todos-fullstack/frontend/todos/vite.config.js`（viteMockServe 启用 mock）。
