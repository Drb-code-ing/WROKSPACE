# React useState 深入：异步更新、批处理合并与懒初始化性能

## 引言

v046 讲了 React 合成事件与组件树。  
v048 讲了 props / state 的数据所有权，以及受控输入怎么落地。  
到这一步，你已经能写出：

```tsx
const [count, setCount] = useState(0)
const [input, setInput] = useState("")
```

但第四十三天的 `state-demo` 专门把镜头对准了 **useState 本身的更新语义**——很多「会用 hooks」的人，卡在下面这几道坎：

```text
1. 明明 setCount(count + 1) 了，为什么紧接着 console.log(count) 还是旧值？
2. 同一次点击里写三次 setCount(count + 1)，为什么最终只加 1？
3. 想连续加 3，正确写法是什么？
4. 初始状态要跑很重的计算时，为什么直接 useState(heavy()) 会拖垮性能？
```

本文基于提交 `ae887ce`（第四十三天学习 useState深入与性能）里的：

- `fe/React/basic/readme.md`
- `fe/React/basic/state-demo/src/App2.jsx`（计数与更新语义）
- `fe/React/basic/state-demo/src/App.jsx`（用户列表与懒初始化）
- `fe/React/basic/state-demo/test.html`（DocumentFragment 对照）

只讲一件事：

```text
useState 不是「立刻改变量」，而是「提交下一次渲染要用的状态」
```

**明确边界：不重复 v046 的事件模型，不重复 v048 的 props/state 分工与受控表单，不重复 v049 的 Vibe Coding 方法论。**  
v049 待办 Demo 里大量出现的函数式 `setTasks(current => ...)`，本篇从机制上解释「为什么要这样写」。

---

## 一、useState 最小模型

笔记里的四行速记，足够作为起点：

```text
useState
  - 响应式数据状态
  - Hooks 函数式编程的「带头大哥」
  - 参数：初始值 | 函数
  - 返回值：[state, setState]
```

对应代码：

```jsx
import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)
  // ...
}
```

这里有两个容易被忽略、却决定后续理解的点：

```text
1. count 是「这一次渲染」里的常量快照
   不是可以就地改写的可变变量

2. setCount 不会改当前作用域里的 count
   它只是告诉 React：下次渲染时请用新值
```

React 组件函数每次渲染都会重新执行。状态变化的路径是：

```text
事件触发
  → 调用 setState 提交更新
  → React 调度重新渲染
  → 组件函数再跑一遍
  → 这次拿到的 count 才是新值
```

记住这条链路，后面所有「看起来很怪」的行为都会变顺。

---

## 二、为什么 setCount 后立刻 console 还是旧值

### 2.1 Demo 里的「坑」

`App2.jsx` 的核心片段：

```jsx
function App() {
  const [count, setCount] = useState(0)

  function addCount() {
    setCount(count + 1)
    // setCount 只提交下一次渲染要使用的新状态；
    // 当前事件函数仍持有本次渲染的 count（初始为 0），因此这里打印 0。
    // React 完成这次事件后会重新执行 App，届时页面中的 count 才会变为 1。
    console.log(count)
  }

  return (
    <>
      <p>当前计数: {count}</p>
      <button onClick={addCount}>+</button>
    </>
  )
}
```

第一次点击时：

```text
页面显示 0
setCount(0 + 1)  // 提交：下次用 1
console.log(count) // 仍然是 0
渲染结束后页面变成 1
```

### 2.2 这不是「setState 慢」，是「语义 deliberately 异步」

笔记原话：

> setCount 是异步调度更新，不会立刻修改 count。调用后当前作用域 count 仍是旧值，日志打印旧数据；等本轮代码执行完毕，组件重渲染才拿到新 count。

更精确一点：

```text
「异步」在这里的重点不是 setTimeout 那种时间片
而是：更新被调度，状态在下一次渲染才可读
```

为什么要这样设计？

