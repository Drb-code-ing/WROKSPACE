# React 的复用与并行：从自定义 Hooks 封装状态逻辑，到 Web Worker 的多线程计算

上一节我们认识了 useRef：它既能绑定 DOM，也能引用一条 worker 线程。但你大概会想——线程引用来干嘛？引用了它，又怎么用起来？这一天的笔记正好把这两件事都做完了：**用 useRef 把 Web Worker 跑起来**，做完一次真实的"5 亿次循环"。

而在"线程"这条线之外，同一天还解锁了 React 的另一个大招：**自定义 Hooks**。当多个组件都要"用鼠标坐标""用主题""管一套待办"，把这段重复的逻辑抽成一个 `use` 开头的函数，就叫自定义 Hook。

这两件事表面无关，骨子里是同一个主题——**让 React 更高效**：

- **自定义 Hooks**：把状态逻辑抽出来复用，开发不再重复造轮子；
- **Web Worker**：把耗时的计算丢给独立线程，页面不再卡顿。

一个省**人的时间**，一个省**机的时间**。我们一个个来。

---

## 一、组件通信的困境：层层传递

先回到一个老问题：组件之间怎么共享数据？

React 里组件有各种关系，通信方式也不一样：

| 关系 | 举例 | 通信方式 |
| --- | --- | --- |
| 父子 | 父组件 → 子组件 | `props` 传数据、自定义状态 |
| 兄弟 | 两个平级组件 | 共享数据、统一数据状态管理 |
| 爷孙 | 爷爷 → 孙子 | 层层传递 |
| 陌生人 | 毫无嵌套关系的组件 | 统一状态管理 |

父子通信用 `props` 顺手得很。可一旦遇上**爷孙关系**，问题就来了：

```jsx
<Parent>
  <Child>
    <GrandChild>
      <GreatGrandChild />   {/* 想要 theme，得一层层传下来 */}
    </GrandChild>
  </Child>
</Parent>
```

笔记里说得直白：

> 组件层次比较深，原来的那套层层传递，层次太深，**搬运工作就太麻烦了**。

`GreatGrandChild` 需要的数据，要从爷爷一路传下来，每一层都是纯粹的"过路搬运工"——传不传意义不大，不传又不行。数据离得越远，中间层越遭罪。**这就是组件通信的痛点：层级深、搬运烦。**

---

## 二、useContext：跨层级直达

React 给的解法是 **context（上下文）**。

> useContext 上下文：通过数据上下文，最外层用 `context.Provider` 组件包裹；消费上下文时，跨越层级、不考虑层级关系，直接消费上下文。

也就是说，不再需要一层层手递，而是把数据放在一个"共享的上下文"里，任何深度的组件想用，伸手就能拿到。用法只有三步：

```text
① createContext   创建上下文
② Provider 组件    包裹组件树，提供数据
③ useContext       在任意层级消费数据
```

### 1. createContext：造一个共享容器

```jsx
import { createContext } from 'react'

// 创建一个 Theme 上下文，为深层次的组件树提供主题共享数据
export const ThemeContext = createContext("light")
```

`createContext("light")` 返回一个上下文对象，默认值是 `"light"`——如果某层没被 Provider 包住，组件读到的就是默认值。

### 2. Provider：在顶层把数据供出去

```jsx
import { useState } from 'react'
import { ThemeContext } from './ThemeContext'
import Page from './components/Page'

function App() {
  const [theme, setTheme] = useState("light")

  return (
    // 上下文提供者 容器
    // 并不是需要全局，任何地方作为容器使用
    // 默认 light，可以通过 value 属性自定义
    <ThemeContext.Provider value={theme}>
      <Page />
      <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
        切换主题
      </button>
    </ThemeContext.Provider>
  )
}
```

注意两点：

- `Provider` 不是只能包全 App，**任何地方都可以作为容器使用**——想给哪棵子树共享，就包在哪层；
- `value` 属性决定这一片上下文的值。`theme` 一变，所有消费这个上下文的地方都会跟着更新。

### 3. useContext：任何层级直接取

最深处的 `Page` 不再需要 props 层层搬运，直接消费上下文：

```jsx
import { ThemeContext } from '../ThemeContext'
import { useContext } from 'react'

function Page() {
  const theme = useContext(ThemeContext)   // 直接拿，不管隔了几层

  return (
    <>
      <h2>Page {theme}</h2>
      <Child />
    </>
  )
}
```

