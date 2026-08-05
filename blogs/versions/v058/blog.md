# 前端路由的第一性原理：从 hashchange 手写路由，到 React Router 的嵌套与懒加载

早期 PC 时代，点击一个链接就意味着整页刷新：浏览器重新请求 HTML、重新下载资源、重新渲染整个页面。网络慢一点，页面就"白一下"。

移动时代用户对体验的要求变了——**能不能在一个网页里切换"多个页面"，而不用重新加载整个页面？**

这个问题的答案，就是前端路由。而它的起点，比 React、Vue 都要古老：浏览器 URL 中的 `#` 号。

本文从传统多页应用为什么慢讲起，先用手写的方式实现一个 `HashRouter`，再把它升级成 React Router 的完整集成，最后落到懒加载、嵌套路由、404 兜底这些实战配置。

---

## 一、传统多页面：为什么每次跳转都要"白一下"

先看一次传统的页面跳转到底发生了什么：

```text
用户点击 <a href="/about">
  → 浏览器向 server 发起 http 请求
  → server 返回 text/html 响应
  → 浏览器解析并重新渲染整个页面
  → 浏览历史插入一条新记录
```

`<a href="">跳转</a>` 链接在 PC 时代是天经地义的。但它有两个代价：

- **慢**：每次都要重新请求 HTML、重新下载并执行 JS/CSS；
- **浪费**：整个页面重新渲染，其实往往只是换了一块内容区域。

移动端时代，原生 App 的体验是"点击 → 局部变化"，用户回不去了。于是有了**单页应用（SPA，Single Page Application）**：

```text
第一次加载完整页面
之后点击链接 → 只替换页面上的一小块内容（DOM 或组件）
→ 不再重新请求整个 HTML
```

SPA 的关键诉求是：**URL 和资源一一对应，但页面不重新加载。** 想要"url 变了，页面不刷新"，最朴素的手段就是 URL 里的 `#` 号。

---

## 二、先看懂 URL：`#` 之后的才是 hash

把一条 URL 拆开看：

```text
http(s)://www.baidu.com/u/123?a=1&b=2#/page1
└─协议─┘  └──host──┘ └path─┘└queryString┘└hash┘
```

| 部分 | 例子 | 作用 |
| --- | --- | --- |
| `protocol` | `http(s)://` | 协议，决定怎么跟 server 对话 |
| `host` | `www.baidu.com` | 服务器地址 |
| `path` | `/u/123` | 服务器上的资源路径 |
| `queryString` | `?a=1&b=2` | 查询参数 |
| `hash` | `#/page1` | 以 `#` 开始的片段标识 |

`hash` 最初是给**锚链接**用的：标记一个长页面里的某个位置，点击后浏览器直接"坐电梯"滚到那里，不做任何网络请求。

锚点这个能力恰好暗合了 SPA 的需求：

```text
改变 hash → URL 变了（局部）→ 页面不会跳转、不会重新加载
```

所以前端路由的初代方案几乎都选了 hash：

```text
#/     → 首页
#/about → 关于页
#/user/123 → 用户页
```

**只要 URL 变了、且能对应到不同资源，前端就能根据 URL 决定渲染什么内容。** 这就是 hash 路由。

> 引申：`restful` 强调"一切皆资源"，URL 就是资源的地址。前端路由本质上是把"资源地址"和"前端 UI"重新映射了一遍。

---

## 三、`hashchange`：hash 变了，浏览器会通知你

当 `#` 后面的部分改变时，浏览器会触发 `hashchange` 事件。先用一个最小示例感受它：

```html
<a name="top">顶部</a>
<a href="#bottom">去到底部</a>
<!-- 一段很长的页面 -->
<div style="height: 200vh;"></div>
<a href="#top">回到顶部</a>

<script>
  window.addEventListener('hashchange', function () {
    console.log('hash 改变了')
    console.log(event.newURL)
    console.log(event.oldURL)
  })
</script>
```

点击锚点时，事件对象里能拿到 `newURL` 和 `oldURL`。这说明浏览器已经帮我们完成了最重要的基础设施：**监听 hash 变化，并告诉我们变化前后的 URL。**

前端路由要做的事就顺理成章了：

```text
1. 点击链接，hash 改变
2. 触发 hashchange 事件
3. 读取新的 hash 部分
4. 根据 hash 找到对应的渲染函数（或组件）
5. 替换挂载点里的内容
```

---

## 四、手写一个 HashRouter

有了上面 5 步，一个最简路由也就 30 行左右。核心数据结构是一个"注册表"：