```text
1. 同一事件里可能改多个状态（x / y / z、表单多字段）
   如果每次 set 都立刻重渲染，会抖、会卡、会难推理

2. React 希望一次事件处理完，再统一提交渲染
   状态更新靠「组件函数重新运行」实现，不是靠就地突变
```

### 2.3 心智模型：闭包快照

```text
某次渲染：count === 0
  addCount 关闭在这次渲染的 count 上
  函数体内所有 count 都是 0
  setCount(count + 1) 等价于 setCount(1)
  console.log(count) 当然还是 0
```

所以：

```text
想看「提交后的新值」→ 看下一次渲染后的 UI / 派生计算
不要在同一次事件函数里，指望 count 变量自己变掉
```

---

## 三、批处理：三次 `count + 1` 为什么只加 1

### 3.1 直觉会错在哪

很多人会写：

```jsx
function addCount() {
  setCount(count + 1)
  setCount(count + 1)
  setCount(count + 1)
}
```

期望：点一次 +3。  
实际：点一次 +1。

### 3.2 原因：同一轮里三次都基于同一个旧快照

笔记：

> 三次调用 `count + 1`，0 + 1 本轮处理三次都是一样的，合并，只执行最后一次，目的都是性能优化。

展开：

```text
本次渲染 count = 0

setCount(0 + 1) → 请求把状态设为 1
setCount(0 + 1) → 请求把状态设为 1
setCount(0 + 1) → 请求把状态设为 1

React 批处理合并后：下次渲染 count = 1
```

不是「后两次丢了」这么简单，而是：

```text
你提交的不是「在旧值上再加 1」的意图
你提交的是「把状态写成某个具体数字」
而这个数字三次都是 1
```

### 3.3 批处理在优化什么

```text
多个 setState
  → 合并成一次重渲染
  → 避免同事件内反复 commit DOM
  → 状态更新成本可控
```

这也是为什么 React 强调「状态更新靠重跑组件函数」：  
一次事件处理完，带着最终状态跑一轮，比中间态连闪三遍更合理。

---

## 四、函数式更新：如何真正连续 +3

### 4.1 正确写法

笔记给出的出路：

> 如果非要达到 +3 的效果呢？多次执行，每一次都拿到最新的状态值。  
> 传函数，基于当前状态，返回全新状态，不再是闭包引用。

```jsx
function addCount() {
  setCount(count + 1)                 // 基于本次渲染快照
  setCount(prevCount => prevCount + 1) // 基于「排队中的最新状态」
  setCount(prevCount => prevCount + 1)
}
```

若三次都用函数式：

```jsx
setCount(prev => prev + 1)
setCount(prev => prev + 1)
setCount(prev => prev + 1)
// 0 → 1 → 2 → 3
```

### 4.2 两种 setState 参数的语义差

| 写法 | 语义 | 依赖什么 |
|------|------|----------|
| `setCount(count + 1)` | 把状态设为「我算好的值」 | 当前渲染闭包里的 `count` |
| `setCount(prev => prev + 1)` | 基于最新状态推导下一状态 | React 维护的更新队列 |

函数式更新的关键点：

```text
不再闭包引用本次渲染的 count
而是告诉 React：
  「请拿你手里最新的 state，算出下一个」
```

### 4.3 什么时候必须用函数式

```text
1. 同一次事件里，连续多次基于「当前值」做增量更新
2. 新状态明确依赖旧状态（toggle、加减、数组增删改）
3. 异步回调 / 定时器里更新状态，担心闭包过期
```

v049 待办里的写法，正是这一条的工程落地：

```jsx
setTasks((currentTasks) =>
  currentTasks.filter((task) => task.id !== id),
)
```

不是风格偏好，而是：**派生自旧列表的新列表，必须基于最新列表来算。**

### 4.4 反模式提醒

```jsx
// 脆弱：依赖闭包 count，同事件多次调用会互相覆盖
setCount(count + 1)

// 稳妥：声明式地表达「在最新值上 +1」
setCount(c => c + 1)
```

