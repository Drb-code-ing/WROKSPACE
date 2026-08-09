# React 的数据主权与渲染防线：从受控与非受控组件的输入之争，到 useCallback 的性能优化

上一节我们把"复用"交给自定义 Hooks、"并行"交给 Web Worker，React 的工程能力又上了一个台阶。但把视线从线程拉回到界面，有一个最朴素、也最躲不开的场景：**表单**。用户名、密码、评论、搜索框——只要做界面，就逃不开输入框。

而输入框的第一个问题，就是"主权"之争：**输入框里的值，到底归谁管？**

- 让 React 的状态来管，输入框只是一个"傀儡"——这是**受控组件**；
- 让 DOM 自己管，React 用到时再伸手去取——这是**非受控组件**。

同一天，笔记还顺带解锁了性能优化的第一道防线：**父组件一重新渲染，子组件全部跟着动，这很浪费**。`memo` 把子组件"记"下来，不该动的时候就不动——而 `useCallback`、`useMemo`，就是这条路上的下一站。

这一天的主题可以并成一句话：**先搞清楚"数据归谁管"，再搞清楚"什么时候该重渲染"。**

---

## 一、受控组件：让 React 说了算

先看最简单的 `ControlledInput.jsx`：

```jsx
import { useState } from 'react'

// 受控组件(响应式状态控制input)
function ControlledInput() {
  const [value, setValue] = useState('')

  return (
    <>
      Controlled Input
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
       />
    </>
  )
}
```

关键在三个地方：

- `value={value}`：输入框显示什么，完全由 React 状态决定；
- `onChange={e => setValue(e.target.value)}`：用户每敲一个字符，先把事件里的新值写进状态，再让状态回流到输入框；
- 于是循环永远是：**输入 → onChange → setState → value → 输入框**，一条单向的数据流。

**受控组件 = 状态是唯一数据源，输入框只是状态的"投影"。** 用户敲了什么、输入框里该显示什么，都由 React 拍板。

---

## 二、非受控组件：让 DOM 自己说了算

再看 `UncontrolledInput.jsx`：

```jsx
import { useRef } from 'react'

// useRef(创建一个Ref对象)
function UncontrolledInput() {
  const inputRef = useRef(null)
  const handleClick = () => {
    console.log(inputRef.current.value)
  }

  return (
    <>
      Uncontrolled Input
      <input
        type="text"
        ref={inputRef}
      />
      <button onClick={handleClick}>获取输入值</button>
    </>
  )
}
```

对照着看就清楚了：

- 受控组件：值存在 state，每次敲键都 `setState`，React 全程追踪；
- 非受控组件：input 没写 `value`，**值存在 DOM 节点内部，React 不管它**；需要取值时，`useRef` 拿到 DOM 节点，`inputRef.current.value` 直接读出来。

这里用到的正是前几天的 `useRef`——**非受控组件把"值"的存储权交给浏览器，React 需要时再用 ref 去取。**

---

## 三、CommentBox：提交时才取值的 textarea

`CommentBox.jsx` 把同样的思路用在了多行文本上：

```jsx
import { useRef } from 'react'

function CommentBox() {
  const textareaRef = useRef(null)

  const handleSubmit = () => {
    const comment = textareaRef.current.value
    if(!comment) return
    console.log(comment)
  }

  return (
    <>
      <div>
        <textarea
         ref={textareaRef}
         placeholder="请输入评论"
         />
        <button onClick={handleSubmit}>提交评论</button>
      </div>
    </>
  )
}
```

textarea 一样可以挂 ref 读值。`handleSubmit` 里 `textareaRef.current.value` 拿到当前内容，空评论直接 `return` 掉。**这种"用到再取"的模式，适合那些不需要实时响应、只在提交那一刻才关心的字段。**

---

## 四、RegisterForm：受控表单的标准姿势

