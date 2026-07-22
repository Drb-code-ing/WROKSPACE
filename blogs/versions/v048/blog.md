# React 进度条组件的健壮性：props / state 分工、空值合并与受控输入

## 引言

v044 搭起了浏览器端侧 AI 的整体架构。  
v046 沿着同一个 WebGPU Demo，把镜头对准了 React 合成事件、组件树，以及"为什么要把 Progress 抽成组件"。

第四十二天的补充提交（`0e46276`）没有再讲事件模型，也没有重讲组件树。它把 Demo 往前推了半步，但真正值钱的内容，是组件工程里更细、也更常考的一层：

```text
1. Progress 组件如何从"能显示"变成"好用且健壮"
2. props 和 state 两种数据到底怎么分工
3. 聊天输入框如何做受控组件，以及 TypeScript 事件类型断言为什么必要
```

本文基于：

- `fe/React/deepseek-r1-webgpu/readme.md`（进度条组件、两种数据）
- `webgpu-demo/src/components/Progress.tsx`（`??=`、`formatBytes`、宽度驱动）
- `webgpu-demo/src/App.tsx`（`input` state、受控 textarea、Enter 发送）

**明确边界：不重复 v046 的 DOM 0/2、合成事件哲学、组件树替代 DOM 树；也不重复 v044 的 WebGPU / Transformers.js 原理。**

---

## 一、这次迭代到底改了什么

看 diff，变化集中在三处：

```text
Progress.tsx
  - 文本三行裸展示 → 宽度随 percentage 增长的真实进度条
  - 新增 formatBytes：把字节数格式化成 B / kB / MB / GB
  - percentage ??= 0：空值兜底

App.tsx
  - 新增 input state
  - 新增聊天输入框 textarea
  - 受控输入 + Enter 发送（Shift+Enter 换行）
  - onEnter 先把 status 置为 loading（后续接真实推理）

readme.md
  - 补"进度条组件"设计说明
  - 补"两种数据"：state vs props
```

如果只看功能，像是"UI 补丁"。如果看工程，它补的是：**组件封装的健壮性，以及数据所有权的清晰划分。**

---

## 二、Progress：从占位组件到可用组件

### 2.1 之前：能渲染，但不像进度条

v046 阶段的 Progress 大致是：

```tsx
function Progress({ text, percentage, total }) {
  return (
    <div>
      <p>{text}</p>
      <p>{percentage}%</p>
      <p>{total}</p>
    </div>
  )
}
```

它完成了组件拆分的第一步：接口清楚、可 map 复用。  
但它还不是"进度条"——没有视觉进度，也没有对脏数据的防御。

### 2.2 现在：宽度即状态

第四十二天补完后：

```tsx
function Progress({ text, percentage, total }) {
  percentage ??= 0
  return (
    <div className="w-full bg-gray-100 text-left rounded-lg overflow-hidden mb-0.5">
      <div
        style={{ width: `${percentage}%` }}
        className="bg-blue-400 whitespace-nowrap px-1 text-sm"
      >
        {text}
        {percentage.toFixed(2)}%
        {isNaN(total) ? "" : `of${formatBytes(total)}`}
      </div>
    </div>
  )
}
```

学习笔记把结构说得很直白：

```text
容器 100%
子元素（进度条）宽度由 props.percentage 决定，跟着长大
```

这是经典 UI 模式：

```text
外层：轨道（track）
内层：填充（fill）
填充宽度 = percentage%
```

数据一变，宽度一变，用户看到的就是"下载进度"。

### 2.3 `percentage ??= 0`：封装者多考虑，使用者用得爽

```tsx
percentage ??= 0
```

这是 ES2021（常说 ES12）的**空值合并赋值**：

```text
仅当 percentage 为 null 或 undefined 时，赋值为 0
0 / false / '' 不会被误替换
```

为什么需要它？

```text
初始化时，可能还没有下载进度这个概念
父组件可能暂时传不来 percentage
如果直接 percentage.toFixed(2)，会炸
```

笔记原话：

> 封装者多考虑，使用者用的爽。

这是组件设计的基本态度：

```text
组件对外暴露简单接口
对内兜住边界情况
不要把 null 检查甩给每一位调用方
```

### 2.4 `formatBytes`：把工程细节藏进组件

```tsx
function formatBytes(size: number) {
  const i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  return (
    +(size / Math.pow(1024, i)).toFixed(2) * 1 +
    ["B", "kB", "MB", "GB", "TB"][i]
  );
}
```

模型文件体积动辄几十 GB 量级的字节数，直接显示 `37521985789` 对用户没有意义。  
`formatBytes` 做的事：

```text
37521985789 → 约 34.95GB
```

同时：

```tsx
{isNaN(total) ? "" : `of${formatBytes(total)}`}
```

`total` 不可用时直接不显示，而不是渲染 `NaN`。  
这又是一层防御性 UI。

### 2.5 进度条组件的设计清单

