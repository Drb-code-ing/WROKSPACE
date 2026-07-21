# React 合成事件与组件树：从 DOM 事件演化到组件化架构思维

## 引言

v044 搭建了浏览器端侧 AI 推理的整体架构——Transformers.js 加载模型、WebGPU 加速推理、React + TypeScript + Tailwind 构建 UI。但那一篇聚焦的是"怎么做"和"为什么这样做"的技术链路。

这一篇不重复端侧AI和WebGPU的概念。镜头从"AI 推理"转回"前端工程"——第四十一天下午的学习笔记在 WebGPU Demo 的基础上继续写代码，过程中触及了三个每个 React 开发者都必须面对、但面试和日常讨论里经常含糊其辞的问题：

```text
React 里的 onClick 和 HTML 的 onclick 是不是一回事？
如果不是，React 对它做了什么？
为什么 React 团队宁愿"不发明新概念"也要用 onClick 这个名字？
```

然后是组件——Demo 里的进度条被抽成了独立组件，这个看似不起眼的操作，背后是一整套前端工程化的世界观：

```text
组件树代替 DOM 树 → 页面的构成不再是 div 的嵌套，
                    而是有业务意义的组件之间的组合关系
```

本文基于 `fe/React/deepseek-r1-webgpu/webgpu-demo` 的第四次迭代，从 DOM 事件标准的历史演进、React 合成事件的设计动机，到组件树取代 DOM 树的范式转移，把这些"每天都在用但未必真理解"的概念彻底拆开。

---

## 一、一个按钮，两种写法：DOM 事件的演化史

第四十一天下午的代码里新增了一个 `event.html`，只有 17 行：

```html
<button id="btn" onclick="console.log('点击了按钮 第二种方案')">按钮</button>

<script>
  document.getElementById('btn').addEventListener('click', function() {
    console.log('点击了按钮 第一种方案')
  })
</script>
```

一个小小的按钮上同时用了两种事件绑定方式。这不是"随便写的"，它演示了 DOM 事件标准二十多年的演化历程。每一个前端每天都在写 `onClick` 和 `addEventListener`，但把它们放在历史坐标里看，很多困惑就自动解开了。

### 1.1 DOM 0 级事件：写在 HTML 里的 onclick

```html
<button onclick="console.log('点击了')">按钮</button>
```

这是最原始的事件绑定方式——直接在 HTML 属性里写 JavaScript 代码。它的本质不是"React 发明了 onClick"，而是浏览器从最早期的 Netscape Navigator 时代就支持这种方式。

但它的设计缺陷也是明显的：

```text
HTML、CSS、JS 的"三剑客"被耦合在一起
  → onclick 属性里写的是 JS，但它在 HTML 文件里
  → 样式写在 style 属性里，也是 HTML
  → 行为（JS）、结构（HTML）、表现（CSS）互相缠绕

同一个元素的同一个事件只能绑定一个处理函数
  → 第二个 onclick 会覆盖第一个
  → 多人协作、组件叠加时无法共存

JS 代码以字符串形式嵌在 HTML 属性中
  → 引号转义地狱
  → 语法高亮失效
  → 无法用 IDE 的跳转和重构功能
```

> "三剑客不要耦合在一起"——这是第四十一天学习笔记的原话。模块化分离是前端工程化的起点。

### 1.2 DOM 1 级事件？不存在的

学习笔记里有一个有趣的追问：DOM 0 有了，那 DOM 1 级事件是什么？

答案是没有。

```text
DOM 0  ← 浏览器厂商各自实现，没有被 W3C 标准化
DOM 1  ← 1998 年 W3C 发布，但这一版只规范了 DOM Core（节点操作）
         和 DOM HTML（HTML 元素的 DOM 接口），没有更新事件模型
DOM 2  ← 2000 年发布，正式引入了 Events 模块：
         - addEventListener / removeEventListener
         - 事件流（捕获 → 目标 → 冒泡）
         - Event 对象标准化
DOM 3  ← 在 DOM 2 基础上扩展了键盘事件、滚轮事件等
```

