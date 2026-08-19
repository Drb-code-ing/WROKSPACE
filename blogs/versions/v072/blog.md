# JWT 登录鉴权：无状态凭证的颁发与验证、zustand 全局状态，与 axios 拦截器的自动携带

HTTP 是一个**无状态（Stateless）**协议：每一次请求都是独立的，服务端处理完就"忘了"你。那"你是谁"这个问题怎么解决？第六十一天的笔记用一个完整的登录 demo（react + react-router-dom + zustand + axios + vite-plugin-mock）把整条鉴权链路打通了——**登录一次拿到一张"凭证"，之后每次请求自动带上它，服务端验凭证认人**。这条链路的每一环——凭证怎么签发、前端怎么保存、路由怎么拦截、请求怎么自动携带——就是本篇要拆的内容。

---

## 一、无状态的 HTTP，靠凭证记住用户

HTTP 无状态，意味着服务端不会在内存里默默记住"你上次登录过"。要让服务端认识你，唯一的方式是：**请求里带上能证明身份的东西**。

笔记给了一条最经典的约定：

- `Header Authorization`：`Bearer Token`——请求头里带一段"鉴权码/凭证"，服务端据此认出你；
- 先走 `/login`：用账号密码换 token。登录成功后，服务端把用户身份（`{ id, username, role }`）这个 JSON 对象做一次单向操作，生成 JWT 颁发给你。

之后的每一次请求都带上 token → 服务端解码出 JSON 对象 → 就知道"是你"了。整个思路一句话：**登录换凭证，请求带凭证，服务端验凭证。**

---

## 二、JWT 的两个动作：sign 签发、verify 验证

JWT 全称 JSON Web Token。笔记强调它只有**两个动作**：

- **sign（签发）**：把一个用户 JSON 对象签名成 token；
- **verify（验证）**：把 token 解码回 JSON 对象。

这个 demo 没有真正的后端，用 `vite-plugin-mock` 在开发环境"伪造"了一个服务端（`mock/user.js`）。先看**登录接口 `/api/login`**，它负责校验账号密码并**签发** token：

```js
import jwt from 'jsonwebtoken';
const secret = 'secret819!$'

// /api/login
{
  url: '/api/login',
  method: 'post',
  response: req => {
    const body = req.body;
    if (body.username !== 'admin' || body.password !== '123456') {
      return { code: -1, message: 'username or password 错误' }
    }
    // 服务器端给用户颁发 token：把 user JSON 对象放进去，用秘密 key 加盐签名
    const token = jwt.sign(
      { user: body.username, role: 'admin' },   // 身份 JSON 对象
      secret,                                    // 加盐的秘密 key
      { expiresIn: 86400 }                       // 有效期 24 小时
    )
    return { code: 0, user: { username: body.username }, token }
  }
}
```

服务端校验账号密码通过后，调用 `jwt.sign` 把身份对象签名成 token 返回。注意 `expiresIn: 86400`——token 带了**有效期**，24 小时后自动失效，这也是"凭证"该有的属性。

再来看**受保护接口 `/api/repo`**，它负责**验证**请求里的 token，这就是"凭证"起作用的地方：

```js
// /api/repo 受保护接口
{
  url: '/api/repo',
  method: 'get',
  response: req => {
    // 未登录时请求头里没有 authorization，不能直接调用 split
    const authorization = req.headers?.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      return { code: 401, msg: 'Missing authorization token' };
    }
    // Bearer XXXX：取出 Bearer 后面的 JWT 字符串
    const token = authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(token, secret);   // 验证 token，解出身份
      return { code: 0, data: decoded.user }
    } catch {
      return { code: 401, msg: 'Invalid token' }
    }
  }
}
```

这里藏着两个要点：

1. **从 `Bearer ` 前缀判断是否登录**。约定是 `authorization: Bearer <token>`，所以先用 `startsWith('Bearer ')` 判断；没带就直接 401。
2. **`jwt.verify` 要么解出身份、要么抛错**。token 合法且未过期，`verify` 就把签名时的 JSON 对象解出来；被篡改或过期，直接抛异常走 `catch` 返回 401。