数据从"层层搬运"变成了"隔空取物"——**只要在 Provider 包裹范围内，任何层级的组件都能直接读到。** 这就是 context 的核心价值：跨越层级、不考虑层级关系。

---

## 三、自定义 Hooks：use 开头的函数

`useContext` 很好用，但仔细观察会发现一个隐患：`Page` 里写了 `useContext(ThemeContext)`，如果 `Child`、`GrandChild` 也要主题，它们**又得写一遍**：

```jsx
// Page 里写了一遍
const theme = useContext(ThemeContext)

// Child 里又要写一遍
const theme = useContext(ThemeContext)
```

"连接上下文、消费数据"这段动作，散落在每个组件里。能不能也抽出来？能——这就到了 **自定义 Hooks**。

先记它的定义：

> 自定义 Hooks：`use` 开头的函数；放在 `hooks` 目录下，属于架构；封装了响应式、副作用等功能，用于**复用**。

它和普通函数最大的区别在于：**普通函数只能封装纯逻辑，自定义 Hook 能把 React 的响应式、副作用都封装进去。**

```text
普通函数：        输入 → 计算 → 输出（纯逻辑）
自定义 Hook：     输入 → 计算 + useState 响应式 + useEffect 副作用 → 输出（React 能力）
```

命名必须 `use` 开头，这是 React 的硬性约定——Hook 的调用规则（比如不能写在循环里）就是靠识别 `use` 前缀来检查的。

---

## 四、useMouse：把事件监听封装成响应式状态

第一个自定义 Hook，目标是"监听鼠标移动事件，把鼠标坐标显示在页面上"。

笔记里先抽象了目标：

> 抽象：响应式的鼠标坐标，封装。

把"鼠标坐标"这个**响应式状态**抽成一个 Hook，任何组件想用坐标，一行代码就拿到：

```jsx
import { useState, useEffect } from 'react'

function useMouse() {
  const [x, setX] = useState(null)
  const [y, setY] = useState(null)

  const handleMouseMove = (e) => {
    setX(e.clientX)
    setY(e.clientY)
  }

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove)
    return () => {
      // 函数组件卸载后，不会主动回收
      // 定时器、事件监听器
      document.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return { x, y }
}

export default useMouse
```

拆开看它封装了什么：

1. **响应式**：`useState` 存坐标，鼠标一动，`x`、`y` 自动更新；
2. **副作用**：`useEffect` 挂载时监听 `mousemove`，**卸载时移除监听**——注释点出关键：定时器、事件监听器这类东西，组件卸载后**不会主动回收**，必须手动清理，否则就会内存泄漏；
3. **返回值**：返回 `{ x, y }`，组件拿到就是一个干净的"响应式坐标"。

消费它的组件干净到只剩展示：

```jsx
import useMouse from './hooks/useMouse'

function App() {
  const { x, y } = useMouse()

  return (
    <>
      <div style={{height: "100vh", display: "flex",
                   justifyContent: "center", alignItems: "center"}}>
        {x && y ? `鼠标坐标：${x}, ${y}` : "请移动鼠标"}
      </div>
    </>
  )
}
```

整个"监听 → 更新 → 清理"的细节全藏在 `useMouse` 里，组件只关心"我要坐标"。**要复用一段带状态的逻辑，就把它抽成自定义 Hook。**

---

## 五、useTheme：把 useContext 再封一层

`useMouse` 封装的是"状态 + 副作用"，`useTheme` 封装的则是"消费上下文"这件事。

```jsx
// 自定义 hooks
// 比普通函数的封装多的地方是可以将 react 响应式，副作用业务等封装进去
// 在 Provider 里面任何层级的组件 多个地方消费数据，模块化抽离放到 hooks
import { ThemeContext } from '../ThemeContext'
import { useContext } from 'react'

// 约定以 use 开头
export function useTheme() {
  return useContext(ThemeContext)   // 消费上下文
}
```

有了它，`Child` 组件里再也不用关心 `ThemeContext` 从哪来、怎么 import：

```jsx
import { useTheme } from '../hooks/useTheme'

function Child() {
  const theme = useTheme()     // 一个 Hook 就拿到主题
  console.log(theme)

  return (
    <>
      <h1>Child</h1>
      <button className={theme}>按钮{theme}</button>
    </>
  )
}
```