一个表单往往不止一个字段。受控表单的标准做法，是把所有字段收进**一个状态对象**。`RegisterForm.jsx`：

```jsx
import { useState } from 'react'

function RegisterForm() {
  const [form, setForm] = useState({
    username: '',
    password: '',
  })

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log(form)
  }

  return (
    <>
      <div>
        <input
          type="text"
          name="username"
          value={form.username}
          onChange={handleChange}
          placeholder="请输入用户名"
        />
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="请输入密码"
        />
        <button type="submit" onClick={handleSubmit}>提交</button>
      </div>
    </>
  )
}
```

两个要点：

- 每个 input 都写上 `name` 属性，等于给字段起了一个"键"；
- 一个 `handleChange` 通吃所有字段：`[e.target.name]: e.target.value`——**用计算属性名，把"这个字段的名字"和"它的新值"配对写回 form**。

字段再多，也只要一个状态对象、一个处理函数。这就是受控表单的"标准姿势"。

---

## 五、LoginForm：受控 + 实时校验

受控真正的威力在**校验**。因为值都走 React 状态，提交之前就能实时检查。`LoginForm.jsx`：

```jsx
import { useState } from "react";

const LoginForm = () => {
  const [form, setForm] = useState({
    username: "",
    password: ""
  })
  const [error, setError] = useState({})

  const validate = (name, value) => {
    let msg = "";
    if (name === "username") {
      if (!value) {
        msg = "用户名为空"
      } else if (value.length < 3) {
        msg = "用户名长度不能小于3"
      }
    }
    if (name === "password") {
      if (!value) {
        msg = "密码为空"
      } else if (value.length < 8) {
        msg = "密码长度不能小于8"
      }
    }
    setError(prev => ({
      ...prev,
      [name]: msg
    }))
  }

  const handleChange = e => {
    const { name, value } = e.target
    setForm({
      ...form,
      [name]: value
    })
    validate(name, value)
  }

  const isVaild = form.username && form.password &&
    !error.username && !error.password

  const handleSubmit = e => {
    e.preventDefault();
    if (!isVaild) return
    console.log(form, "-----------------")
  }

  return (
    <div className="login-wrapper">
      <form>
        <h2>登录</h2>
        <div className="form-item">
          <label>用户名</label>
          <input type="text" name="username"
            value={form.username}
            placeholder="请输入用户名"
            onChange={handleChange}
          />{error.username && <span className="error">{error.username}</span>}
        </div>
        <div className="form-item">
          <label>密码</label>
          <input type="text" name="password"
            value={form.password}
            placeholder="请输入密码"
            onChange={handleChange}
          />{error.password && <span className="error">{error.password}</span>}
        </div>
        <button type="submit" onClick={handleSubmit} disabled={!isVaild}>提交</button>
      </form>
    </div>
  )
}

export default LoginForm;
```

校验逻辑一层层很清晰：

1. `validate(name, value)`：按字段名判断——用户名不能空、不能少于 3 位，密码不能空、不能少于 8 位，把错误消息写进 `error` 状态；
2. `handleChange`：一边更新 `form`，一边触发校验；
3. `isVaild`：用户名、密码都不为空，且都没有错误消息，才算"可提交"；
4. 提交按钮 `disabled={!isVaild}`：**不满足条件，按钮直接禁用**。

界面上，每条输入下面紧跟一行错误提示：

```jsx
{error.username && <span className="error">{error.username}</span>}
{error.password && <span className="error">{error.password}</span>}
```

**值走状态，校验就能跟上每一次输入；校验跟上输入，按钮就能自己判断能不能点。** 这就是受控组件在真实业务里的样子。

---

## 六、受控 vs 非受控：一张表看懂