一句话概括 JWT 的用法：**签发时 `sign` 把你放进 token，验证时 `verify` 把你取回来。** 服务端只认签名、不存会话，这就是它无状态的底气。

---

## 三、zustand：把登录态搬进全局 store

登录之后，前端面临一个现实问题：**"我登录了没、我是谁"这个状态，Home、Pay、Nav、Login 每个页面都可能要知道**。如果靠 props 一层层传，跨路由根本传不动；靠 `createContext + useContext` 也能做，但需要一个 Provider 把全树包起来。笔记给出的方案是 **zustand**——一个轻量级的状态管理框架，用"全局 store"统一管状态。

```js
// src/store/user.js  全局负责提供用户身份状态
import { create } from 'zustand'

export const useAuthStore = create(set => ({
  token: JSON.parse(localStorage.getItem('token')) || '',  // 初始从 localStorage 恢复
  user: null,
  // actions 操作 state
  setAuth: ({ token, user }) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ token, user })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ token: '', user: null })
  }
}))
```

几个值得说的设计：

- **`create(set => ({...}))`**：`create` 是一个高阶函数，接收一个函数作参数，`set` 是修改状态的方法，返回的对象就是全局状态。任何组件 `useAuthStore(state => state.token)` 一取，就拿到了共享的 token。
- **持久化到 localStorage**：`setAuth` 在更新内存状态的同时写入 localStorage；初始值也从 localStorage 恢复。这样**刷新页面登录态不丢**，token 依然有效。
- **state 与 action 分工**：`token/user` 是状态，`setAuth/logout` 是操作状态的 actions。组件只跟 actions 打交道，改状态的细节封装在 store 里。

笔记用一句话点出了它的思想：**React App = UI Component + Store**——组件负责渲染，store 负责状态。登录与否、用户信息这种全局共享、跨路由的状态，交给 zustand 统一管理，组件之间就不用再为共享状态折腾传递了。（大型项目还可以像 `todos.js` 那样拆出多个子 store，各管一摊。）

---

## 四、登录流程串联：表单校验 → 调接口 → 存全局

前面几环都备齐了，登录页把它们串起来（`src/page/Login.jsx`）。先是**实时校验**：用户名至少 3 位、密码至少 6 位，不合法就提示、并禁用提交按钮：

```jsx
const errors = { username: '', password: '' };
if (!formData.username.trim()) {
  errors.username = '用户名不能为空';
} else if (formData.username.length < 3) {
  errors.username = '用户名至少3位';
}
if (!formData.password.trim()) {
  errors.password = '密码不能为空';
} else if (formData.password.length < 6) {
  errors.password = '密码至少6位';
}
const isValid = !errors.username && !errors.password;
// ...
<button type="submit" disabled={!isValid}>登录</button>
```

提交时：**调登录接口 → 拿到 token → 写进全局 store → 跳回原页面**：

```jsx
const setAuth = useAuthStore(state => state.setAuth); // zustand 设置状态

const handleLogin = async e => {
  e.preventDefault();
  try {
    const res = await login(formData);              // 调 /api/login
    if (res.code === 0) {
      setAuth({ token: res.token, user: res.user }); // 写进全局 store（同时持久化）
      navigate(from, { replace: true });             // 登录成功后跳回原页面
    } else {
      alert(res.message || '登录失败');
    }
  } catch (err) {
    alert('登录失败');
  }
};
```

`login` 本身只是 axios 的一层薄封装（`src/api/user.js`）：`axios.post('/login', data)` 然后 `return res.data`。而 `from` 来自路由的 `location.state`——**守卫把"你从哪个页面被拦下来的"记下来**，登录成功就跳回去，体验很顺。

---

## 五、路由守卫：RequireAuth 拦住未登录的人