对比一下两种写法：

| | 直接 useContext | 用 useTheme |
| --- | --- | --- |
| 组件里 | `useContext(ThemeContext)` + import 上下文 | `useTheme()`，只 import Hook |
| 耦合 | 组件要知道"数据来自 ThemeContext" | 组件只问"主题是什么"，不问来源 |
| 多处消费 | 每个组件各写一遍连接代码 | 逻辑集中在 hooks 目录一处 |

注释里那句话点得很透：

> 在 Provider 里面任何层级的组件，多个地方消费数据，模块化抽离放到 hooks。

**消费上下文也是一种可复用的逻辑，同样值得抽成 Hook。** 页面代码只跟 `useTheme()` 打交道，未来上下文改叫别的名字、换成别的来源，组件一行都不用动。

---

## 六、useTodos：TypeScript 版自定义 Hook

前两个都是 JS，第三个项目换成了 **React + TypeScript**，要做一个"待办事项"的完整业务逻辑封装。

先定类型契约——`todo.ts` 里规定了数据的形状：

```ts
export interface Todo {
  id: string
  title: string
  completed: boolean
}

// 类型别名用 type，适合简单数据类型
export type FilterType = "all" | "completed" | "uncompleted"
```

`interface` 描述对象结构（复杂类型），`type` 定义联合类型（简单类型）——这是 TS 里两个取类型的小分工。

然后 `useTodos` 把整套待办逻辑全部封装进去：

```ts
import { useState } from 'react'
import type { Todo, FilterType } from '../types/todo'

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [filter] = useState<FilterType>("all")

  // 添加任务
  const addTodo = (text: string) => {
    if (!text.trim()) return
    const newTodo: Todo = {
      id: Date.now().toString(),
      title: text.trim(),
      completed: false
    }
    setTodos(todos => [...todos, newTodo])
  }

  // 切换任务状态
  const toggleTodo = (id: string) => {
    setTodos(
      todos => todos.map(todo => {
        return todo.id === id ? { ...todo, completed: !todo.completed } : todo
      })
    )
  }

  // 删除任务
  const deleteTodo = (id: string) => {
    setTodos(todos => todos.filter(todo => todo.id !== id))
  }

  // 清除已完成任务
  const clearCompleted = () => {
    setTodos(todos => todos.filter(todo => !todo.completed))
  }

  return {
    todos,
    filter,
    addTodo,
    toggleTodo,
    deleteTodo,
    clearCompleted,
  }
}
```

返回的东西可以列一张"能力清单"：

| 返回项 | 类型 | 作用 |
| --- | --- | --- |
| `todos` | `Todo[]` | 待办列表数据 |
| `filter` | `FilterType` | 当前过滤条件 |
| `addTodo(text)` | 函数 | 添加任务（空文本直接忽略） |
| `toggleTodo(id)` | 函数 | 切换某条任务完成状态 |
| `deleteTodo(id)` | 函数 | 删除某条任务 |
| `clearCompleted()` | 函数 | 一键清除已完成 |

几个值得注意的点：

- `useState<Todo[]>`——泛型约束状态类型，TS 帮你检查 todos 的每一项都符合 `Todo` 契约；
- `setTodos(todos => [...])`——**函数式更新**，基于"上一次的值"算新值，多个更新合并时不会丢数据；
- `addTodo` 开头 `if (!text.trim()) return`——空输入直接返回，不让空任务混进列表；
- 组件只调用 `useTodos()` 就拿到一整套待办能力，页面 UI 和业务逻辑彻底分开。

到这里，自定义 Hooks 的三个层次都齐了：

| Hook | 封装了什么 | 本质 |
| --- | --- | --- |
| `useMouse` | 事件监听 + 响应式状态 + 清理 | 封装副作用 |
| `useTheme` | 消费 context | 封装数据连接 |
| `useTodos` | 一整套业务逻辑 + 类型契约 | 封装状态与操作 |

**凡是"多个组件都要用、又带状态"的逻辑，都值得做成自定义 Hook。**

---

## 七、回到单线程：为什么需要 Web Worker

自定义 Hooks 解决的是"复用"，接下来解决"性能"。

上一节我们说过：JavaScript 主线程是**单线程**的。这带来一个后果——**一个耗 CPU 的大任务，会直接卡住整个页面**：