```js
// hash → 渲染回调 的映射表
class HashRouter {
  constructor() {
    this.routers = {} // 前端路由集合：hash → callback
    // 绑定 this：事件回调里的 this 指向触发事件的 window
    window.addEventListener('hashchange', this.load.bind(this))
  }

  load() {
    // location.hash 形如 "#/page1"，slice(1) 去掉 "#"
    const hash = location.hash.slice(1)
    const handler = this.routers[hash]
    handler && handler()
  }

  // 注册一条路由：hash 是什么，就渲染什么
  register(hash, callback) {
    this.routers[hash] = callback
  }
}

// 使用
const router = new HashRouter()
const container = document.getElementById('container')

router.register('/page1', () => {
  container.innerHTML = '<h1>页面1</h1>'
})
router.register('/page2', () => {
  container.innerHTML = '<h1>页面2</h1>'
})
router.register('/page3', () => {
  container.innerHTML = '<h1>页面3</h1>'
})
```

对应到刚才的 5 步：

```text
点击 <a href="#/page1">
  → hash 变成 "#/page1"
  → hashchange 触发
  → load() 里 location.hash.slice(1) === "/page1"
  → 从 this.routers 查到 /page1 的回调
  → container.innerHTML 换成"页面1"
```

三个细节值得留意：

### 1. 为什么用 `bind(this)`？

事件监听的回调里，`this` 默认指向触发事件的 `window`，而不是 `HashRouter` 实例。于是监听时用了 `this.load.bind(this)`，把 `load` 内部的 `this` 固定到实例上。

```text
apply / call → 立即执行，只是手动指定 this 的方式不同
bind        → 返回一个新函数，把 this 永久绑定
```

### 2. `location.hash.slice(1)` 在干嘛？

`location.hash` 返回的是带 `#` 的字符串（如 `"#/page1"`），`slice(1)` 把它变成 `/page1`，正好和注册时的 key 对上。

### 3. 一个常见的坑

手写时很容易出现 `this.router = {}`（声明）和 `this.routers[hash]`（使用）不一致的笔误。练习时建议统一命名，并且把"注册表"单独抽出来理解：**它就是一个 hash → 回调的 Map。**

到这里，我们已经用浏览器原生能力实现了一个可用的前端路由。接下来把它交给框架。

---

## 五、React Router：把"手写路由"工程化

React 生态里做 SPA 路由的标配是 `react-router-dom`。开发一个 React 前端应用的"全家桶"大致是：

| 库 | 职责 |
| --- | --- |
| `react` | 组件开发，响应式 UI |
| `react-router-dom` | 给应用加前端路由（SPA） |
| `zustand` / `pinia` | 状态管理 |

React Router 并没有发明新原理——它仍然可以选择 `HashRouter`（基于 `location.hash`），只是把注册表、监听、渲染都封装成了组件。

一个最小配置：

```jsx
import {
  HashRouter as Router, // 前端路由容器：基于 location.hash
  Routes,                // 路由配置的"数组"
  Route,                 // 一条路由配置项
  Navigate,              // 重定向
} from 'react-router-dom'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/user/:id" element={<User />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}
```

三个组件各司其职：

| 组件 | 作用 |
| --- | --- |
| `<HashRouter>` | 提供路由环境，监听 hash 变化 |
| `<Routes>` | 存放全部路由配置，匹配"当前 URL" |
| `<Route>` | 一条配置：`path` 匹配什么地址，`element` 渲染什么组件 |

`<Routes>` 里**有且只有一个** `<Route>` 会命中当前的 `location.hash`，它就是"既是配置、又是出现的地方"。

---

## 六、为什么用 `Link`，而不是 `<a>`？

导航栏用原生 `<a>` 也能写，但会踩回第一节的老问题——整页刷新。React Router 提供了 `Link`：

```jsx
import { Link } from 'react-router-dom'

function Navigation() {
  return (
    <nav>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/user/123">小家</Link></li>
        <li><Link to="/products/123">商品详情</Link></li>
        <li><Link to="/products/new">商品新增</Link></li>
      </ul>
    </nav>
  )
}
```

`<a>` 和 `<Link>` 的区别：

| | `<a href>` | `<Link to>` |
| --- | --- | --- |
| 点击行为 | 浏览器整页跳转 | 拦截点击，交给 React Router 处理 |
| 页面刷新 | 会刷新，重新请求 HTML/JS/CSS | 不刷新，只更新组件 |
| hashchange | 会触发 | 被框架接管，内部处理 |