经验法则：

```text
新值 = f(旧值)  → 优先函数式
新值 = 常量 / 事件直接产物（如 e.target.value）→ 直接传值也常见
```

---

## 五、懒初始化：初始值写成函数

### 5.1 问题场景

`App.jsx` 模拟了一个「很重」的初始数据准备：

```jsx
function heavyComputation() {
  console.log('开始执行 heavyComputation...')
  const startTime = performance.now()
  const result = []
  for (let i = 0; i < 10000; i++) {
    result.push({ id: i, name: `用户-${i}` })
  }
  const duration = performance.now() - startTime
  console.log(`heavyComputation 执行耗时: ${duration}ms`)
  return result
}
```

组件里还有过滤状态：

```jsx
const [users] = useState(() => heavyComputation())
const [filterText, setFilterText] = useState('')
const filterdUsers = users.filter(user => user.name.includes(filterText))
```

每次输入过滤词，`App` 都会重渲染。如果初始值写法不对，性能会 silently 变差。

### 5.2 错误写法：每次渲染都先算一遍

```jsx
// bad
const [users] = useState(heavyComputation())
```

发生了什么？

```text
useState(heavyComputation())
  1. 先执行 heavyComputation()，得到数组
  2. 再把这个数组当作「初始值参数」传给 useState

问题：
  组件每次重渲染，都会先执行 heavyComputation()
  即使 useState 只会在挂载时采用初始值，
  这个函数调用本身已经发生了 —— 白白烧 CPU
```

笔记对照：

```text
// bad
const [users] = useState(heavyComputation())

// good 懒执行：React 只在挂载时执行一次
// 后续重渲染会忽略这个初始化函数
const [users] = useState(() => heavyComputation())
```

### 5.3 正确写法：把「如何计算初始值」交给 React

```jsx
const [users] = useState(() => heavyComputation())
```

语义：

```text
传给 useState 的是一个函数
React 识别到「初始值是函数」时：
  - 挂载：调用一次，用返回值作为初始 state
  - 之后重渲染：不再调用
```

适用场景（笔记原话）：

> 函数就是复杂情况，100 个 NPC？10000 个用户？复杂的随机逻辑……

判断标准很简单：

```text
初始值是字面量 / 便宜计算 → useState(0) / useState([])
初始值要读 localStorage、构造大数组、做随机生成 → useState(() => ...)
```

### 5.4 和「渲染期派生数据」的分工

Demo 里还有：

```jsx
const filterdUsers = users.filter(user => user.name.includes(filterText))
```

这是**每次渲染根据当前 state 现算**的派生结果，不是 state。

```text
users        → 源数据，放 useState（挂载时懒初始化）
filterText   → 交互状态，放 useState
filterdUsers → 计算属性，不放 useState
```

不要把「过滤后的列表」再塞进另一个 state 里双写，除非你有明确的缓存/异步需求。  
**源状态要稳，派生结果要轻。**

---

## 六、Fragment：React 与 DOM 的「批量挂载」对照

### 6.1 React 里的 `<>...</>`

Demo 返回值普遍包在 Fragment 里：

```jsx
return (
  <>
    <p>当前计数: {count}</p>
    <button onClick={addCount}>+</button>
  </>
)
```

笔记：

> Fragment 组件：它可以作为容器，内部挂载子标签（DOM 树的功能）；一次性挂载到页面 `#root` 后，Fragment 元素就会功成身退。

含义：

```text
组件必须返回「一个根」
但你又不想为了满足语法多包一层无意义的 <div>
→ 用 Fragment
→ 真实 DOM 里不会多出这层节点
```

### 6.2 原生 DOM 的 DocumentFragment

`test.html` 用原生 API 演示了同类思想：