```js
// 主线程：5 亿次循环
console.time('主线程')
for (let i = 0; i < 100000000; i++) {
  console.log(i)
}
console.timeEnd('主线程')
// 执行期间，页面滚动、点击全部无响应 —— 阻塞页面渲染
```

`event loop` 能解决"等待"（网络请求、定时器），因为等待的时候主线程可以去干别的；但它**解决不了真正耗 CPU 的计算**——计算本身就得占着 CPU，异步排再多队，最后还是主线程一个人在算。

笔记里点名了这类任务：

> 耗时性复杂专项任务：
> - 游戏引擎计算
> - llm
> - 加密等密集计算

> llm 游戏、非界面的页面逻辑，很耗费计算时间，event loop 异步搞不定。

这类"跑起来就要占死 CPU"的活，正是 **Web Worker** 的用武之地。

---

## 八、Web Worker：浏览器给你的一双手

先说结论，这是整节最容易被误解的地方：

> js 难道成了多线程语言？
> js 单线程并没有改变，只是在执行一些巨复杂的任务时，
> 我们的主线程和由浏览器提供的 web worker 线程，分别执行不同的任务，
> **互不干扰，互不阻塞**。

为什么不冲突？因为 JS 和 Worker 本来就住在不同的地方：

> js 是 v8 引擎的运行时；
> 浏览器是 c++ 多进程多线程的软件。

浏览器底层是 C++ 写的多进程、多线程程序。它开辟一条独立的 worker 线程，让 JS 的复杂计算在上面跑——**JS 主线程还是单线程，只是多了一个"外援"线程。**

```text
主线程（v8 引擎）              worker 线程（浏览器辅助）
   |---- new Worker() ----->|  独立内存，跑复杂计算
   |  （主线程不卡，继续响应交互）   |
   |<---- self.postMessage --|  算完，通过消息机制告知
```

这个"外援"有几个硬性约束，笔记里记得清楚：

- **worker 不能访问 DOM**——它不是渲染线程，没有 DOM 的权限；
- **只能通过消息和主线程相互通信**——`postMessage` 发、`onmessage` 收；
- **它只是辅助线程**——页面渲染、组件更新、交互事件，依旧只能在唯一的 JS 主线程执行。**因此 JS 仍然是单线程的。**

一句话：**Worker 不是把 JS 变成多线程，而是浏览器借给你一条专门干重活的线，干完用"消息"把结果送回来。**

---

## 九、useRef + Web Worker：完整 Demo

现在把 useRef 和 Web Worker 拼起来，做一个完整案例：点按钮，worker 线程执行 **5 亿次循环**，算完把结果发回主线程。

先看 worker 线程本身，`worker.js`：

```js
// web worker 独立线程计算
// 不可以做 DOM api
console.log('worker 线程启动')

// self 关键字：worker 线程里的全局对象
self.onmessage = (e) => {
  console.log('worker 线程收到主线程发送的消息:', e.data)

  let sum = 0
  // 5 亿次循环，全在 worker 线程里跑
  for (let i = 0; i < 500000000; i++) {
    sum += e.data.num * i
  }

  // 算完，通过消息机制把结果发回主线程
  self.postMessage({
    result: sum
  })
}
```

主线程 App 里，useRef 负责**持久存放**这条 worker 线程：

```jsx
import { useRef, useEffect, useState } from 'react'

function App() {
  const workerRef = useRef(null)          // 可持久化的可变对象：存 worker 实例
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 组件挂载完成后，创建 worker 线程，开销比较大的操作
    // ref 引用了 worker 线程，避免了主线程阻塞
    const worker = new Worker(
      new URL('./worker.js', import.meta.url)
    )

    // 监听 worker 线程，有没有消息到达
    worker.onmessage = (e) => {
      console.log('主线程收到 worker 线程返回的数据', e.data)
      setResult(e.data.result)   // 把计算结果存到 state，触发渲染显示
      setLoading(false)          // 计算结束，恢复按钮可点
    }

    workerRef.current = worker

    // 组件卸载时，销毁 worker 线程
    return () => {
      workerRef.current.terminate()
      workerRef.current = null
    }
  }, [])

  const startHeavyCalc = () => {
    setLoading(true)
    // 消息机制：给 worker 线程发送一条工作指令，带上参数
    workerRef.current.postMessage({
      num: 88
    })
  }

  return (
    <>
      <div style={{ padding: "30px" }}>
        <h2>useRef + WebWorker 耗时计算</h2>
        <p>开启 web worker 线程，执行5亿次循环，结束后通知主线程</p>
        <button
          onClick={startHeavyCalc}
          disabled={loading}
        >{loading ? "正在后台计算..." : "启动繁重计算任务"}</button>
        {result && <h3>计算结果: {result}</h3>}
      </div>
    </>
  )
}
```

