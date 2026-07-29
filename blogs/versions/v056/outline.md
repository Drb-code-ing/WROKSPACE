# v056 博客大纲

**标题**：UI = fn(props)：一个 React 组件改了 3 版，我才真正理解"单向数据流"
**日期**：2026-07-29
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源笔记 |
|------|------|---------|
| 引言 | React + TypeScript 是"天作之合"，同一个组件改了三版才悟出单向数据流的本质 | fe/React/ts-demo/readme.md |
| 一、React + TypeScript：天作之合 | React.FC 泛型、Props 接口约束、type vs interface、为什么 React 本身就是用 TS 写的 | fe/React/ts-demo/readme.md |
| 二、第一版：Event 对象的"泄漏" | 子组件直接把 onChange 事件传给父组件，导致父组件需处理 React.ChangeEvent | App2.tsx (注释部分) |
| 三、第二版：子组件的"小算盘" | 子组件内部维护 editingName 私有状态，只把最终值提交给父组件 | NameEditComponent2.tsx |
| 四、第三版：UI = fn(props) | 状态全部提升到父组件，子组件变成纯展示组件——无状态、单职责、可测试 | APP.tsx + NameEditComponent.tsx |
| 五、useEffect：组件的"第二人生" | 副作用 Hook、生命周期、挂载后请求数据、依赖项控制 | fe/React/ts-demo/readme.md |
| 六、TypeScript 的类型武器库 | FC<P>泛型、interface vs type、React.ChangeEvent<>、合成事件 | fe/React/ts-demo/readme.md |
| 结语 | 单向数据流不是教条，是最优解；UI = fn(props) 是组件设计的终极公式 | 综合 |
