# 前端接口工程：axios 统一封装、baseURL 一键切换与 Mock 先行的并行开发

前后端分离后，团队最常见的卡点其实只有一个：**前端在等后端**。后端接口还没写完，前端页面就无从下手——要么干等，要么先用写死的假数据，等接口好了再返工。第五十六天的笔记给了一套可复用的解法：**前端自建接口工程**——用 `/api` 目录统一管理所有接口、用 axios 做标准封装、用 baseURL 一键切换，再用 Mock 让接口先"存在"。于是前端不必等后端，也能把一个 App 完整开发完。

一句话记住核心：**前后端分离后唯一的耦合点是 `/api` 接口请求，而解耦的手段是让前端拥有自己的接口层。** 页面是前端的、路由是前端的、数据接口也可以是前端的——后端只是把真正的数据最终接上来。

---

## 一、前后端职责分离：前端的三驾马车与后端的 API

这个全栈 Todos 项目把职责分得很干净：

- **前端**：react + react-router + zustand（状态管理）。笔记里叫"前端独立开发的三驾马车"——**组件（响应式） + 路由 + 状态管理（银行）**；
- **后端**：node koa + mysql，职责是"提供 api，`/todos` 返回 json 数组"。

页面长什么样、怎么跳转、状态放哪——全是前端自己的事，和后端无关。App.jsx 里用 React Router + 懒加载把两个页面接管起来：

```jsx
// App.jsx
const Home = lazy(() => import('./pages/Home'))
const Todos = lazy(() => import('./pages/Todos'))

function App() {
  return (
    // 路由接管一切；Suspense 为懒加载页面提供加载中的兜底
    <Router>
        <Nav />
        <Suspense fallback={<div>加载中...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/todos" element={<Todos />} />
          </Routes>
        </Suspense>
    </Router>
  )
}
```

既然页面、路由都能独立，那"数据从哪来"呢？这正是唯一的耦合点。笔记问得直接：**"前后端分离了吗？唯一一个耦合——前端要等着后端提供的接口渲染数据状态。"**

---

## 二、解耦的关键：前端不要傻等后端给接口

接口没写好，前端就只能干等吗？不是。笔记里的态度很明确：

> 前端可以独立做路由，前端也可以独立做数据接口（mock，开发阶段）。傻等后端给接口，是下策。

解法是**先把界面写完，用 mock 造数据，等后端把 API 真正写完后，再把请求切过去**。这样前后端各自开发、各自联调，步调不一致的问题就被接口层消化掉了。

而支撑这套做法的，就是前端工程里新增的一环——**接口工程（API 工程）**。

---

## 三、`/api` 目录：前端接口层，统一管理所有接口

前端为什么需要 `api` 目录？笔记给了最朴素的理由：**后端接口往往不能及时提供**。于是前端要在工程里给自己留一个"接口层"，职责有四条：

1. 管理所有的接口；
2. axios 配置；
3. 先伪造数据；
4. baseURL 一键切换。

```text
src/
├── api/          # 前端接口层：一个接口一个模块
│   ├── config.js # axios 实例（baseURL / 超时）
│   └── todos.js  # getTodos 接口封装
├── pages/        # 页面级路由
│   ├── Home.jsx
│   └── Todos.jsx
├── mock/         # mock 接口：伪造后端数据（工程根目录）
└── components/
```

这个目录把"前端要数据"这件事从页面里抽出来：页面不关心数据到底来自 mock 还是真后端，只对着 `api` 模块的函数签名说话。

---

## 四、axios 实例：baseURL 一键切换

`api/config.js` 是整个接口层的底座——一个 axios 实例：

```js
// api 配置文件
import axios from 'axios'

// fetch 缺点是功能小
// app /api/todos -> :3000/todos
// 实例化axios
const instance = axios.create({
  baseURL: '/api', // 基础路径
  // baseURL: 'http://localhost:3000',
  timeout: 5000,
})

export default instance
```

两个细节值得抠：

**1. 为什么从 fetch/xhr 升级到 axios？** 笔记就一句：`fetch 缺点是功能小`。axios 作为标准请求库，把超时、统一配置、拦截器、错误处理这些 App 级请求要用的能力一次性给全，这是从"能发请求"到"能工程化地管请求"的升级。

**2. baseURL 一键切换是什么？** 看那两行 baseURL：

```js
baseURL: '/api',            // 开发阶段：走 /api，由 mock 拦截
// baseURL: 'http://localhost:3000',  // 联调/上线：切到真实后端
```