`Link` 的语义是"二次处理点击事件"：**不刷新页面、不触发 `hashchange`，由 React Router 在 SPA 内部完成切换。** 这也是"路由"这件事在框架里的正确打开方式。

---

## 七、动态路由：`/user/:id` 与 `useParams`

导航里有个链接是 `/user/123`，但 `123` 是写死的。真实场景里 id 应该是从地址里取出来的。React Router 用冒号声明"动态段"：

```jsx
<Route path="/user/:id" element={<User />} />
```

组件里通过 `useParams()` 取出参数：

```jsx
import { useParams } from 'react-router-dom'

function User() {
  // useParams 必须在 Router 内部的组件中调用
  const { id } = useParams()
  return (
    <div>
      <h1>User {id}</h1>
    </div>
  )
}
```

于是：

```text
地址        → 匹配的 path  → useParams 结果
/user/123   → /user/:id   → { id: "123" }
/user/456   → /user/:id   → { id: "456" }
```

一个 `<Route>` 就能服务无数个不同 id 的地址，这是动态路由最大的价值。商品详情的 `/products/:productId` 也是同一套机制。

注意一个约束：`useParams` 只能在 **Router 内部的组件**里调用——它依赖路由上下文提供参数。

---

## 八、嵌套路由：`Outlet` 让父路由"让位"

商品模块很常见：商品列表页外面有一个公共外壳，里面再套详情页、新增页。这就是嵌套路由：

```jsx
<Route path="/products" element={<Products />}>
  <Route path=":productId" element={<ProductDetail />} />
  <Route path="new" element={<NewProduct />} />
</Route>
```

父路由组件里用一个 `<Outlet />` 声明"子路由内容渲染在这里"：

```jsx
import { Outlet } from 'react-router-dom'

function Products() {
  return (
    <div>
      <h1>Products</h1>
      {/* 嵌套路由：渲染子路由组件 */}
      <Outlet />
    </div>
  )
}
```

注意子路由的 `path` **不用写全**：`new` 和 `:productId` 都是相对父路由 `/products` 的。浏览器里的实际地址是：

```text
/products        → Products（没有子路由命中，Outlet 为空）
/products/123    → Products + ProductDetail
/products/new    → Products + NewProduct
```

嵌套路由的好处是**布局复用**：公共的页头、面包屑、边栏放在父组件，子页面只管自己的内容，不需要每个页面重复写一遍外壳。

---

## 九、路由懒加载：别让首页背下所有页面

SPA 把所有页面打包进一个 bundle，页面越多，首屏加载越慢。把"下载执行"推迟到"需要时才发生"，就是懒加载。

```jsx
import { lazy, Suspense } from 'react'

// 静态 import：打包时全部一起下载
// import Home from './pages/Home'

// 懒加载：只在需要时才下载执行
const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const User = lazy(() => import('./pages/User'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Products = lazy(() => import('./pages/Products'))
const ProductDetail = lazy(() => import('./pages/Products/ProductDetail'))
const NewProduct = lazy(() => import('./pages/Products/NewProduct'))
```

`lazy` 返回的组件在被渲染时才会去加载对应模块。但加载需要时间，这期间 UI 要有一个占位——用 `Suspense` 包住路由区：

```jsx
<Router>
  <Suspense fallback={<div>Loading...</div>}>
    <Navigation />
    <div id="container">
      <Routes>{/* ...路由配置... */}</Routes>
    </div>
  </Suspense>
</Router>
```

```text
静态 import → 打包成一个文件，首屏一次性下载
lazy import → 拆成多个 chunk，进入哪个页面才下载哪个
Suspense    → 模块还在下载时，先渲染 fallback（Loading...）
```

衡量维度很直接：**首页/页面加载速度。** 懒加载让首屏只下载首页真正需要的代码，其余页面按需到达。

---

## 十、404 兜底、重定向与编程式导航

### 1. 兜底路由 `path="*"`

用户输入一个不存在的地址时，需要一个兜底：

```jsx
<Route path="*" element={<NotFound />} />
```

### 2. 重定向 `Navigate`

旧地址想跳转新地址，用声明式重定向：

```jsx
<Route path="old-path" element={<Navigate replace to="/new-path" />} />
```

`replace` 表示替换当前历史记录，而不是新增一条，避免用户点"返回"又回到旧地址。

### 3. 编程式导航：`useNavigate` vs `location.href`

404 页面里常见的需求是"3 秒后自动回首页"：

```jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function NotFound() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      // location.href = '/'   // 整页刷新：重新请求 HTML/JS/CSS
      navigate('/')            // SPA 内部切换：只更新组件，不重新加载资源
    }, 3000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div>
      <h1>404 Not Found</h1>
    </div>
  )
}
```

关键对比：

| 方式 | 行为 | 代价 |
| --- | --- | --- |
| `location.href = '/'` | 浏览器整页跳转 | 重新加载资源，所有 state 丢失，白屏 |
| `navigate('/')` | SPA 内部路由切换 | 不刷新，状态保留，性能好 |

同时注意 `useEffect` 里清理定时器：组件卸载时 `clearTimeout`，避免切走后定时器还在执行。`navigate` 作为依赖放进数组，是因为它参与了副作用逻辑。

---

## 十一、面试问答

**问：hash 为什么能用来做前端路由？**

> 改变 URL 的 hash 部分时，页面不会触发重新加载，但 URL 确实变了，能满足"URL 与资源一一对应"。前端监听 `hashchange`，根据新的 hash 决定渲染什么内容。URL 变了（局部），页面却不刷新，正好是 SPA 需要的行为。

**问：`hashchange` 事件什么时候触发？**

> 当 URL 中 `#` 后面的部分发生变化时触发。事件对象里能拿到 `newURL` 和 `oldURL`。点击锚链接、修改 `location.hash`、手动改变 URL 的 hash 都会触发。

**问：`Link` 和 `<a>` 有什么区别？**

> `<a href>` 点击会触发浏览器整页跳转，重新请求并渲染整个页面；`Link` 是 React Router 提供的组件，拦截点击事件，在 SPA 内部完成路由切换，不刷新页面、不触发 `hashchange`，状态保留、性能更好。

**问：动态路由怎么用？**

> 在 `path` 里用冒号声明动态段，如 `/user/:id`；组件内用 `useParams()` 拿到参数对象 `{ id }`。一个 `<Route>` 可以匹配 `/user/123`、`/user/456` 等无数地址。`useParams` 只能在 Router 内部组件中调用。

**问：嵌套路由的 `Outlet` 是干什么的？**

> `Outlet` 是父路由组件里的一个占位，子路由匹配到的组件会渲染在这个位置。子路由的 `path` 相对父路由书写，如父 `/products` + 子 `new` = 地址 `/products/new`。它让公共布局只写一次，子页面各管各的内容。

**问：路由懒加载怎么做？**

> 用 `lazy(() => import('./pages/Home'))` 按需加载页面模块，再用 `<Suspense fallback={<div>Loading...</div>}>` 包裹路由区域，模块下载期间先渲染 fallback。它把打包拆成多个 chunk，首屏只加载首页需要的代码，提升首页加载速度。

**问：`navigate('/')` 和 `location.href = '/'` 的区别？**

> `location.href` 是浏览器整页跳转，会重新请求 HTML/JS/CSS，应用所有状态丢失；`navigate` 是 React Router 的编程式导航，在 SPA 内部切换，只更新组件，不重新加载资源，状态保留。

---

## 结语：先理解原理，框架只是把它工程化了

回看这一路，其实只有一个主线：

```text
传统多页面：每次跳转整页刷新 → 慢、白屏
SPA 诉求：URL 与资源一一对应，页面不刷新
hash 路由：改变 # 部分不触发刷新，配合 hashchange 渲染不同内容
手写 HashRouter：注册表 + hashchange + 内容替换，约 30 行
React Router：把注册表、监听、渲染封装成 HashRouter / Routes / Route
```

框架并没有发明新原理，它只是把手写路由里的每一步工程化、组件化，并补齐了动态参数、嵌套布局、懒加载、404 兜底这些真实项目早晚要面对的能力。

写下一个 SPA 之前，可以顺手检查：

- [ ] 是否真的需要路由？是纯展示页还是多页面切换？
- [ ] 选 hash 路由还是 history 路由？各自对部署有什么要求？
- [ ] 动态路由的参数是否来自 `useParams`，而不是从 URL 字符串手撕？
- [ ] 公共布局是否用嵌套路由 + `Outlet` 复用了？
- [ ] 页面是否做了懒加载，首屏只加载首页需要的代码？
- [ ] 未知地址是否有 `path="*"` 兜底和友好的 404 页？

从 `#` 号到 React Router，前端路由的原理从来没有变过。理解了那 30 行手写代码，框架里的一切配置都只是它的"豪华套餐"。
