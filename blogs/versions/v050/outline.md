# v050 大纲

## 标题
React useState 深入：异步更新、批处理合并与懒初始化性能

## 主题
第四十三天学习提交 `ae887ce`（useState深入与性能）里的 `fe/React/basic` 笔记与 `state-demo`。在已经会用 `useState` 声明状态的前提下，讲清三件面试与实战都会踩的坑：① setState 的异步调度与闭包旧值 ② 同事件内多次更新的批处理合并与函数式更新 ③ 初始值传函数实现懒初始化，避免重渲染重复跑重计算。附带 React Fragment 与 DocumentFragment 的对照。

## 与相邻版本的边界
- **v046**：合成事件与组件树——本篇不重讲事件模型。
- **v048**：props / state 分工、受控输入、组件健壮性——本篇不重讲数据所有权，只深入 **state 如何更新**。
- **v049**：Vibe Coding 工程方法 + 待办 Demo——本篇不写 AI 协作方法论；待办里出现的函数式 `setTasks` 在本篇从机制上解释。
- **v050（本篇）**：useState 的更新语义与性能写法。

## 核心线索
setCount 后 console 仍是旧值 → 批处理导致 +1 三次只加 1 → 函数式更新拿到最新值 → 懒初始化避免 heavyComputation 每渲染都跑 → Fragment 批量挂载对照。

## 章节结构
1. 引言 — 会声明 state 还不够
2. 一、useState 最小模型
3. 二、为什么 setCount 后立刻 console 还是旧值
4. 三、批处理：三次 count+1 为什么只加 1
5. 四、函数式更新：如何真正连续 +3
6. 五、懒初始化：初始值写成函数
7. 六、Fragment：React 与 DOM 的「批量挂载」对照
8. 七、实践清单
9. 八、面试题
10. 结语

## 核心来源
- `fe/React/basic/readme.md`
- `fe/React/basic/state-demo/src/App2.jsx`（计数与函数式更新）
- `fe/React/basic/state-demo/src/App.jsx`（用户列表与懒初始化）
- `fe/React/basic/state-demo/test.html`（DocumentFragment）

## 面试要点
- setState 为什么是异步的 / 调度更新
- 为什么同一次事件里多次 setState(count+1) 只会生效一次
- 函数式更新解决什么问题
- useState(fn) 与 useState(fn()) 的区别
- Fragment 的作用与 DocumentFragment 的类比