- 请求 `axios.get('/todos')` 在开发时打到 `http://localhost:5173/api/todos`（5173 是 Vite dev server），由 mock 拦下来返回假数据；
- 后端就绪后，把注释换一下、baseURL 改成 `http://localhost:3000`，同一个请求就打到 koa 的真接口上。

页面代码一行不用改——这就是"一键切换"的含金量。

---

## 五、api 模块：一个接口一个函数

`api/todos.js` 是接口层的第二个例子——**一个模块一个 js 文件，一个接口一个函数**：

```js
// 一个模块一个js文件
import axios from './config'

// api 目录的职责 提供数据接口
// 不是直接就去后端，后端没有开发好，和我们分离
export const getTodos = async () => {
  const res = await axios.get('/todos')
  return res.data
}
```

注意注释点破的分工：**api 目录的职责是"提供数据接口"，而不是"直接去后端"**。后端没开发好、和前端分离，这都不影响前端把接口函数写好——函数签名（`getTodos` 返回 todos 数据）就是前端和后端之间的"契约"，前端先按这个契约开发页面。

---

## 六、页面消费：useEffect + 立即执行函数

`Todos.jsx` 是接口层的消费方——拿到数据、驱动状态、渲染列表：

```jsx
import { getTodos } from '../api/todos'
import { useState, useEffect } from 'react'

function Todos() {
  const [todos, setTodos] = useState([])
  useEffect(() => {
    // 立即执行函数
    (
      async () => {
        const data = await getTodos()
        setTodos(data)
      }
    )();
  }, [])

  return (
    <>
      <h1>Todos</h1>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </>
  )
}
```

两个工程惯例：

- **useEffect 里不能直接用 async**，所以用"立即执行函数"（IIFE）包一层 `async () => {...}()`，在里面 `await` 数据；
- 页面只关心"调用 `getTodos()` 得到数据、`setTodos` 进状态、`todos.map` 渲染"——**数据从 mock 来还是从后端来，页面一无所知**，这正是接口层存在的意义。

---

## 七、Mock 先行：让接口先"存在"

数据从哪来？答案是 `mock/` 目录 + `vite-plugin-mock`。先看 Vite 配置怎么启用：

```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteMockServe } from 'vite-plugin-mock'

export default defineConfig({
  plugins: [react(), viteMockServe({
    mockPath: 'mock',     // mock 文件放在哪个目录
    localEnable: true,    // 本地开发启用 mock
  })],
})
```

再看来 `mock/todos.js` 里一个 mock 接口长什么样：

```js
export default [
  {
    url: '/api/todos',     // 拦截的接口地址
    method: 'GET',
    timeout: 1000,         // 模拟 1s 网络延迟
    response: () => {
      return {
        code: 0,           // 成功
        todos: [
          { id: 1, title: '学习前端接口工程', completed: true },
          { id: 2, title: '看龙餐馆', completed: false },
        ]
      }
    }
  }
]
```

几个要点：

- **每个 mock 接口 = `{ url, method, response }`**，`response` 返回模拟的真实响应体；
- **接口级路由 `/api/todos` 不是 react-router-dom 处理的范围**。笔记专门强调了这套区分：页面级路由（`pages/...`）由 react-router 管，接口级路由（`/api/...`）由 api 目录 + mock 管，两者互不越界；
- **`timeout: 1000` 故意模拟网络延迟**，让开发阶段就能体验真实的加载节奏，而不是瞬时返回。

开发时，`/todos` 页面发起 `getTodos()`，请求在 dev server 上被 `viteMockServe` 拦下，`/api/todos` 命中 mock，返回上面的 JSON。**前端在没有任何后端代码的情况下，已经能完整跑通"页面 → api → 数据 → 渲染"整条链路。**

> 一个值得留意的工程点：mock 的 `response` 用了 `{ code, todos }` 这种"包一层"的结构，更贴近真实后端约定；而页面里 `setTodos(data)` 直接把整个响应对象当列表用。两边的"契约"还没完全对齐——真实项目里，要么在 api 模块里解构 `data.todos`，要么让页面消费 `code` 做错误判断。mock 阶段暴露出的这个问题，恰好说明**接口契约要先行**，mock 的数据结构要按真实接口的约定来写。

---

## 八、联调：从 Mock 切回真后端

后端把 API 真正写完后，联调就一步：

```js
baseURL: '/api',
// baseURL: 'http://localhost:3000',
```

把 `baseURL` 从 `/api` 切到 `http://localhost:3000`，mock 阶段写好的页面、api 模块原封不动，请求直接打到 koa。**后端 koa + mysql 负责把 `/todos` 的 json 数组真正端上来，前端早已就绪。** 唯一耦合点还是那个 `/api`，但这次是谁也不等谁——前后端真正并行。