把整个流程拆成四步：

### 1. 挂载时创建 worker（useEffect + useRef）

```js
const worker = new Worker(new URL('./worker.js', import.meta.url))
workerRef.current = worker
```

`new Worker(...)` 在**独立的线程**里启动 `worker.js`。`import.meta.url` 让 Vite 正确解析 worker 文件路径。创建的实例存进 `workerRef.current`——**useRef 保证它不会因组件重新渲染而被重建**。

### 2. 点按钮，主线程发指令（postMessage）

```js
const startHeavyCalc = () => {
  setLoading(true)
  workerRef.current.postMessage({ num: 88 })   // 带上参数
}
```

按钮一点，主线程通过消息机制给 worker 发一条"开工"指令，带上计算参数 `num: 88`。发完立刻返回，主线程**不等待**——按钮变成"正在后台计算..."，页面依然流畅。

### 3. worker 收消息、开算、回传（self.onmessage / postMessage）

worker 端 `self.onmessage` 收到指令，闷头跑完 5 亿次循环（这期间主线程干自己的事），算完 `self.postMessage({ result: sum })` 把结果发回来。

### 4. 主线程收结果、更新界面（onmessage）

```js
worker.onmessage = (e) => {
  setResult(e.data.result)   // 存进 state，触发渲染
  setLoading(false)          // 恢复按钮
}
```

主线程监听 `onmessage`，收到结果后塞进 `useState`——**UI 更新还是要走 React 的响应式机制**，useRef 只管持有线程，不管渲染。

### 5. 卸载时销毁（useEffect cleanup）

```js
return () => {
  workerRef.current.terminate()
  workerRef.current = null
}
```

组件卸载时 `terminate()` 终止线程，避免 worker 继续在后台空转。这个清理和 `useMouse` 里移除事件监听是同一个道理——**挂载时开的"资源"，卸载时都要亲手关掉。**

---

## 十、为什么用 useRef 存 worker，而不是 useState

这是这一天最值得想清楚的一个问题。笔记的总结把答案写全了：

> useRef 用来持久存放 web worker 实例，组件每次渲染都不会重新创建；
> 并且在 useEffect 组件挂载后初始化，优先渲染；
> 方便监听、发送数据，以及组件卸载时销毁 worker 线程。

逐条对应：

| 需求 | useRef 怎么做 | 为什么不用 useState |
| --- | --- | --- |
| 每次渲染不重新创建 | `workerRef.current` 跨渲染保持不变 | useState 的 setState 会触发重渲染，重渲染又会让代码重新执行 |
| 挂载后初始化 | `useEffect` 里 `new Worker`，只在挂载时跑一次 | worker 属于"一次性资源"，不该跟着渲染反复创建 |
| 监听、发送数据 | `onmessage`、`postMessage` 直接挂在实例上 | 线程实例不是"业务状态"，变了不需要重绘 |
| 卸载时销毁 | `useEffect` 的 cleanup 里 `terminate()` | 销毁是"清理资源"，不是"更新界面" |

最关键的一条：**引用一条线程，不是"业务状态"**。线程在不在、变没变，跟界面长什么样没有任何关系。如果用 useState 存，它每次变化都要触发一次毫无意义的重新渲染，纯属浪费。

对比 useRef 的三大典型用途，现在刚好集齐：

| 场景 | useRef 存的是什么 | 为什么不用 useState |
| --- | --- | --- |
| 自动聚焦（上节） | DOM 节点对象 | 拿到节点不等于状态变化 |
| 可变计数（上节） | 一个值 `numRef.current` | 变化时不需要重绘 |
| worker 线程（本节） | 线程实例 | 引用改变与 UI 无关 |

**useState 管"数据"，useRef 管"引用"。** worker 线程是一条要长期持有、但不用管渲染的引用，useRef 是它的天然归宿。

---

## 十一、面试问答