> DOM 的标准迭代不是线性的。不是"1 级在 0 级基础上加了 X，2 级又加了 Y"——每个版本有自己的关注范围。DOM 1 没有事件相关更新，所以不存在 DOM 1 级事件。

### 1.3 DOM 2 级事件：addEventListener 的革命

```javascript
document.getElementById('btn').addEventListener('click', function() {
  console.log('点击了按钮')
})
```

DOM 2 带来的不是"换一种写法"，而是几个根本性的改进：

**第一，解耦。** JS 代码回到了 `.js` 文件或 `<script>` 标签里，不再嵌在 HTML 属性中。结构、表现、行为各自独立——维护其中一项时不会误伤另外两项。

**第二，多监听。** 同一个 DOM 元素的同一个事件可以绑定多个处理函数：

```javascript
el.addEventListener('click', handler1)  // 日志上报
el.addEventListener('click', handler2)  // 业务逻辑
el.addEventListener('click', handler3)  // 埋点
// 三个都会触发，互不覆盖
```

这在组件化开发中是刚需——不同关注点的逻辑需要独立注册、独立清理，不能互相覆盖。

**第三，事件流。** `addEventListener` 的第三个参数 `useCapture` 让开发者可以选择在捕获阶段还是冒泡阶段处理事件。这是 `onclick` 属性永远做不到的。

```javascript
el.addEventListener('click', handler, true)   // 捕获阶段
el.addEventListener('click', handler, false)  // 冒泡阶段（默认）
```

### 1.4 为什么还要提 DOM 0？它在现代前端里死透了吗？

没有。React 的 `onClick` 在**命名上**延续了 DOM 0 的风格（`on` + 事件名），但底层的实现机制完全不同。这是有意为之——下一节展开。

---

## 二、React 为什么用 onClick：不发明新概念的设计哲学

### 2.1 Vue 走了另一条路

不同的框架对"事件绑定怎么写"有不同的回答：

```html
<!-- Vue：@ 符号 -->
<button @click="handleClick">按钮</button>

<!-- React：on + 事件名 -->
<button onClick={handleClick}>按钮</button>
```

Vue 用 `@` 作为指令前缀（`@click`、`@input`、`@submit`），优点是"一眼就能看出这是 Vue 的东西，不是原生 HTML"。但代价是开发者要额外学一套指令语法。

React 的选择体现了它的设计哲学：

> "代码洁癖——能不发明新概念就不发明。React 直接用已在的概念。onClick 作为高手没有学习成本。"

React 团队赌的是：前端开发者已经知道 `onclick`（DOM 0）和 `click` 事件（DOM 2），看到 `onClick` 不需要新学任何东西。一个写过原生 JS 的人看到 `<button onClick={handleClick}>` 能立刻理解它的作用。

这个 "zero-learning-cost" 的哲学在 React 的很多设计中都有体现：
- JSX 不是新语言，是 JavaScript + XML 的语法糖
- `useState` 和 `useEffect` 的名字直接描述了它们的行为
- Props 就是 function parameters，只不过传给的是组件

### 2.2 但 onClick 不是 onclick

这是最容易被忽略的一点：

```text
HTML 的 onclick     → 原生 DOM 事件，直接在 DOM 元素上触发
React 的 onClick    → 合成事件（SyntheticEvent），
                      是 React 对原生事件的封装
```

React 里的事件并不是原生事件，是**合成事件**。

这意味着：

```javascript
// React 中
<button onClick={(e) => {
  console.log(e.nativeEvent)     // 原生事件对象
  console.log(e)                 // React 合成事件对象
  // 它们是不同的对象
}}>
```

### 2.3 合成事件要解决什么

**第一，跨浏览器兼容。**

