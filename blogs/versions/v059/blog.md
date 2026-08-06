# React 的托管边界：从鉴权路由守卫，到 useRef 的 DOM 与线程引用

React 帮你托管了两件大事：**数据**用 `useState` 做响应式渲染，**页面**用路由随 URL 切换组件。写业务的时候，我们大多数时候只需要"声明式"地描述想要什么，剩下的交给框架。

但真实应用里，总有两件事框架只能帮你到这里，必须自己出手：

- **访问控制**：支付页不能随便进，得有一道"门禁"，登录过才放行——这就是**鉴权路由**；
- **直接引用**：偶尔就是要拿到 DOM 节点、一个可变的值、甚至一条 worker 线程——这就是**useRef**。

这两件事看似无关，其实共用同一条分界线：**useState 与路由负责"声明式地描述"，守卫与 useRef 负责"命令式地出手"。** 理解这条边界，才算真正理解 React 的框架哲学。

---

## 一、HTTP 无状态：鉴权到底在解决什么问题

先问一个问题：为什么需要登录？

因为 **HTTP 是无状态的（stateless）**。每一次请求之间互相独立，服务器默认不记得你是谁、上次说了什么。

```text
客户端                 服务器
  |---- 请求 1 -------->|  不记得你是谁
  |---- 请求 2 -------->|  还是不记得
  |---- 请求 3 -------->|  依然不记得
```

可业务需要"有状态"——购物车、登录态、支付权限。前端要补上这个记忆，常见有三种手段：

| 手段 | 说明 |
| --- | --- |
| 请求头 `token` / `Authorization` | 登录后服务器签发 token，每次请求带在请求头里 |
| `Cookie` | 浏览器自动携带，服务器种下会话标识 |
| `localStorage` | 前端本地存储，存一个"登录状态"标志 |

SPA 里最朴素、也最常用的方式就是最后一种。登录成功后存一个标志：

```js
localStorage.setItem('isLogin', 'true')
```

以后每次判断"能不能进"，就是查这个标志。**前端鉴权的本质：根据已知的状态，决定放不放行。**

---

## 二、路由守卫：ProtectRoute 门禁组件

现在有这样一个需求：`/pay` 支付页，必须登录后才能访问。用户直接敲 URL、或没登录就点导航，都应该被拦下来送到登录页。

React 的做法是把"要保护的页面"包进一个门禁组件：

```jsx
<Route path="/pay" element={
  // 门禁保安
  <ProtectRoute>
    {/* children：Pay 就是要进的房间 */}
    <Pay />
  </ProtectRoute>
} />
```

`ProtectRoute` 这个"保安"负责两件事：检查状态、决定放行还是拦截。

```jsx
import { Navigate, useLocation } from 'react-router-dom'

function ProtectRoute({ children }) {
  // 拦截请求 鉴权
  // html5 本地存储 域名沙盒
  const isAuth = localStorage.getItem('isLogin') === 'true'
  // useLocation 返回 React Router 的 location（纯对象，可序列化）
  const location = useLocation()

  if (!isAuth) {
    // 未登录：跳转登录页，并记住是从哪来的
    // replace：替换当前 /pay 历史，避免登录后还能后退回登录页
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 已登录：放行，渲染房间里的内容
  return <div>{children}</div>
}
```

拆开看它做的三件事：

1. **查状态**：`localStorage.getItem('isLogin') === 'true'`——有状态才放行；
2. **记来源**：`state={{ from: location }}`——把"我是从 /pay 来的"这个信息带过去，登录成功后好把人送回原处；
3. **声明式拦截**：未登录直接返回 `<Navigate to="/login">`，由 React Router 完成跳转。

### 为什么用 `useLocation`，而不是 `window.location`？

注释里写得很清楚：

> `window.location` 含原型/方法，pushState 无法克隆，会报 `DataCloneError`。

`window.location` 是浏览器原生的全局对象，带着一堆方法和原型链，不能序列化传给路由的 `state`；而 `useLocation()` 返回的是 React Router 维护的纯对象，安全可序列化。**凡是准备跨路由传递的信息，都要用 React Router 的对象，而不是浏览器原生对象。**

---

## 三、props.children：让组件能"填空"

注意上面对 `ProtectRoute` 的用法：

```jsx
<ProtectRoute>
  <Pay />
</ProtectRoute>
```

被保护的页面写在了组件标签的内部。这个内部内容，组件通过 `props.children` 就能拿到：

