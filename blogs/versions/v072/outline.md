# v072 博客大纲

**标题**：JWT 登录鉴权：无状态凭证的颁发与验证、zustand 全局状态，与 axios 拦截器的自动携带
**日期**：2026-08-19
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源 |
| --- | --- | --- |
| 引言 | 开门见山：HTTP 无状态 → 凭证认证；demo 打通整条鉴权链路 | readme.md |
| 一、无状态的 HTTP | Header Authorization: Bearer Token；登录换凭证、请求带凭证、服务端验凭证 | readme.md |
| 二、JWT 的 sign/verify | /api/login 校验账号 → jwt.sign 签发（expiresIn）；/api/repo 验 Bearer 前缀 → jwt.verify 解身份 / 401 | mock/user.js + readme.md |
| 三、zustand 全局 store | create(set=>…)；state 与 action；localStorage 持久化；React App = UI + Store；子 store 拆分 | store/user.js + store/todos.js + readme.md |
| 四、登录流程串联 | 实时校验（用户名≥3/密码≥6 + disabled）→ login() → setAuth → navigate(from) | page/Login.jsx + api/user.js |
| 五、路由守卫 | RequireAuth 无 token → Navigate /login；/pay 包裹；Nav 条件渲染 | components/RequireAuth.jsx + App.jsx + Nav.jsx |
| 六、axios 拦截器 | request 拦截器自动带 authorization；response 拦截器剥 res.data；getRepo 验证链路 | api/config.js + api/repo.js + App.jsx |
| 七、JWT vs cookie/session | sessionId 指向内存会话、不适合分布式；JWT 无状态、任何服务器可 verify；对照表 | readme.md |
| 面试问答 | 无状态模型、sign/verify、token 存储与拦截器、cookie/session vs JWT、zustand 选型、路由守卫 | 综合 |
| 结语 | 链路五环节（签发→存储→携带→拦截→验证）；检查清单 | 综合 |

## 核心结论

- **无状态 + 凭证**：HTTP 无状态，身份靠"登录换凭证、请求带凭证、服务端验凭证"；
- **JWT 两个动作**：sign（登录接口把用户 JSON 签名成 token，可带 expiresIn）与 verify（受保护接口解码回身份，非法抛错 401）；
- **Bearer 前缀约定**：`Authorization: Bearer <token>`，用 `startsWith('Bearer ')` 判断是否登录、`split(' ')[1]` 取 token；
- **zustand 管全局登录态**：`create(set => …)` 建 store，state（token/user）与 action（setAuth/logout）分工，setAuth 同时持久化 localStorage（刷新不丢）；
- **axios 拦截器自动携带**：request 拦截器统一加 `authorization` 头，response 拦截器剥 `res.data`，一处封装全请求生效；
- **路由守卫**：RequireAuth 无 token → `Navigate to="/login" replace`；配合 `location.state.from` 登录后跳回原页；
- **JWT 更适合分布式**：cookie/session 的 session 存某台服务器内存，分布式需共享；JWT 自含身份+签名，任何持有同一 secret 的服务器都能 verify。

## 引用说明

- 全部基于第六十一天提交 `7c86f1a`（"第六十一天 jwt补"）+ `e9716ae`（"第六十一天 jwt上"）：
  - `fe/React/jwt-demo/readme.md`（JWT 无状态认证、zustand、cookie/session 对比、axios 拦截器要点）——`7c86f1a`；
  - `fe/React/jwt-demo/login-demo/mock/user.js`（/api/login 的 jwt.sign 签发 + /api/repo 的 jwt.verify 验证与 401 处理）——`7c86f1a`；
  - `fe/React/jwt-demo/login-demo/src/api/config.js`（axios 实例 + request/response 拦截器）——`7c86f1a`；
  - `fe/React/jwt-demo/login-demo/src/api/user.js`（login 接口封装）——`e9716ae`；
  - `fe/React/jwt-demo/login-demo/src/api/repo.js`（受保护资源 getRepo）——`7c86f1a`；
  - `fe/React/jwt-demo/login-demo/src/store/user.js`（zustand 身份 store + localStorage 持久化）——`7c86f1a`；
  - `fe/React/jwt-demo/login-demo/src/store/todos.js`（zustand 子仓 / 大型项目拆分）——`e9716ae`；
  - `fe/React/jwt-demo/login-demo/src/components/RequireAuth.jsx`（路由守卫）——`e9716ae`；
  - `fe/React/jwt-demo/login-demo/src/components/Nav.jsx`（token 条件渲染）——`7c86f1a`；
  - `fe/React/jwt-demo/login-demo/src/page/Login.jsx`（表单校验 + setAuth + navigate）——`7c86f1a`；
  - `fe/React/jwt-demo/login-demo/vite.config.js`（viteMockServe mock 插件）——`7c86f1a`。
- 未登记 package.json / package-lock.json / App.css / index.css / Login.module.css / main.jsx / Home.jsx / Pay.jsx 等无讲解价值文件。