不同浏览器对事件对象的属性名和行为不完全一致。React 17 之前，合成事件抹平了这些差异。React 17 之后，合成事件委托到 `root` 节点而非 `document`，使得多个 React 版本共存成为可能。

**第二，事件委托的性能优化。**

React 不会在每个 DOM 元素上绑定事件监听器。它利用事件冒泡，把所有事件统一委托到根节点处理。一个包含 1000 个按钮的列表，React 不绑定 1000 次 `click`，而是绑一次，通过内部映射找到真正应该响应的事件处理器。

```text
原生方式：每个 <button> 都绑定一个 addEventListener('click', ...)
          → 内存占用 = N × 事件处理器

React 方式：在根节点绑定一次，事件冒泡上来后
           → 根据 fiber 树定位目标组件
           → 调用对应的处理函数
```

**第三，与 React 的渲染周期对齐。**

合成事件的生命周期被纳入 React 的调度系统。事件处理函数的执行在 React 的控制范围内，这让 React 可以在事件处理完毕后统一进行状态更新和重渲染——而不是每次 `setState` 都立即触发 DOM 操作。

### 2.4 event.html 里的 17 行代码：一个历史教学的切片

回到 Demo 的 `event.html`：

```html
<button id="btn" onclick="console.log('点击了按钮 第二种方案')">按钮</button>
<script>
  document.getElementById('btn').addEventListener('click', function() {
    console.log('点击了按钮 第一种方案')
  })
</script>
```

点击这个按钮，控制台会输出两条日志：

```text
点击了按钮 第二种方案   ← onclick 属性（DOM 0 级）
点击了按钮 第一种方案   ← addEventListener（DOM 2 级）
```

执行顺序是：onclick 先于 addEventListener，因为它们都在冒泡阶段（或者说 onclick 在目标阶段被调用时，addEventListener 注册的冒泡阶段处理函数紧随其后）。

这 17 行代码浓缩了前端事件系统的全部演化：从写在 HTML 里、到写在 JS 里、再到被框架封装——`onClick` 三个字母背后，是二十年前端标准的迭代。

---

## 三、进度条组件：从"抽出去"到"为什么要抽出去"

第四十一天下午的代码没有停留在概念讲解，而是实打实地把进度条抽成了组件。

### 3.1 从 App.tsx 中剥离 Progress 组件

在 App.tsx 中，进度条的数据是 `progressItems` 数组：

```typescript
const [progressItems, setProgressItems] = useState([
  {
    text: 'model.onnx',
    percentage: 0,
    total: 37521985789
  },
  {
    text: 'model2.onnx',
    percentage: 10,
    total: 35521985782
  }
])
```

渲染逻辑原本可能直接写在 App.tsx 里——循环 `progressItems`，每个生成一段包含文件名、百分比、总大小的 JSX。但 Demo 选择创建 `Progress.tsx`：

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

export default Progress
```

然后在使用方：

```tsx
{
  progressItems.map(({text, percentage, total}, i) => {
    return (
      <Progress key={i} text={text} percentage={percentage} total={total} />
    )
  })
}
```

### 3.2 "抽组件"不是代码洁癖，是对变化的防御

很多人把"抽组件"理解成"代码太长就拆出来"。这是结果而非原因。真正的动机是：

```text
变化隔离：当进度条的样式、逻辑、数据结构发生变化时，
          只改 Progress.tsx，App.tsx 一行不动

复用：同一个 Progress 组件可以用于模型 1、模型 2、模型 3，
      每个只需要换 {text, percentage, total} 三个 props

测试边界：Progress 不依赖 App 的状态或上下文，
          可以独立写单元测试

团队协作：一个人改 Progress 的 UI，另一个人改 App 的加载逻辑，
          互不冲突，因为接口（props）已经约定了