```html
<ul id="list"></ul>
<script>
  const data = ["任务1", "任务2", "任务3"]
  const oList = document.querySelector('#list')
  const fragment = document.createDocumentFragment()

  for (const task of data) {
    const item = document.createElement('li')
    item.innerText = task
    fragment.appendChild(item)
  }

  // 批量挂载
  oList.appendChild(fragment)
</script>
```

如果循环里直接 `oList.appendChild(item)`：

```text
每插一个 li，就可能触发一次布局/重绘相关成本
列表一长，性能难看
```

用 DocumentFragment：

```text
先在「文档外」攒齐一批节点
最后一次挂到真实 DOM
```

### 6.3 对照记住，不必硬扯成同一实现

```text
DocumentFragment
  浏览器原生
  批量组装真实 DOM 节点
  插入后 fragment 本身不留在树里

React Fragment
  React 语法/组件层
  允许组件返回多子节点且不产生额外 DOM
  和「批量 setState」不是一回事，但是同一类工程直觉：
  少制造无意义中间层，合并操作
```

对 useState 专题的价值在于：  
**React 的很多设计都在做「合并与延迟」——状态批处理是时间上的合并，Fragment 是结构上的精简。**

---

## 七、把三件事串成一条更新链路

```text
用户点击按钮
  │
  ├─ 事件处理函数开始执行
  │    count 仍是本次渲染快照
  │
  ├─ setCount(...) 一次或多次
  │    只是提交更新意图
  │    值更新：setCount(1)
  │    或函数更新：setCount(c => c + 1)
  │
  ├─ 同事件内 console.log(count)
  │    仍是旧快照
  │
  └─ 事件结束 → React 批处理合并 → 重渲染
       组件函数再跑
       新的 count 进入 JSX
       UI 更新
```

再叠一层初始化：

```text
挂载：
  useState(0)                 → 直接用 0
  useState(() => heavy())     → 只在此时跑 heavy()

更新：
  过滤输入、点击按钮
  → 只重渲染
  → 不再跑 heavy()
```

---

## 八、可直接复用的实践清单

### 8.1 写 setState 时

```text
[ ] 不要假设 setState 后同一行就能读到新 state
[ ] 同事件多次「基于旧值增量」→ 用函数式更新
[ ] 新值来自事件本身（input value）→ 直接 set 通常更清晰
[ ] 多个字段同事件修改 → 接受批处理，一次渲染看到最终结果
```

### 8.2 写初始值时

```text
[ ] 字面量 / 轻量值：useState(0)、useState('')、useState([])
[ ] 重计算 / 读存储 / 随机生成：useState(() => ...)
[ ] 禁止 useState(heavy()) 这种「参数位置上先执行」的写法
```

### 8.3 状态与派生

```text
[ ] 源数据进 state
[ ] 过滤、排序、统计优先在渲染期派生
[ ] 不为「显示用中间结果」盲目再开一份 state
```

### 8.4 最小代码模板

```jsx
import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)

  function addThree() {
    setCount(c => c + 1)
    setCount(c => c + 1)
    setCount(c => c + 1)
  }

  return (
    <>
      <p>{count}</p>
      <button onClick={addThree}>+3</button>
    </>
  )
}

function UserList() {
  const [users] = useState(() => {
    // 只在挂载执行一次的重逻辑
    return Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `用户-${i}`,
    }))
  })
  const [keyword, setKeyword] = useState('')
  const visible = users.filter(u => u.name.includes(keyword))

  return (
    <>
      <input value={keyword} onChange={e => setKeyword(e.target.value)} />
      <p>显示 {visible.length} 个</p>
    </>
  )
}
```

---

## 九、面试高频问题与答题框架

### 9.1 调用 setState 后为什么立刻打印还是旧值？

**回答框架：**

> `useState` 返回的 state 是当前渲染的快照。`setState` 只是把更新提交给 React 调度，不会同步改写当前作用域里的变量。事件处理函数结束后，React 合并更新并重新执行组件函数，下一次渲染才能读到新 state。所以同一次函数里 `console.log(state)` 仍是旧值，这是设计语义，不是单纯「慢」。