把这次补强沉淀成清单：

```text
1. 单一职责：只负责"展示某一项下载进度"
2. 数据来自 props，不自己发明业务状态
3. 视觉映射清晰：percentage → width
4. 默认值与脏数据兜底：??=、isNaN
5. 人类可读：formatBytes、toFixed(2)
6. 样式原子化：容器轨道 + 填充条
```

v046 回答"为什么抽组件"。  
本篇回答"抽出来之后如何让它健壮"。

---

## 三、两种数据：state 与 props

这是第四十二天笔记的核心概念段，也是 React 面试最高频的一对词。

### 3.1 定义对照

```text
state（状态）
  - 用 useState 声明
  - 组件自有
  - 组件自己打理（读取 + 更新）
  - 变化会触发重渲染

props（属性）
  - 从父组件传递给子组件
  - 子组件不能直接修改
  - 若要改，必须"报告"父组件，由父组件改自己的 state
```

笔记原话：

> 子组件主要负责展示，父组件给我什么 props，我就展示什么。

### 3.2 在 Demo 里的具体归属

```text
App（父）
  state:
    status
    error
    loadingMessage
    input
    （后续真实接入后还有 progressItems）

Progress（子）
  props:
    text
    percentage
    total
  无业务 state
```

数据流是单向的：

```text
App 持有真相（source of truth）
  ↓ props
Progress 只负责呈现
```

### 3.3 为什么子组件不能直接改 props

如果允许子组件改 props：

```text
多个子组件同时改同一份数据 → 冲突
父组件不知道数据何时被改 → 状态失控
调试时找不到"谁改的" → 可维护性崩溃
```

所以 React 坚持：

```text
props 只读
要变，就 setState（在拥有它的组件里）
```

### 3.4 展示组件 vs 容器组件（不必背名词，要懂职责）

Progress 是典型的展示型组件：

```text
输入：props
输出：UI
副作用：尽量没有
```

App 更像容器：

```text
持有状态
处理交互
决定何时 loading / ready / error
把切片数据分发给子组件
```

这和"组件树"不是同一话题：  
组件树讲结构，**props/state 讲数据所有权**。

### 3.5 健壮性从数据边界开始

```text
父组件：保证业务状态完整、时序正确
子组件：保证缺字段时也不崩、显示仍可读
```

`percentage ??= 0` 就是子组件侧的健壮性；  
`disabled={status !== 'ready'}` 则是父组件侧对交互时序的健壮性。

---

## 四、聊天输入框：受控组件落地

### 4.1 新增 state：`input`

```tsx
const [input, setInput] = useState("")
```

这标志着 Demo 从"只加载模型"迈向"准备对话"。  
输入内容是 App 的自有状态，不是 Progress 的事。

### 4.2 React 不做真正的双向绑定

```tsx
<textarea
  value={input}
  onInput={(e) => {
    setInput((e.target as HTMLTextAreaElement).value)
  }}
/>
```

代码注释写得很清楚：

> React 不支持双向绑定，性能不太好。

含义是：

```text
不是 v-model 那种框架自动双向同步
而是：
  value={state}        ← 状态决定显示
  onInput/onChange     ← 用户输入写回状态
```

这叫**受控组件（controlled component）**：

```text
表单元素的值，始终由 React state 控制
```

好处：

```text
随时可读 input
可在发送前校验
可在发送后清空
可按 status 禁用
可做输入中的派生 UI（字数、按钮可点状态）
```

### 4.3 为什么要类型断言

```tsx
setInput((e.target as HTMLTextAreaElement).value)
```

事件对象 `e` 是通用的。`e.target` 指向触发元素，但 TypeScript 不能假设所有 target 都有 `value`：

```text
click 事件的 target 未必有 value
input / change 在表单元素上才稳定有 value
```

所以要断言成 `HTMLTextAreaElement`。  
这不是啰嗦，而是把运行时现实写进类型系统：

```text
我知道这是 textarea
请允许我读 .value
```

### 4.4 Enter 发送，Shift+Enter 换行

```tsx
onKeyDown={(e) => {
  if (input.length > 0 && e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault() // 阻止 Enter 默认插入换行
    onEnter()
  }
}}
```

交互细节：

```text
有内容 + Enter + 非 Shift → 发送
Shift + Enter             → 保留 textarea 默认换行
空内容                    → 不发送
```

`e.preventDefault()` 很关键：否则 Enter 会先插入换行，再触发发送，输入框体验会脏。

### 4.5 用 status 锁交互时序

```tsx
disabled={status !== 'ready'}
title={status === 'ready' ? 'Model is ready' : 'Model not loaded yet'}
```

```text
模型未就绪 → 输入框禁用
模型 ready → 才允许输入
```

这和 Load Model 按钮的 `disabled={status !== null || error !== null}` 是同一类工程思维：

> 把"什么时候能点 / 能输入"编码成状态表达式，而不是靠用户自觉。