```

学习笔记里的原话非常精准：

> "比较独立的，可复用的业务模块，把它单独抽离出来，作为组件。"

关键词是**独立**和**可复用**——不是因为代码长，而是因为它有独立的职责边界。

### 3.3 函数返回 JSX 就是组件

React 组件的定义可以非常朴素：

```tsx
// 返回 jsx 的函数就是组件
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

没有 class、没有装饰器、没有注册——一个接受参数（props）并返回 UI 描述（JSX）的函数，就是 React 组件。这也是 React 的函数式基因：组件 = `f(props) → UI`。

### 3.4 Props 的传递方式：HTML 属性风格

```tsx
<Progress key={i} text={text} percentage={percentage} total={total} />
```

React 选择用 HTML 属性的语法传递 props——`text={text}` 看起来就像给 HTML 标签写属性。这跟 `onClick` 的设计哲学一脉相承：不发明新概念，用开发者已有的认知。

Vue 走了类似的路（`<Progress :text="text" :percentage="percentage" />`），而 Angular 用了不同的语法（`[text]="text"`）。React 的选择始终是最接近原生 HTML 的那条路。

---

## 四、组件树：前端开发的世界观升级

### 4.1 DOM 树是"物理视角"，组件树是"业务视角"

传统的 HTML 页面，结构是 DOM 树：

```text
html
 ├─ head
 └─ body
     ├─ div.container
     │   ├─ div.header
     │   └─ div.content
     │       ├─ div.model-info
     │       └─ div.progress-area
     └─ div.footer
```

看了这棵树，你知道元素之间的嵌套关系——但你不知道这个页面在"做什么"。

组件树用业务语言描述同一个页面：

```text
App
 ├─ Header（标题 + 副标题）
 ├─ Content（说明文案 + Load Model 按钮）
 └─ ProgressList（仅在 loading 状态显示）
     ├─ Progress（model.onnx）
     └─ Progress（model2.onnx）
```

一眼就能看出页面的构成：有哪些功能块、每个块负责什么、数据是怎么流向的。

### 4.2 一眼看出页面的组件构成、组件化程度、粒度

这是学习笔记里的原话。它说的不是审美偏好，而是工程能力：

```text
看组件树 → 能不能三秒内画出页面的功能结构图？
          → 能 → 组件化设计合理
          → 不能 → 可能耦合过重，职责不清

看粒度 → 组件的拆分层次是否均匀？
        → 有的组件 3 行代码，有的 300 行 → 需要重新审视边界
        → 层次均匀 → 团队对"什么是合理的复杂度"有共识
```

### 4.3 前端发展的必然：页面复杂度推着架构往前走

学习笔记里把"组件树代替 DOM 树"定位为**前端发展的必然**。这不是夸张。

看二十年前端 UI 的演进：

```text
2000s  jQuery 时代
  一个页面 = 一个 HTML + 一堆 $('.selector').on('click', ...)
  团队协作靠"你改 header 区域，我改 footer 区域"
  问题：选择器冲突、状态散落、无法复用

2010s  MVC/MVVM 时代
  数据驱动视图，模板 + ViewModel
  但组件之间仍有模板和逻辑的耦合

2020s  组件化时代
  页面 = 组件树的组合
  组件 = 最小开发单元
  团队协作 = 认领组件，约定 props 接口
  复用 = 跨页面、跨项目共享组件
```

页面的交付越来越复杂——一个页面可能同时有实时数据流、AI 推理进度、用户交互、权限状态、多设备适配。如果没有"组件作为最小开发单元"这个抽象，复杂度的增长会让团队无法并行工作。

> **页面交付越来越复杂，组件作为最小开发单元，团队好协作、好复用、好维护。**

### 4.4 组件树不等于"把 div 换成组件名"

一个常见误区：把组件树理解成"把 DOM 树里的 `div` 都换成自定义组件名"。这不是组件化。

真正的组件化要求：