> 组件内部的子组件——`props.children` 拿到组件申明的内部所有的子节点。

```jsx
function ProtectRoute({ children }) {
  // ...
  return <div>{children}</div>   // children 就是 <Pay />
}
```

这是 React 组合能力的核心：**外壳组件负责"布局和逻辑"，内部内容由使用者决定。** 同样的思想在弹窗组件里最典型：

```jsx
<Modal>
  {/* children 定制 */}
  <p>确定要删除这条记录吗？</p>
</Modal>
```

弹窗的蒙层（mask）、窗体、头部、尾部都是固定的外壳，唯独"主体内容"通过 `children` 传进来——同一个 `Modal` 组件，可以塞表单、塞确认文案、塞任何东西，而不用为每种场景单独写一个弹窗。**定制性，是 children 存在的原因。**

---

## 四、登录页：useNavigate 命令式跳转 + 表单

被拦住的用户会被送到 `/login`。登录页要做的事：收集账号密码、校验、写状态、回跳原页面。

```jsx
import { useNavigate, useLocation } from 'react-router-dom'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  // /login 直接访问时 from 为空
  // 从 /pay 被拦过来时 from 是 { pathname: '/pay' }
  // 可选链运算符（es11）
  const from = location.state?.from?.pathname || '/'

  function handleSubmit(e) {
    e.preventDefault() // 阻止表单默认提交行为
    // 原生表单数据对象：按 name 取值
    const formData = new FormData(e.currentTarget)
    const username = formData.get('username')
    const password = formData.get('password')

    if (username === 'admin' && password === '123456') {
      localStorage.setItem('isLogin', 'true')
      // 登录成功，回跳原页面（replace 替换历史，防后退）
      navigate(from, { replace: true })
    } else {
      alert('用户名或密码错误')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>登录</h1>
      <input name="username" placeholder="请输入用户名" required />
      <input name="password" placeholder="请输入密码" required />
      <button type="submit">登录</button>
    </form>
  )
}
```

几个值得学的点：

### 1. `e.preventDefault()`

表单不阻止默认行为，点击提交会**刷新整个页面**——SPA 里这是大忌。阻止之后，才轮到我们自己用 JS 处理。

### 2. `FormData` 取表单值

```js
const formData = new FormData(e.currentTarget)
const username = formData.get('username')
```

不用给每个输入框绑 `value` 和 `onChange`，原生 `FormData` 按 `name` 属性就能拿到全部字段，表单控件多时特别省事。

### 3. 回跳原页面

```js
const from = location.state?.from?.pathname || '/'
navigate(from, { replace: true })
```

`location.state` 是 `ProtectRoute` 传过来的 `{ from: location }`，取出 `pathname` 就是来时的地址。**`?.` 可选链**（ES11）保证 `state` 为空时不会报错，直接兜底回首页 `/`。用户从哪来，登录完就回哪去。

### 4. 为什么要 `replace`

见第六节详述。

---

## 五、Navigate vs useNavigate：声明式与命令式

同一天里我们见到了两种跳转方式，很多人会搞混，这里直接对比：

| | `Navigate` | `useNavigate` |
| --- | --- | --- |
| 类型 | 组件（声明式） | Hook 返回的函数（命令式） |
| 写法 | `return <Navigate to="/login" replace />` | `navigate('/login', { replace: true })` |
| 触发时机 | 渲染时就跳转 | 在事件处理、副作用、条件判断里调用 |
| 典型场景 | 路由守卫：未登录就渲染到登录页 | 登录成功后跳转、点按钮跳转、后退 `navigate(-1)` |

`ProtectRoute` 里用的是声明式：

```jsx
if (!isAuth) {
  return <Navigate to="/login" state={{ from: location }} replace />
}
```

组件一渲染到这一步，重定向立刻发生——它天生适合"守卫"这种场景。

`Login` 里用的是命令式：

```jsx
navigate(from, { replace: true })   // 校验通过后才跳转
```

跳转的时机握在自己手里——它天生适合"某个动作发生后"再跳转。**一句话记：守卫用 `Navigate`，动作后用 `useNavigate`。**

---

## 六、路由历史与 replace：登录后为什么不能后退

浏览器维护一个 history 栈，前进后退就是在栈上移动：

```text
初始      /pay 被拦 → /login    登录成功 navigate(from)
栈: [首页, /pay, /login]    →    如果 push：[首页, /pay, /login, /pay]
```

