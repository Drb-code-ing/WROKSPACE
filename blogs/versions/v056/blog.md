# UI = fn(props)：一个 React 组件改了 3 版，我才真正理解"单向数据流"

## 引言

上一篇文章聊了**天龙八部 RAG 全链路实战**，今天我们回到前端老本行，聊点"基本功"——**React + TypeScript 的组件通信**。

为什么突然聊这个？因为我最近在学 React，写了一个看起来简单得不能再简单的组件——一个输入框，用户输入名字，点按钮更新。就这一个功能，我改了**三个版本**。

前两个版本都能跑，但当我写出第三版时，突然有种"原来如此"的感觉——**单向数据流不只是 React 的"法律条文"，它是一种让代码变简单的最优解。**

这篇文章就把这三个版本的演进过程串起来，从"能跑就行"到"写得漂亮"，顺便把 TypeScript 在其中的角色讲清楚。

---

## 一、React + TypeScript：天作之合

在进入三个版本的故事之前，先聊聊 React 和 TypeScript 的关系。

你可能知道，**React 本身就是用 TypeScript 写的**。这不是巧合——React 的组件模型天然需要类型约束：

- 父组件通过 **props** 向子组件传递数据
- 每个 prop 都有它该有的类型（string、number、function……）
- 如果类型不匹配，运行时就会出 bug

而 TypeScript 在**编译时**就能帮你把这类问题揪出来。所以 React + TypeScript 这对组合，从一开始就是"天作之合"——**一个负责组件化，一个负责类型安全**。

在 React 的类型体系里，最核心的一个东西就是 `React.FC`：

```typescript
// React 源码中
type FC<P = {}> = FunctionComponent<P>
```

这个 `FC<P>` 的 `<P>` 就是**泛型**——你传什么类型进去，它就按什么类型约束你的组件。`P = {}` 表示默认是空对象，不传也行。

---

## 二、Hello 组件：一切从打招呼开始

先看一个最简单的例子。我写了一个 `Hello` 组件，接收一个 `userName`，打个招呼：

```tsx
import * as React from 'react';

interface Props {
    userName: string;
}

const Hello: React.FC<Props> = (props) => {
    return (
        <h2>Hello {props.userName}</h2>
    );
};

export default Hello;
```

短短几行代码，TypeScript 的身影已经无处不在：

- **`interface Props`**：定义了 props 的"形状"——必须有一个 `userName`，且是 `string`
- **`React.FC<Props>`**：用泛型告诉 React "这个组件的 props 长这样"
- 父组件传 `<Hello userName="Tom" />` 时，如果写成 `userName={123}`，TS 会直接报错

注意这里还有一个小知识点：**`interface` 和 `type` 有什么区别？**

在 TypeScript 里，两者都可以用来声明类型。但按 React 社区的习惯，**组件 props 用 `interface`**——因为 interface 是专门用来描述"对象需要满足哪些属性和方法"的，而 props 恰好就是一个对象。

> 一句话总结：`type` 是"类型别名"，`interface` 是"对象契约"。props 是一种契约，所以用 interface。

---

## 三、第一版：把 Event 对象"泄漏"给父组件

Hello 组件没问题。但实际需求比打个招呼复杂——用户要能**修改名字**。

于是我开始写 `NameEditComponent`——一个带输入框和提交按钮的组件。

**第一版设计思路**：子组件只管渲染输入框，`onChange` 事件原封不动传给父组件处理。

```tsx
// ❌ 第一版：把原生 event 丢给父组件
interface Props {
    username: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const NameEditComponent: React.FC<Props> = (props) => {
    return (
        <div>
            <label>Update name:</label>
            <input
                type="text"
                value={props.username}
                onChange={props.onChange}
            />
        </div>
    );
};
```

父组件这边就得自己处理：

```tsx
// 父组件被迫处理 React.ChangeEvent
const setUsernameState = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(event.target.value);
};
```

**问题在哪？**