---

## 九、面试问答

**问：前后端分离后，唯一的耦合点在哪？怎么解耦？**

> 耦合点只有一个：`/api` 接口请求——前端需要后端提供接口来渲染数据状态。解耦的手段是前端自建接口层：用 `api` 目录统一管理接口、用 mock 伪造数据先把界面写完，等后端接口就绪后再通过 baseURL 一键把请求切到真实后端。这样前端不依赖后端接口的进度，前后端可以并行开发。

**问：前端为什么需要独立的 api 目录（接口层）？**

> 因为后端接口往往不能及时提供。前端接口层负责四件事：管理所有接口、axios 配置、先伪造数据、baseURL 一键切换。它让"前端要数据"这件事从页面里抽离出来——页面只对着 api 模块的函数签名说话，不关心数据来自 mock 还是真实后端。这是前端工程里独立的一环，即"接口工程（API 工程）"。

**问：fetch 有什么缺点，为什么要用 axios？**

> 笔记的原话是"fetch 缺点是功能小"。axios 是标准请求库，提供了 App 级请求需要的一整套能力：统一 baseURL 配置、超时控制、请求/响应拦截器、统一的错误处理。从"能发请求"到"工程化地管请求"，需要 axios 这种封装好的标准库。

**问：baseURL 一键切换是怎么实现的？**

> axios 实例上配置 `baseURL`，开发阶段设为 `'/api'`（走 Vite dev server，由 vite-plugin-mock 拦截返回假数据），联调/上线时切换为真实后端地址（如 `http://localhost:3000`）。页面和 api 模块代码一行不改，只动 config.js 里这一个配置，就能把请求从 mock 切到真实后端。

**问：vite-plugin-mock 是怎么工作的？mock 的配置长什么样？**

> 在 vite.config.js 里启用 `viteMockServe({ mockPath: 'mock', localEnable: true })`，插件会扫描 mock 目录下的文件。每个 mock 接口是一个对象 `{ url, method, timeout, response }`：url 是拦截的接口地址，response 返回模拟的响应体，timeout 可模拟网络延迟。开发时请求打到 dev server 即被拦下，命中对应 url 返回假数据。

**问：页面级路由和接口级路由有什么区别？**

> 页面级路由（`pages/...`，如 `/todos`、`/`）由 react-router-dom 处理，决定"用户看到哪个页面"；接口级路由（`/api/...`，如 `/api/todos`）决定"数据从哪来"，由 api 目录 + mock 处理，不属于 react-router-dom 的范围。两者是两套路由体系，分工不同。

**问：mock 数据和真实接口怎么无缝切换？**

> 关键在 mock 的数据结构要按真实接口的约定来写（契约先行）。切换时只改 config.js 的 baseURL，页面和 api 模块的代码保持不变。mock 阶段就应该用真实的响应结构（如 `{ code, todos }`），这样切到后端时，api 模块的返回结构才不用跟着改。

---

## 结语：前端接口工程，让前后端真正并行

这一天把"前后端分离"补上了最后一环——**数据接口也可以由前端独立开发**：

```text
职责    前端（组件+路由+状态）  |  后端（koa+mysql 提供 /todos）
耦合    唯一的耦合点：/api 接口请求
解耦    前端接口层：api 目录 + axios 封装 + baseURL 一键切换
并行    Mock 先行：vite-plugin-mock 伪造接口，前端不等后端
联调    baseURL 切换，从 mock 切回真实后端，谁也不用等谁
```

动手前，拿这份清单自检：

- [ ] 前后端分离后，是否意识到 `/api` 是唯一的耦合点，而不是把耦合扩散到页面各处？
- [ ] 是否用 `api` 目录统一管理所有接口，而不是在页面里散落 `fetch`/`axios.get`？
- [ ] 是否用 axios 实例统一配置 `baseURL` 与超时，而不是每个请求各写一遍？
- [ ] 后端接口没就绪时，是否用 mock 先行开发，而不是傻等后端或写死假数据？
- [ ] mock 的数据结构是否按真实接口的契约来写（如 `{ code, todos }`），保证切换时不用改代码？
- [ ] 页面消费数据时，是否只对着 api 模块的函数签名说话，不关心数据来自 mock 还是后端？
- [ ] 是否清楚页面级路由（react-router）与接口级路由（`/api`）是两套体系，各司其职？

后端没写完，前端先把整个 App 跑起来——这，就是接口工程的价值。