如果登录成功后用普通的 `navigate(from)`（push 一条新记录），会发生什么？

```text
用户在登录页按下"后退"
→ 又回到 /login
→ 而 /login 没有任何守卫，用户一脸懵："我不是登录了吗？怎么又回来了？"
```

所以注释里说得很直白：

> 把用户当小白。登录成功后，如果还能返回登录页面，用户就会蒙。replace 跳转到新页面的同时，将新页面的历史记录替换掉 /login 的记录。

```js
navigate(from, { replace: true })
```

`replace` 的意思是把当前栈顶（/login）**替换**成新地址（/pay），而不是在上面叠加：

```text
栈：[首页, /pay]          ← /login 被替换掉了，后退直接回首页
```

登录页不会残留在历史里，用户怎么按后退都回不到它。**凡是"校验通过后不应该再回头"的跳转，都该用 `replace`。**

这个 `replace` 的思想，正是 `Link` 组件第二属性的来源——`Link` 的 `to` 决定去哪，`replace` 决定是否替换历史：

```jsx
<Link to="/pay" replace>支付</Link>
```

---

## 七、路由对象与两种选型

前端路由这条路上，还有几个绕不开的基础概念。

### 路由对象三件套

| 对象 | 角色 |
| --- | --- |
| `navigate` | 导航栏——编程式发起跳转 |
| `location` | 地址栏——当前地址、参数、state |
| `history` | 历史记录——前进、后退的栈 |

### 路由两种选型

路由笔记的结尾补上了两种实现方案的取舍：

| | hashRouter | browserRouter |
| --- | --- | --- |
| 原理 | URL 的 hash（`#` 部分）局部改变，不触发页面刷新 | 不用 hash，用 History API 实现 SPA |
| 地址长这样 | `/pay` → `#/pay` | `/pay` |
| 缺点 | URL 有点丑，带着 `#`，和后端路由不太一样 | 刷新/直达时需要服务端配合（否则 404） |

```text
hashRouter：    http://site.com/#/pay
browserRouter： http://site.com/pay
```

demo 里用的是 `HashRouter`——实现简单、无需服务端配置，作为学习演示刚刚好。真实项目选型时再根据部署环境权衡。

---

## 八、useRef：为什么需要"引用"

路由讲完了，切换到 React 的另一条主线：hooks。

先回顾 `useState` 带来的变化。**React 之前，前端是"原生 JS 做 DOM 编程"**：拿到节点、改属性、插子节点，全手动。而 React/Vue 这类框架**直接规避了 DOM 编程**——你声明数据，框架帮你更新界面。

```text
JS 在 v8 引擎执行，DOM 在渲染引擎里
跨引擎直接操作 DOM → 非常耗费性能

useState 数据绑定 + 响应式编程 → 前端开发方式直接改变
```

那"如果非要去 DOM 呢"？笔记里有一问一答：

> 不是不可以做 DOM 编程，而是交给 React。如果必须，DOM 用 useRef 来了。

还有别的需求：想在组件里存一个**可变但不影响渲染**的值；想引用一条**worker 线程**。这些都是 `useState` 管不了的——因为它们不是"业务状态"，不该触发重新渲染。

---

## 九、useRef 是什么

先记定义：

> useRef 是 React 提供的、返回**持久可变对象**的 hook 函数，经常用来引用 DOM 节点对象。它有一个 `current` 属性，可以指向任何值或对象，**不会触发渲染**。

最小用法：

```js
const inputRef = useRef(null)
// inputRef 是 { current: null }
// 赋值后：inputRef.current = <某个对象>
```

它和 `useState` 的相同点和区别：

| | `useState` | `useRef` |
| --- | --- | --- |
| 都能改变 | ✅ 都能存一个值并更新 | ✅ 都能通过 `.current` 更新 |
| 定位 | 聚焦**数据业务状态** | 聚焦 **DOM 对象引用、可变对象**等 |
| 改变后 | 触发组件重新渲染 | **不触发渲染** |
| 典型用途 | 计数、表单、接口数据 | 绑定 DOM、存定时器/线程、跨渲染缓存值 |

一句话记住分工：**useState 管"数据"，useRef 管"引用"。** 数据变了要重新画界面，所以它必须触发渲染；引用变了界面不用变，所以它保持安静。

---

## 十、绑定 DOM：自动聚焦

最经典的使用场景：组件挂载后自动聚焦到输入框。