| | 受控组件 | 非受控组件 |
| --- | --- | --- |
| 值存在哪 | React 状态（state） | DOM 节点内部 |
| 谁来更新 | `onChange` → `setState` → `value` 回流 | 用户直接改，React 不干预 |
| 怎么取值 | 用 state | `ref.current.value` |
| 典型场景 | 需要实时校验、联动、默认值管理的表单 | 提交时一次性读取、第三方组件等 |
| 示例 | ControlledInput / RegisterForm / LoginForm | UncontrolledInput / CommentBox |

**受控组件拿"掌控"，非受控组件图"省事"。** 需要跟着输入做事的用受控，只用一次的用非受控——大多数业务表单，选受控更稳。

---

## 七、性能问题：父组件一渲染，子组件全跟着动

表单搞定，回到渲染本身。笔记把问题点得很直白：

> 父组件重新渲染，子组件也会重新渲染，带来性能的浪费；希望不相关的属性发生改变时，拒绝重新渲染。

看 `App.jsx`：

```jsx
function App() {
  const [count, setCount] = useState(0);
  console.log('App 组件渲染');
  const [name, setName] = useState('少林队');

  return (
    <>
      <button onClick={()=>setCount(count+1)}>点击计数{count}</button>
      <button onClick={()=>setName("峨眉队")}>改变名字</button>
      <RegularChild name={name}/>
      <MemoChild name={name}/>
    </>
  )
}
```

点"点击计数"，`count` 变了，`App` 重新渲染。**只要父组件重渲染，函数组件里的子组件默认也跟着重渲染**——哪怕它们的 props 一个字节都没变。这种"无辜陪跑"就是浪费。

---

## 八、memo：给子组件装上"记忆"

解决思路是"记忆"。笔记里的关键词是 **memo → memorize 缓存**。React 提供 `memo`，一个高阶函数，把组件包一层，让它记住上一次的 props：

```jsx
function RegularChild({name}) {
  console.log('渲染了RegularChild');
  return (
    <>
      <h1>{name}</h1>
    </>
  )
}

// memo 高阶函数
const MemoChild = memo(({name}) => {
  console.log('渲染了MemoChild')
  return (
    <>
      <h1>Hello {name}</h1>
    </>
  )
})
```

同一个 App 里，两个子组件都接收 `name`：

- `RegularChild`：没包 memo，父组件一渲染，它**无条件跟着渲染**；
- `MemoChild`：包了 memo，**只有当 `name` 变了才会重新渲染**。

于是点"点击计数"时，`count` 变了但 `name` 没变：RegularChild 照常陪跑（打印"渲染了RegularChild"），MemoChild 原地不动（不打印）。**memo 就像给组件装了记忆：props 没变，就跳过这次渲染，直接用上次的结果。**

注意 memo 比较的是 props 的引用。**如果父组件传入一个每次渲染都是新引用的函数或对象，memo 会认为"变了"而照常渲染**——这正是 `useCallback` 要解决的问题。

---

## 九、useCallback 与 useMemo：把函数和值也缓存起来

笔记里这一节的标题就是 **useCallback & useMemo，性能优化而生的 hook**。memo 挡的是"props 值没变"的场景，但函数和对象有个特性：**每次渲染都是一个新的引用**。

```jsx
const handleClick = () => { /* ... */ }   // 每次渲染都生成一个新函数
<MemoChild onClick={handleClick} />
```

哪怕函数体一模一样，`handleClick` 每次都是新引用 → memo 比较 props 时认为"变了" → 子组件还是重渲染。于是需要 `useCallback`：**把一个函数"记住"，依赖不变就返回同一个引用**：

```jsx
import { useCallback } from 'react'
const handleClick = useCallback(() => { /* ... */ }, [deps])
```

`useMemo` 同理，缓存的是"计算结果"（值）：

```jsx
import { useMemo } from 'react'
const result = useMemo(() => expensive(), [deps])
```

三者是一套组合拳：