### 9.2 为什么连续三次 `setCount(count + 1)` 只加 1？

**回答框架：**

> 三次都读取了同一次渲染闭包中的 `count`，相当于三次都提交「把状态设为 count+1」的同一个结果。React 会批处理这些更新，最终只应用最后一次等效赋值。若要累加，应使用函数式更新：`setCount(c => c + 1)`，让每次更新基于队列中的最新状态。

### 9.3 函数式更新解决什么问题？

**回答框架：**

> 当新状态依赖旧状态时，直接写 `setState(state + 1)` 依赖闭包快照，容易在同事件多次更新或异步回调中拿到过期值。函数式更新 `setState(prev => next)` 由 React 注入最新 state，语义是「基于最新值推导」，更适合 toggle、加减、列表增删改等场景。

### 9.4 `useState(fn)` 和 `useState(fn())` 有什么区别？

**回答框架：**

> `useState(fn())` 会在每次组件渲染时先执行 `fn()`，即使初始值只在挂载时使用，重计算成本已经付出。`useState(fn)` 把函数本身当作惰性初始器，React 仅在首次挂载时调用一次，后续渲染忽略它。重逻辑初始化应使用懒初始化形式。

### 9.5 React 为什么要批处理 state 更新？

**回答框架：**

> 一次用户交互常常修改多个状态。如果每次 `setState` 都立即重渲染，会造成多余渲染和中间态闪烁。批处理把同一事件中的多次更新合并为一次渲染，用最终状态提交 UI，既提升性能，也让界面更稳定。

### 9.6 Fragment 有什么用？和多余的 div 包装有何不同？

**回答框架：**

> 组件需要单一返回根，但业务上经常要返回多个兄弟节点。Fragment（`<>...</>`）满足「一个根」的语法要求，却不在真实 DOM 中制造额外节点，避免破坏布局或样式选择器。它和 DocumentFragment「临时容器、挂载后不留痕迹」的工程直觉类似，但层次不同。

### 9.7 过滤列表要不要再开一个 state 存 filteredUsers？

**回答框架：**

> 一般不要。`users` 与 `filterText` 是源状态；过滤结果是派生数据，渲染时 `users.filter(...)` 即可。额外 state 容易造成双写不同步。只有在过滤成本极高且需要精细缓存策略时，才考虑 `useMemo` 等优化，而不是先复制一份 state。

---

## 结语

第四十三天的 useState 专题，没有引入新库，而是把「每天都在写的两行 hooks」拆成可面试、可落地的三层：

```text
1. 更新语义
   setState 提交的是下一次渲染
   当前闭包里的 state 仍是快照

2. 批处理与函数式更新
   同事件多次「写成 count+1」会合并成一次
   需要累加就写 prev => prev + 1

3. 初始化性能
   重计算用 useState(() => heavy())
   不要 useState(heavy())
```

再补一条结构层的工程直觉：

```text
Fragment：少一个无意义 DOM 节点
批处理：少几次无意义中间渲染
懒初始化：少几次无意义重复计算
```

把它和相邻文章排成一条 React 线：

```text
v046：合成事件与组件树（结构与事件）
v048：props/state 分工、受控输入（数据所有权）
v049：Vibe Coding 工程方法（如何指挥 AI 写可维护代码）
v050（本篇）：useState 更新语义与性能写法（状态如何正确变化）
```

如果你只带走一个检查清单：

```text
打印还是旧值？      → 正常，等下一次渲染
连点三次只加 1？    → 改成函数式更新
初始化又卡又重复？  → 懒初始化函数
过滤结果要不要存？  → 通常派生，不进 state
```

下一阶段可以把同一套语义推到 `useReducer`、上下文中的批量更新，以及并发特性下的更新优先级——但今天这三条，已经够把绝大多数 useState 误用挡在 code review 门外。