```jsx
import { useRef, useEffect, useState } from 'react'

function App() {
  const [count, setCount] = useState(0)
  // ref 对象引用
  const inputRef = useRef(null)

  useEffect(() => {
    // 组件挂载完成后，自动聚焦到输入框
    console.log(inputRef.current)   // 打印出来就是那个 DOM 节点对象
    inputRef.current.focus()
  }, [])

  return (
    <>
      {/* dom 节点对象 */}
      <input type="text" placeholder="请输入用户名" ref={inputRef} />
      {count}
      <button onClick={() => setCount(count + 1)}>增加</button>
    </>
  )
}
```

三步就走完了：

1. `const inputRef = useRef(null)`——先造一个 `{ current: null }` 的引用；
2. `<input ref={inputRef}>`——JSX 的 `ref` 属性把这个引用**绑定**到 DOM 节点，挂载后 `inputRef.current` 就指向那个 `<input>` 节点对象；
3. `useEffect` 里 `inputRef.current.focus()`——组件挂载完成后调用原生 DOM 方法。

对比一下原生方案里的 `autoFocus` 属性——它能满足"默认聚焦"，但只能做"聚焦"这一件预设好的事。`useRef` 给的是**完整的 DOM 节点对象**，聚焦、取值、量尺寸……想干什么都行。**属性只能开现成的口子，引用能拿到整把钥匙。**

---

## 十一、引用一个值：可变，但不触发渲染

第二个场景：存一个会变、但**不希望在每次变化时重绘**的值。

```jsx
function App() {
  const numRef = useRef(0)      // 引用一个值
  const [, forceRender] = useState(0)  // 响应式

  return (
    <>
      <div onClick={() => { numRef.current++; forceRender() }}>{numRef.current}</div>
    </>
  )
}
```

注意这里的组合拳：

- `numRef.current++`——值确实变了，但**页面纹丝不动**，因为 useRef 不触发渲染；
- 想让页面更新，得手动调 `forceRender()` 用 useState 强刷一次。

这恰恰证明了前面那句结论：**useRef 可改变、可持久，但不响应式。** 想让它出现在界面上，必须借助 useState 的渲染机制。

什么时候需要这种"变了也不重绘"的值？比如一个不断累计的临时计数器、一个不想引起大范围重新渲染的缓存中间值。**useState 是"声明状态"，useRef 是"持有引用"——两者的触达方式完全不同。**

---

## 十二、useRef 与 worker 线程

第三个场景最有意思：引用一条 **worker 线程**。要说清楚它，得先回到 JavaScript 的单线程模型。

### 为什么 js 是单线程

> 做一些前端交互、脚本工作，简单，显示和操作的页面，需要一致性，不能出问题。js 如果是多线程可能会有冲突。

同一个页面上，多个线程同时读写同一个 DOM，结果不可预测。所以浏览器规定 JS **主线程是单线程**的。

但页面会越来越复杂，有很多耗时任务。单线程意味着：一个大任务卡在主线程上，用户滚动、点击全被阻塞。解法是 **event loop**：

> event loop js 执行机制——异步无阻塞。前端要尽快去响应用户交互（滚动屏幕、点击...），不要卡在这里。

```text
主线程：用户交互（滚动、点击）→ 必须立刻响应
耗时任务：交给 event loop 异步排队，不阻塞交互
```

### 计算密集型的出路：worker 线程

异步能解决"等待"（网络请求、定时器），但解决不了**真正耗 CPU 的计算**——比如 LLM 游戏、非界面的页面逻辑，非常耗费计算时间，event loop 异步搞不定。

> 用 worker 线程：接下更耗时、复杂的任务。浏览器独立开辟的内存，进行复杂计算，完成后告知主线程（消息机制）。

```text
主线程                 worker 线程
  |---- new Worker() --->|  独立内存，跑复杂计算
  |  （主线程不卡，继续响应交互）  |
  |<---- postMessage -----|  算完通过消息机制告知
```

在 demo 里，worker 线程的引用就交给了 useRef：

```jsx
function App() {
  const workerRef = useRef(null)

  useEffect(() => {
    // 组件挂载完成后，创建 worker 线程，开销比较大的操作
    // ref 引用了 worker 线程，避免了主线程阻塞
    workerRef.current = new Worker(
      new URL('./worker.js', import.meta.url)
    )
  }, [])

  return <></>
}
```