有些路由（比如 `/pay`）必须登录才能看。做法是写一个**路由守卫组件 `RequireAuth`**，在路由配置里把受保护页面包起来：

```jsx
// src/components/RequireAuth.jsx
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/user'

function RequireAuth({ children }) {
  const token = useAuthStore(state => state.token)
  // 如果没有 token，重定向到登录页
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}
```

在 `App.jsx` 的路由表里，`/pay` 就用它包一层：

```jsx
<Route path="/pay" element={
  <RequireAuth>
    <Pay />
  </RequireAuth>
} />
```

判断逻辑极简：**store 里有没有 token？** 没有 → `<Navigate to="/login" replace />` 重定向去登录（`replace` 替换历史记录，防止"返回"又退回受保护页）；有 → 正常渲染子页面。守卫里什么都不查、什么都不改，只做"放行或拦截"的决策，职责非常干净。

导航栏 `Nav.jsx` 也根据登录态做条件渲染：没登录显示 Login 入口，登录了显示用户名和 Logout 按钮，靠的同样是 store：

```jsx
const token = useAuthStore(state => state.token)
const user = useAuthStore(state => state.user)
const logout = useAuthStore(state => state.logout)

{!token && <Link to="/login">Login</Link>}
{user && <a>${user.username}</a>}
{token && <button onClick={handleLogout}>Logout</button>}
```

---

## 六、axios 拦截器：让每次请求自动带上 token

到这里还差最后一环：**登录后，后续请求怎么把 token 带上？** 如果每个接口都手写 `headers`，既啰嗦又容易漏。axios 的**拦截器（interceptors）**就是为这个设计的——"默默做了很多"：

```js
// src/api/config.js
import axios from 'axios'

const instance = axios.create({
  baseURL: '/api',        // 所有请求自动加 /api 前缀，配合 vite mock
  timeout: 2000,
})

// 请求拦截器：每个 axios 请求都被拦截下来
instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    // 自动带上 token
    config.headers['authorization'] = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：直接拿服务端返回的数据
instance.interceptors.response.use(res => {
  return res.data
})

export default instance
```

拆开看：

- **request 拦截器**：每次发请求前，从 localStorage 取 token，塞进 `config.headers['authorization'] = 'Bearer ' + token`，然后 `return config` 放行。**一个地方写好，所有请求都自动带上 token**，这就是"自动携带"。
- **response 拦截器**：把 `response` 剥一层壳，直接返回 `res.data`。所以业务代码里 `const res = await login(formData)` 拿到的就是数据本体，不用每个调用处再写 `.data`。

于是整条链闭环了：**后端签发一次 token → 前端存进 localStorage → 拦截器每次自动携带 → 受保护接口 verify 通过**。前端 `App.jsx` 里甚至直接在挂载时调了一下受保护接口 `getRepo()`，来验证这套链路是否真的通了。

---

## 七、JWT vs cookie/session：为什么 JWT 更适合分布式

理解 JWT 最好有个对照物：经典的 **cookie/session** 登录方案。

- **cookie 方案**：登录后服务端在内存里建一个 `sessionId → session 对象` 的映射，把 sessionId 写进 cookie；浏览器每次请求**自动带上 cookie**，服务端拿 sessionId 去内存里查会话对象。
- **问题**：session 存在**某一台服务器的内存**里。请求打到别的服务器，那里没有这个 session，就认不出你——**不太适合分布式**。要多机共享就得引入 Redis 之类的中心化存储。

**JWT 就没有这个问题**：token 本身就是"身份 + 签名"，不依赖任何服务端内存。**任何一台服务器，只要持有同一个 secret，都能把别人签发的 token 解码出来**。请求打到哪台机器都无所谓——签名可验，身份自明。这就是"无状态"最实在的收益。

| | cookie/session | JWT |
| --- | --- | --- |
| 凭证 | sessionId（指向内存会话） | token（自含身份 + 签名） |
| 服务端状态 | 需要，session 存内存 | 不需要，纯无状态 |
| 分布式 | 需中心化共享会话 | 任何服务器都可 verify |
| 前端携带 | 浏览器自动带 cookie | 手动放 Header，拦截器统一带 |