```text
每个组件有独立的：
  - 状态（自己的 useState）
  - 接口（明确定义的 props）
  - 职责（一个组件只做一件事）
  - 生命周期（mount / update / unmount）
  - 测试边界

组件之间的通信：
  - 父 → 子：props
  - 子 → 父：callback props（onXxx）
  - 跨层级：context / 状态管理库
```

组件树不仅是视觉上的嵌套，也是数据流向和职责边界的拓扑图。

---

## 五、Demo 代码的结构解读：App.tsx 的状态演变

第四十一天下午的代码改动不仅是"加了 Progress 组件"，App.tsx 本身也做了一次重要的重构。让我们走近代码的变化。

### 5.1 状态从注释走向激活

之前的 App.tsx 中，很多状态是被注释掉的：

```tsx
// const [status, setStatus] = useState(null)
// const [loadingMessage, setLoadingMessage] = useState("")
// const [progressItems, setProgressItems] = useState([...])
```

下午的改动把它们全部激活：

```tsx
const [status, setStatus] = useState(null)
const [error, setError] = useState(null)  // 从 "出错了" 改为 null
const [loadingMessage, setLoadingMessage] = useState("开始加载")
const [progressItems, setProgressItems] = useState([
  { text: 'model.onnx', percentage: 0, total: 37521985789 },
  { text: 'model2.onnx', percentage: 10, total: 35521985782 }
])
```

这个转变的意义：页面不再是静态展示，而是有了**不同的状态**。

```text
status: null      → 初始展示状态（显示 Load Model 按钮）
status: 'loading' → 加载状态（显示进度条）
status: 'ready'   → 就绪状态（后续迭代加入）
status: 'error'   → 错误状态（已在代码中，但 error !== null 时展示）
```

### 5.2 条件渲染：React 里的 if-else

```tsx
{
  status === 'loading' && (
    <div className="w-full max-w-[500px] mx-auto p-4">
      <p className="text-center mb-1">{loadingMessage}</p>
      {
        progressItems.map(({text, percentage, total}, i) => {
          return (
            <Progress key={i} text={text} percentage={percentage} total={total} />
          )
        })
      }
    </div>
  )
}
```

这段代码展示了 React 条件渲染最常用的模式：

```text
status === 'loading' && (...)   ← 短路求值，只在条件为真时渲染
{error && (...)}                ← 同样模式，错误时才显示错误面板
```

不需要 `v-if` / `v-show` / `ng-if` 这些框架专属指令。React 选择用 JavaScript 本身的 `&&` 运算符——又是"不发明新概念"哲学的体现。`&&` 在 JS 里是什么意思，在 JSX 里就是什么意思。

### 5.3 map：React 的列表渲染

```tsx
progressItems.map(({text, percentage, total}, i) => {
  return <Progress key={i} text={text} percentage={percentage} total={total} />
})
```

注意几点：

**`key={i}`**：React 需要 key 来追踪列表中的每个元素。用 index 作为 key 在静态列表中可行，但在会增删改的列表中应该用稳定 ID。学习笔记里用 `i` 是因为当前数据是静态 Mock。

**解构参数**：`({text, percentage, total}, i)` 直接解构了 progressItems 的每一项，不需要写 `item.text`。

**`map` 返回新数组**：`progressItems.map(...)` 返回的是 `[<Progress />, <Progress />]`，React 会自动渲染这个组件数组。

> "React 绝对不去发明新语法——`map` 一个数组返回一个新数组，原来的 json 数组 -> 渲染的进度条 JSX。"

### 5.4 按钮状态管理：disabled 的工程细节

```tsx
<button 
  className="border px-4 py-2 rounded-lg bg-blue-400 text-white hover:bg-blue-500 disabled:cursor-not-allowed select-none"
  disabled={status !== null || error !== null}
  onClick={() => {
    setStatus('loading')
  }}>
  Load Model
</button>
```

`disabled={status !== null || error !== null}` 这条逻辑值得细看：