为什么不用 useState 存 worker？因为**引用一条线程不是"业务状态"**——线程实例变了，界面不需要重绘，反而触发渲染只会白白浪费性能。useRef 恰好是"持有一个引用、但不关心渲染"的工具。

至此三个场景凑齐了 useRef 的完整画像：

| 场景 | useRef 存的是什么 | 为什么不用 useState |
| --- | --- | --- |
| 自动聚焦 | DOM 节点对象 | 拿到节点不等于状态变化 |
| 可变计数 | 一个值 `numRef.current` | 变化时不需要重绘 |
| worker 线程 | 线程实例 | 引用改变与 UI 无关 |

---

## 十三、面试问答

**问：前端鉴权路由是怎么实现的？**

> 用一个"门禁"组件包住受保护的页面。组件里从 `localStorage`（或 token/Cookie）读登录状态：已登录就渲染 `children` 放行；未登录就返回 `<Navigate to="/login" state={{ from: location }} replace />` 声明式跳转到登录页，并把来源地址记在 `state` 里，登录成功后回跳。本质是"根据已知状态决定放不放行"。

**问：`Navigate` 和 `useNavigate` 有什么区别？**

> `Navigate` 是组件（声明式），渲染时立即重定向，适合路由守卫这种"到了就跳"的场景；`useNavigate()` 是 Hook 返回的函数（命令式），在事件处理、副作用、条件判断里手动调用，适合"某个动作发生后"再跳转，比如登录成功后 `navigate(from, { replace: true })`。

**问：为什么登录成功后要用 `replace` 而不是普通跳转？**

> 普通跳转会往 history 栈里 push 一条新记录，用户按下"后退"就又回到登录页，明明登录过了却像没登录。`replace` 把栈顶的 /login 替换成目标地址，登录页不会残留在历史里，用户怎么后退都回不去。凡是"校验通过后不该再回头"的跳转都用 replace。

**问：`useRef` 和 `useState` 有什么区别？**

> 两者都能存值并更新。但 useState 聚焦"数据业务状态"，值改变会触发组件重新渲染；useRef 返回一个持久可变对象，通过 `current` 属性指向任意值/DOM/线程，改变时**不触发渲染**。useState 管数据，useRef 管引用。

**问：useRef 为什么改变时不触发渲染？**

> 因为 useRef 的定位是"持有引用"而不是"声明状态"。它存的是 DOM 节点、线程实例这类与 UI 无关的引用，界面不需要因此重绘。如果你想让一个 useRef 的值出现在界面上，需要借助 useState 手动触发渲染（比如 `forceRender`）。

**问：JavaScript 为什么是单线程？复杂计算怎么办？**

> 页面交互（滚动、点击、DOM 操作）需要一致性，多线程同时操作 DOM 会有冲突，所以主线程是单线程的。耗时任务通过 event loop 异步处理，不阻塞交互；但真正耗 CPU 的计算（如 LLM 游戏）连异步也搞不定，就交给 worker 线程——浏览器独立开辟内存跑复杂计算，完成后通过消息机制（postMessage）告知主线程。

---

## 结语：声明式与命令式的边界

回看这一整天，其实只有一个主线：

```text
useState / 路由  → 声明式：描述"想要什么"，框架负责实现
鉴权守卫         → 命令式：用状态做判断，决定放不放行
useRef           → 命令式：直接持有 DOM、值、线程的引用
```

React 的哲学是把**声明式**的部分做到底——你只管说"数据是这样、URL 是那样"，渲染、匹配、切换全是它的。但它把**命令式**的出口也留好了：鉴权让你在"谁进来"上把住门，useRef 让你在"直接拿东西"上有抓手。这不是框架的缺陷，恰恰是它的设计。

写下一个真实应用前，可以顺手检查：

- [ ] 受保护的页面是否都包了门禁组件，未登录会被 `Navigate` 拦到登录页？
- [ ] 登录成功是否用 `replace` 回跳原页面，而不是让用户能后退回登录页？
- [ ] 守卫用的是声明式 `Navigate`，动作后用命令式 `useNavigate`，分清楚了吗？
- [ ] 需要"跨渲染缓存但不用重绘"的值，用的是 useRef 而不是 useState？
- [ ] 复杂的计算任务是否交给了 worker 线程，避免卡住主线程交互？
- [ ] 路由选型（hashRouter vs browserRouter）是否结合了部署环境？

框架托管的边界，正是真实应用最关键的地方。把这两处"自己出手"练熟，React 才算真正上手。