### 4.6 `onEnter` 现在只是桥梁

```tsx
const onEnter = () => {
  setStatus('loading')
}
```

当前实现还没真正发推理请求，它先把状态机往前拨一格。  
对学习而言，这已经足够建立链路：

```text
输入（input state）
  → 键盘事件
  → onEnter
  → 更新 status
  → UI 切换到加载态
```

后续接上 Transformers.js 推理时，业务会变厚，但数据边界不用推翻重来。

---

## 五、把这次改动放回组件化坐标

```text
v044：端侧 AI 架构与技术选型
v046：合成事件、组件树、为什么抽 Progress
v048（本篇）：
  Progress 如何健壮
  props / state 如何分工
  受控输入如何落地
```

一条越来越细的前端工程线：

```text
会拆组件
  → 会设计 props
  → 会兜底边界
  → 会划分数据所有权
  → 会做受控表单与交互时序
```

这也是面试里从"用过 React"到"能讲清 React"的分界。

---

## 六、可直接复用的实践清单

### 6.1 写展示组件时

```text
1. 先定 props 契约（text / percentage / total）
2. 视觉绑定到数据（width: percentage%）
3. 空值与非法值兜底（??= / isNaN）
4. 人类可读格式化（formatBytes / toFixed）
5. 不要在展示组件里偷偷持有业务真相
```

### 6.2 写容器组件时

```text
1. state 只放"会变且影响 UI"的数据
2. 子组件需要的数据通过 props 下发
3. 子组件想改数据，通过回调通知父组件
4. 用 status 统一管理可交互性
5. 表单优先受控，便于校验与重置
```

### 6.3 受控输入最小模板

```tsx
const [value, setValue] = useState("")

<textarea
  value={value}
  onInput={(e) => setValue((e.target as HTMLTextAreaElement).value)}
  onKeyDown={(e) => {
    if (value.length > 0 && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      // submit
    }
  }}
/>
```

---

## 七、面试高频问题与答题框架

### 7.1 props 和 state 有什么区别？

**回答框架：**

> state 是组件自己的数据，用 `useState` 声明和维护，变化触发重渲染。props 是父组件传给子组件的只读数据，子组件不能直接改；若要改，必须通过回调让父组件更新自己的 state。简单说：state 是自有状态，props 是外部输入。

### 7.2 为什么 Progress 里要用 `percentage ??= 0`？

**回答框架：**

> 初始化或父组件暂未提供进度时，`percentage` 可能是 `null/undefined`。直接调用 `toFixed` 会报错。`??=` 只在空值时回落为 0，且不会把合法的 `0` 误替换。这是组件封装的健壮性：把边界情况消化在组件内部，降低调用方心智负担。

### 7.3 什么是受控组件？React 为什么常用它？

**回答框架：**

> 受控组件指表单值由 React state 驱动：`value={state}`，用户输入通过 `onChange/onInput` 写回 state。好处是数据流单一、便于校验、禁用、清空和派生 UI。React 不提供 Vue 那种内置双向绑定，就是为了让"数据从哪里来、谁能改"始终明确。

### 7.4 为什么 `e.target.value` 在 TypeScript 里要断言？

**回答框架：**

> 事件对象是通用类型，`target` 不一定是带 `value` 的表单元素。点击事件的 target 就未必有 `value`。对 textarea 断言为 `HTMLTextAreaElement`，是在告诉类型系统：这里的目标元素确定是文本域，可以安全读取 `value`。

### 7.5 子组件能不能自己 setState 一份 percentage？

**回答框架：**

> 可以有 UI 动画用的本地 state，但业务进度的真相源应在父组件。若 Progress 自己维护 percentage，而 App 也有下载进度，就会出现双真相，最终不同步。展示型进度条更合理的模式是：父组件持有进度，子组件通过 props 渲染。

---

## 结语

第四十二天 WebGPU 的补充提交，表面上是：

```text
进度条更好看了
输入框出现了
```

实际上补齐的是 React 组件工程的三块基本功：

```text
1. 组件健壮性
   percentage ??= 0
   formatBytes
   isNaN(total) 兜底
   宽度映射 percentage

2. 数据所有权
   state：组件自有，自己打理
   props：父传子，子只读展示
   子组件主要负责展示

3. 受控交互
   input state
   value + onInput
   Enter 发送 / Shift+Enter 换行
   status 控制 disabled
```

把它和相邻文章排成一条线：

```text
v044：浏览器端侧 AI 是什么
v046：合成事件与组件树（结构与事件）
v047：Workflow vs Agent（AI 工程概念）
v048（本篇）：props/state、组件健壮性、受控输入（数据与交互）
```

下一阶段，这个 Demo 会继续从"UI 状态机"走向"真实模型加载与推理"。那时 `progressItems` 不再是注释掉的 mock，`onEnter` 也不再只是 `setStatus('loading')`——但今天建立的数据边界，会原样用上。