---

## 面试问答

**问：HTTP 是无状态的，服务端怎么记住"你是谁"？**

> 靠"凭证"。用户先走登录接口换一张凭证（JWT token），之后的每次请求都在 `Authorization: Bearer <token>` 里带上它；服务端验证凭证、解出身份，就知道是谁。无状态 + 每次携带凭证，就是 HTTP 身份认证的基本模型。

**问：JWT 的两个核心动作是什么？**

> sign（签发）和 verify（验证）。登录时服务端用 `jwt.sign` 把用户 JSON 对象（`{ user, role }`）用 secret 加盐签名成 token，可带 `expiresIn` 有效期；受保护接口用 `jwt.verify` 把 token 解码回身份对象。verify 对合法 token 返回身份，对篡改或过期 token 抛错（返回 401）。

**问：token 前端存在哪、怎么保证每次请求都带上？**

> 存 localStorage，刷新不丢。用一个 axios 实例的 **request 拦截器**统一处理：每次发请求前从 localStorage 取 token，写进 `config.headers['authorization'] = 'Bearer ' + token`。一处封装，所有请求自动携带。

**问：cookie/session 和 JWT 的区别？为什么 JWT 更适合分布式？**

> cookie/session 靠 sessionId 指向服务端内存里的会话对象，请求需要命中持有该 session 的服务器（分布式要额外上 Redis 共享）；JWT 的 token 自含身份和签名，不依赖服务端内存，**任何持有同一 secret 的服务器都能 verify 解码**，天然适合分布式。

**问：react 里为什么用 zustand 管登录态？**

> 登录态（有没有 token、用户是谁）是全局共享、跨路由的状态，Home/Pay/Nav/Login 都要读。props 跨路由传不动，Context 需要 Provider 包裹全树；zustand 用全局 store 统一管理，任何组件 `useAuthStore(state => ...)` 直接取，登录态还能持久化到 localStorage。思想是 **React App = UI Component + Store**。

**问：如何实现"未登录跳登录页"的路由守卫？**

> 写一个 `RequireAuth` 组件包住受保护页面：从 store 取 token，没有就 `return <Navigate to="/login" replace />` 重定向，有就渲染 children。在路由表里把受保护路由的 element 用 `<RequireAuth><Pay /></RequireAuth>` 包一层即可。配合 `location.state.from` 记录来源，登录成功后能跳回原页面。

---

## 结语：一条完整的登录鉴权链路

第六十一天的 demo 虽然只用 mock 做了服务端，但整条鉴权链路是完整的、可迁移到真实后端的：

```text
登录凭证    /login 校验账号 → jwt.sign 签发 token（带有效期）
前端存储    setAuth 写入 zustand 全局 store + localStorage
自动携带    axios request 拦截器统一加 Authorization: Bearer <token>
路由拦截    RequireAuth 无 token 重定向 /login
服务端验证  受保护接口 jwt.verify 解出身份，非法即 401
```

动手前，拿这份清单自检：

- [ ] 能否说清"HTTP 无状态 + 请求带凭证"的身份认证模型？
- [ ] 能否讲出 JWT 的 sign/verify 两个动作分别在哪发生、怎么配合？
- [ ] 能否说清 token 为什么存 localStorage，请求拦截器如何自动携带？
- [ ] 能否讲出 zustand 的 `create(set => ...)` 里 state 与 action 的分工？
- [ ] 能否写一个 `RequireAuth` 路由守卫并解释 `replace` 的作用？
- [ ] 能否说清 cookie/session 与 JWT 在分布式场景下的差异？
- [ ] 能否解释 `Authorization: Bearer <token>` 里 `Bearer ` 前缀的作用？

掌握了这一套，你就把"登录"从一个按钮变成了一条**可解释、可迁移、可扩展**的完整链路——换掉 mock 接真实后端时，前端代码几乎不用动。