1. **类型污染**：`React.ChangeEvent<HTMLInputElement>` 这个类型，父组件本来不该关心。父组件的职责是"持有状态+修改状态"，不是"处理 DOM 事件"。
2. **可读性差**：父组件代码里出现了 `event.target.value`，这是实现细节——子组件用 `<input>` 还是 `<textarea>` 还是别的什么，父组件不应该知道。
3. **耦合太紧**：如果子组件从 `<input>` 改成其他控件，父组件代码也要改。

这就是所谓的 **"泄漏"**——子组件把自己的实现细节（用的是什么 HTML 元素、什么事件类型）**泄露**给了父组件。

---

## 四、第二版：子组件的"小算盘"

第二版我做了改进——**把表单逻辑封装在子组件内部**。

```tsx
// ✅ 第二版：子组件自己管理 editing 状态
interface Props {
    initialUsername: string;
    onNameUpdated: (newName: string) => void;
}

const NameEditComponent: React.FC<Props> = (props) => {
    // 子组件自己的"小算盘"——私有状态
    const [editingName, setEditingName] = React.useState(props.initialUsername);

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditingName(e.target.value);
    };

    const onNameSubmit = () => {
        props.onNameUpdated(editingName);
    };

    return (
        <>
            <label>Update name:</label>
            <input value={editingName} onChange={onChange} />
            <button onClick={onNameSubmit}>Change</button>
        </>
    );
};
```

这一版的改进非常明显：

- **`onNameUpdated` 只传 `string`**，父组件不需要碰 `React.ChangeEvent`
- **`initialUsername` 作为初始值**，子组件自己维护编辑中的状态
- **`React.ChangeEvent<HTMLInputElement>` 封装在子组件内部**，父组件完全无感

父组件的代码变得干净：

```tsx
// 父组件只需传初始值和接收最终结果
<NameEditComponent
    initialUsername={username}
    onNameUpdated={setUsername}
/>
```

这一版已经可以在工作中使用了。但还能更好——这引出了第三版。

---

## 五、第三版：UI = fn(props)

第二版有一个"隐藏问题"：**状态散落在父子组件之间**。

- 父组件有 `username`
- 子组件有 `editingName`
- 两个状态描述的是"同一个东西"的不同阶段

这带来了什么麻烦？假设你想加一个"重置"按钮，把名字恢复成初始值——你需要**同时重置父组件的 `username` 和子组件的 `editingName`**，状态同步变得复杂。

第三版的核心思想就一句话：**把编辑状态也提升到父组件**，让子组件变成一个"失忆"的纯展示组件：

```tsx
// ✅ 第三版：子组件变成纯展示组件
interface Props {
    initialName: string;
    editingName: string;
    onEditingNameUpdated: (newEditingName: string) => void;
    onNameUpdated: () => void;
    disabled: boolean;
}

const NameEditComponent: React.FC<Props> = (props) => {
    const { editingName, onEditingNameUpdated, onNameUpdated, disabled } = props;

    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onEditingNameUpdated(event.target.value);
    };

    return (
        <>
            <label>Update Name:</label>
            <input value={editingName} onChange={onChange} />
            <button disabled={disabled} onClick={onNameUpdated}>Change</button>
        </>
    );
};
```

父组件持有全部状态：

```tsx
const App: React.FC = () => {
    const [name, setName] = React.useState<string>('defaultUserName');
    const [editingName, setEditingName] = React.useState('defaultUserName');

    const setUsernameState = () => {
        setName(editingName);
    };

    return (
        <>
            名字：{name}
            <Hello userName={editingName} />
            <NameEditComponent
                initialName={name}
                editingName={editingName}
                onNameUpdated={setUsernameState}
                onEditingNameUpdated={setEditingName}
                disabled={editingName === '' || editingName === name}
            />
        </>
    );
};
```

**第三版的优势：**

| 维度 | 第二版 | 第三版 |
|------|--------|--------|
| 状态位置 | 散落在父子组件 | 集中在父组件 |
| 子组件职责 | 展示 + 维护私有状态 | 只展示 |
| 可测试性 | 需要 mock 状态 | 纯 props in, JSX out |
| 额外逻辑（如 disabled） | 子组件需额外处理 | 父组件统一计算 |