**问：`useContext` 解决了什么问题？怎么用？**

> 解决组件层级过深时"层层传递 props"太麻烦的问题。把共享数据放进一个上下文里，任何层级的组件都能直接消费，不用中间层当搬运工。三步走：`createContext` 创建上下文 → 用 `Context.Provider` 包裹组件树并传 `value` → 子组件用 `useContext(Context)` 直接取数据。

**问：什么是自定义 Hook？为什么必须以 `use` 开头？**

> 把带状态的逻辑（响应式、副作用）抽成一个函数复用，就叫自定义 Hook。它比普通函数强在能把 React 的 `useState`、`useEffect` 封装进去。必须以 `use` 开头是 React 的硬约定——Hook 的调用规则检查就是靠识别这个前缀。放在 `hooks` 目录下，属于项目的架构层。

**问：`useMouse` 这类 Hook 为什么要在 `useEffect` 里清理事件监听？**

> 函数组件卸载后不会主动回收定时器、事件监听器这类资源，如果不清理就会一直留着，造成内存泄漏。所以 `useEffect` 返回一个清理函数，在卸载时 `removeEventListener`。挂载时开什么资源，卸载时就关什么资源。

**问：为什么说 JS 是单线程的？Web Worker 出现后还算单线程吗？**

> JS 单线程是为了页面操作的一致性——多线程同时改同一个 DOM 会出冲突。Web Worker 并没有改变 JS 单线程这个事实：它只是浏览器（C++ 多进程多线程软件）额外开辟的一条辅助线程，把复杂计算放上去跑，让主线程不被阻塞。页面渲染、组件更新、交互事件依然只能在唯一的 JS 主线程执行，JS 依然是单线程的。

**问：主线程和 Worker 怎么通信？Worker 能操作 DOM 吗？**

> 通过消息机制：主线程 `worker.postMessage(...)` 发消息，worker 里 `self.onmessage` 收；worker 算完 `self.postMessage(...)` 回传，主线程 `worker.onmessage` 收。两个线程完全隔离，互不干扰、并行执行。Worker 不能访问 DOM——它没有 DOM 权限，只能通过消息和主线程交流。

**问：为什么用 useRef 存 worker 实例，而不是 useState？**

> 因为 worker 线程是"引用"而不是"业务状态"：它每次渲染都不能重新创建（否则线程会越开越多），只该在挂载时初始化一次、卸载时销毁一次。useRef 跨渲染持久保存、不触发渲染，配合 useEffect 挂载时创建、cleanup 里 `terminate()`，正好满足"持久存放、挂载初始化、卸载销毁"三个要求。

---

## 结语：复用与并行，让 React 走得更远

这一天的两条主线，可以并成一张图：

```text
复用  自定义 Hooks   →  useMouse / useTheme / useTodos
                     把"带状态的逻辑"抽成 use 函数，一处封装、多处复用
并行  Web Worker     →  useRef 持久持有线程实例
                     把"耗 CPU 的计算"丢给独立线程，主线程不再卡顿
```

底层各有一根支柱：自定义 Hooks 踩着 `useContext` 提供的跨层级共享，Web Worker 踩着"JS 单线程 + 浏览器辅助线程"的运行机制。而两者都指向同一个 React 哲学——**框架负责帮你做，你负责把"怎么做"想清楚。**

动手前，可以拿这张清单自检：

- [ ] 数据要跨很多层传递时，用的是 context（createContext → Provider → useContext），而不是让中间层徒手搬运？
- [ ] 多个组件共用的"带状态逻辑"（鼠标坐标、主题、待办…），抽成了 `use` 开头的自定义 Hook？
- [ ] Hook 里用了事件监听、定时器等资源时，在 `useEffect` 的 cleanup 里清理干净了？
- [ ] 有"游戏计算、LLM、加密"这类耗 CPU 的任务时，丢给了 worker 线程，而不是让主线程干等？
- [ ] worker 实例存在 useRef 里，挂载时创建、卸载时 `terminate()`，而不是用 useState 引发无谓的渲染？
- [ ] 记得 worker 不能碰 DOM，所有结果都走 postMessage / onmessage 消息机制？

复用让代码不重复，并行让页面不卡顿。自定义 Hooks 和 Web Worker，一个向内整理逻辑，一个向外借力浏览器，合起来才是 React 工程化的完整拼图。