| 工具 | 缓存什么 | 挡什么 |
| --- | --- | --- |
| `memo` | 组件本身 | props 没变时，整棵子树的重复渲染 |
| `useCallback` | 函数引用 | 传给 memo 子组件的函数"每次都变" |
| `useMemo` | 计算结果 | 昂贵的重复计算 |

**凡是要往下传、又希望子组件别乱动的函数，用 `useCallback` 包起来；凡是重计算又不想每次重算的，用 `useMemo` 记住。** 三件套合起来，就是 React 性能优化的第一道防线。

---

## 十、面试问答

**问：受控组件和非受控组件有什么区别？**

> 值归谁管。受控组件的值存在 React 状态里，通过 `value` + `onChange` 完成"输入 → setState → 回流"，状态是唯一数据源，适合需要实时校验、联动的场景；非受控组件的值存在 DOM 里，React 不干预，需要时用 `useRef` 的 `ref.current.value` 读取，适合提交时一次性取值的场景。多数业务表单选受控更稳。

**问：为什么受控组件方便做校验？**

> 因为每次输入都触发 `onChange` → `setState`，值永远在状态里、始终跟得上输入。校验函数读当前值、写错误消息，`isVaild` 汇总条件，提交按钮 `disabled={!isVaild}` 自动禁用。非受控组件拿不到实时输入，自然做不了实时校验。

**问：父组件重新渲染，子组件一定会重新渲染吗？**

> 默认会。函数组件只要父组件重渲染，子组件也会跟着重渲染，哪怕 props 没变。想"不相关的属性发生改变时拒绝重新渲染"，就用 `memo` 把组件包起来：props 没变时跳过这次渲染。

**问：有了 memo 为什么还需要 useCallback？**

> memo 比较 props，但函数每次渲染都是新引用。如果给 memo 子组件传了一个内联函数，memo 会认为 props "变了"而照常渲染，memo 就白装了。useCallback 用依赖数组把一个函数"记住"，依赖不变就返回同一个引用，配合 memo 才能真的挡住重渲染。

**问：useMemo 和 useCallback 有什么区别？**

> useCallback 缓存函数引用，useMemo 缓存计算结果（值）。两者都靠依赖数组判断要不要重新生成，依赖不变就走缓存。一个是"记住函数"，一个是"记住算好的值"。

---

## 结语：先管数据归谁，再管谁该重渲染

这一天的两条线，正好是 React 里最日常、也最容易忽略的两个问题：

```text
数据主权   受控 / 非受控组件  →  值归 React 状态管，还是 DOM 自己管
渲染防线   memo / useCallback →  该渲染的渲染，不该渲染的拒绝
```

受控组件把"值"握在状态手里，换来了实时校验和可预测的数据流；非受控组件把"值"留给 DOM，换来了简单直接。性能这条线同理：memo 记住组件，useCallback 记住函数，useMemo 记住结果——**把变化精确地限制在真正需要变化的地方。**

动手前，可以拿这张清单自检：

- [ ] 输入框的值需要跟着输入实时处理（校验、联动）时，用的是受控组件（value + onChange），而不是让值散在 DOM 里？
- [ ] 只在提交那一刻才需要读的字段，用 `useRef` 读取 `ref.current.value`，而不是硬塞一个状态？
- [ ] 一个表单多个字段时，收进一个 form 状态对象，用 `name` + 计算属性名统一 `handleChange`？
- [ ] 校验逻辑写在输入时触发、提交按钮 `disabled={!isVaild}`，而不是等到提交才想起来校验？
- [ ] 父组件会频繁重渲染、而子组件 props 很少变时，用 `memo` 把子组件包起来？
- [ ] 给 memo 子组件传函数时，用 `useCallback` 保持引用稳定；昂贵的重复计算用 `useMemo` 缓存？

表单是界面和用户的握手，性能是界面和设备的握手。先想清楚"数据归谁管"，再想清楚"什么时候该重渲染"——这一天的两件事，都从最朴素的场景里长出来，却是 React 进阶绕不过的地基。