```text
status !== null  → 正在加载中或已加载完成，禁止重复点击
error !== null   → 出错了，先处理错误再重试
```

这是防御性 UI 编程的一个缩影——把"什么情况下按钮不可用"编码为单一布尔表达式，而不是在多个地方分散设置 disabled。

---

## 六、从 Demo 到工程：组件化思维的面试图景

### 6.1 为什么 React 的 onClick 和 HTML 的 onclick 不是一回事？

**问题本质**：考察对 React 合成事件的理解深度。

**回答框架**：

> HTML 的 `onclick` 属性是 DOM 0 级事件，直接在 DOM 元素上绑定原生事件处理函数。React 的 `onClick` 是合成事件——React 在根节点统一监听，利用事件冒泡找到目标 fiber 节点，然后触发对应的处理函数。这样做有三个好处：跨浏览器兼容性（抹平原生事件差异）、性能（事件委托，一万个按钮也只绑一次）、与渲染周期对齐（事件处理后统一批量更新）。

### 6.2 DOM 2 级事件相比 DOM 0 级做了什么改进？

**问题本质**：考察对 Web 标准演化历史的理解。

**回答框架**：

> DOM 0 级（onclick 属性）将 JS 代码耦合在 HTML 中，同一事件只能绑定一个处理函数。DOM 2 级（addEventListener）实现了三个关键改进：事件与 DOM 结构解耦（JS 回到 .js 文件）、同一事件支持多监听器（不同关注点各自注册互不覆盖）、事件流控制（捕获/冒泡阶段可选）。DOM 1 级没有更新事件模型，所以不存在 DOM 1 级事件。

### 6.3 组件树替代 DOM 树意味着什么？

**问题本质**：考察对前端架构范式转移的理解。

**回答框架**：

> DOM 树是浏览器的物理渲染结构——它告诉你元素之间的嵌套关系。组件树是开发者视角的业务结构——它告诉你页面的功能构成和数据流向。组件树替代 DOM 树意味着前端开发的抽象层次从"操作 DOM 节点"升级为"组合业务组件"。这是页面复杂度增长的必然结果：当页面需要同时处理实时数据、AI 推理进度、多设备适配时，"最小开发单元"必须是组件而非 DOM 节点，否则团队无法并行协作。

### 6.4 什么时候应该抽组件？

**问题本质**：考察对组件拆分原则的理解。

**回答框架**：

> 不是因为"代码太长"——长只是信号，不是原因。抽组件的核心判断是**职责独立性**和**变化频率**：如果某段 UI 有独立的职责、独立的状态、独立的变化节奏，就应该抽。具体信号包括：1）它可能在别处复用；2）它的样式/逻辑/数据结构变化时，不应影响父组件；3）它可以被独立测试；4）不同的人可以并行开发它和父组件。反之，如果抽出去的组件离开特定上下文就没有意义，强耦合地拆开只会增加追踪成本。

---

## 结语

第四十一天下午的 WebGPU 学习，表面上是给 Demo 补了进度条和加载按钮，但真正被"学"到的东西分布在前端工程的三个层面上：

```text
事件层：从 DOM 0 到 DOM 2 到 React 合成事件
        → 理解框架 API 背后的历史决策和设计取舍

组件层：Progress 的抽取、props 的设计、map 和条件渲染
        → 掌握"什么时候拆组件"的判断力而非蛮力

架构层：组件树代替 DOM 树
        → 完成从"操作 DOM"到"设计组件系统"的范式升级
```

v044 告诉我们"浏览器可以跑 AI"。本篇告诉我们"写这个 AI Demo 的过程中，React 在帮你做什么"。下一篇会继续沿着这个 Demo 深入，进入模型加载的实际流程。

```text
v044：浏览器端侧AI是什么、为什么、整体架构
v046（本篇）：React 合成事件、组件树、前端工程化思维 ← 你在读这篇
v04?（下一阶段）：模型加载流程、WebGPU 推理实际执行
```