这时候再看这个公式就豁然开朗了：

> **UI = fn(props)**

这是 React 组件设计的**终极公式**——给定相同的 props，组件渲染出相同的 UI。没有内部状态，没有副作用，输入决定输出，简单、可预测、好测试。

**注意**：这并不意味着子组件永远不该有私有状态。表单输入、动画状态、下拉菜单的开合——这些"不影响全局状态"的局部 UI 状态放在子组件里完全合理。关键在于判断：**这个状态是"属于这个组件自身"的，还是"属于应用全局"的。**

---

## 六、useEffect：组件的"第二人生"

现在 App 组件里还有一个知识点——`useEffect`：

```tsx
const loadUserName = () => {
    setTimeout(() => {
        setName('name from async call');
    }, 2000);
};

React.useEffect(() => {
    loadUserName();
}, []);
```

`useEffect` 是 React 的**副作用 Hook**，它赋予了组件"第二人生"：

```
组件的一生：
  ┌─ mounted（挂载）──→ 页面出现
  │     ↓
  │  useEffect 执行 ← 这里请求数据
  │     ↓
  │  状态更新 → re-render
  │     ↓
  │  ...（用户交互）...
  │     ↓
  └─ unmounted（卸载）──→ 页面消失
```

关键的一句话：**组件的第一要务是赶快显示出来，让用户觉得快。** 所以数据先给个默认值，`useEffect` 在挂载**之后**再异步请求真实数据。

`useEffect` 的第二个参数 `[]`（空依赖数组）表示"只在挂载后执行一次"。如果填了依赖项，比如 `[name]`，则每次 `name` 变化时都会重新执行。

---

## 七、TypeScript 的类型武器库

在三个版本的迭代中，TypeScript 始终在默默发挥作用。总结一下用到的核心类型：

### React.FC<P>

```typescript
type FC<P = {}> = FunctionComponent<P>
```

泛型 `P` 是你的 Props 类型。不传就是空对象。

### React.ChangeEvent<T>

```typescript
React.ChangeEvent<HTMLInputElement>
```

这是 React 的**合成事件（SyntheticEvent）**——看起来像原生 DOM 事件，但实际上是 React 跨浏览器封装后的事件对象。泛型参数指定事件发生在哪个元素上。

### interface vs type

| | interface | type |
|------|-----------|------|
| 用途 | 描述对象形状 | 类型别名 |
| 扩展 | `extends` | `&` 交叉类型 |
| 场景 | 组件 Props | 联合类型、工具类型 |

组件 Props 推荐用 `interface`——语义更明确。

---

## 结语：单向数据流不是法律，是最优解

三版重构走下来，我有一个强烈的感受：

> **"单向数据流"不是 React 定的规矩，而是代码简单到一定程度后的自然结果。**

第一版把事情搞复杂了——因为子组件把不该暴露的东西暴露了。
第二版已经很好——但状态分散让后续扩展变得困难。
第三版回归本质——**状态在上，视图在下，数据单向流动**。

这不就是 `UI = fn(props)` 吗？

最后，回到那个经典的问题：**子组件能不能有自己的状态？**

答案是：**看情况**。如果这个状态只影响子组件自身的 UI 表现（比如一个 tooltip 的开合、一个动画的进度），放在子组件内部是好的封装。但如果这个状态是"应用数据"的一部分（比如用户输入的名字），它应该"住"在父组件，子组件只是帮它"照个镜子"。

**判断标准很简单**：问问自己，如果两个组件需要共享这个状态，你打算怎么办？如果答案是"提升到共同父组件"——那不如一开始就放在那里。

下一篇文章，我们会进入更复杂的场景——多个组件之间如何通信，Context API 如何打破 props drilling，敬请期待。

---

*📝 本文为"React + TypeScript 学习笔记"系列第六篇，代码基于实际项目 [ts-demo](https://github.com/DRB-code-ing) 编写。*
