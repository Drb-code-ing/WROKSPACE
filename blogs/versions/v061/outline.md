# v061 博客大纲

**标题**：React 的数据主权与渲染防线：从受控与非受控组件的输入之争，到 useCallback 的性能优化  
**日期**：2026-08-09  
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源 |
| --- | --- | --- |
| 引言 | 数据归谁管（受控/非受控）与什么时候该重渲染（memo/useCallback） | 综合 |
| 一、受控组件 | value + onChange + setState 单向数据流、状态是唯一数据源 | ControlledInput.jsx |
| 二、非受控组件 | useRef + ref.current.value、值存在 DOM | UncontrolledInput.jsx |
| 三、CommentBox | textarea 用 ref 读值、提交时再取、空评论 return | CommentBox.jsx |
| 四、RegisterForm | form 状态对象 + name 属性 + 通用 handleChange（计算属性名） | RegisterForm.jsx |
| 五、LoginForm | validate + error 状态 + isVaild + disabled 提交按钮 | LoginForm.jsx |
| 六、受控 vs 非受控 | 对比表 + 选型建议 | 综合 |
| 七、性能问题 | 父组件重渲染 → 子组件跟着重渲染 → 浪费 | useCallback/readme.md |
| 八、memo | memo 高阶函数、RegularChild vs MemoChild、props 没变跳过渲染 | callback-demo/src/App.jsx |
| 九、useCallback/useMemo | 函数每次渲染都是新引用、缓存函数与结果 | useCallback/readme.md |
| 十、面试问答 | 受控/非受控、校验、memo、useCallback、useMemo | 综合 |
| 结语 | 数据主权 + 渲染防线 + 检查清单 | 综合 |

## 核心结论

- 受控组件：值存在 React 状态，value + onChange 单向数据流，状态是唯一数据源；
- 非受控组件：值存在 DOM，useRef 读取 ref.current.value，提交时再取；
- 受控表单标准姿势：form 状态对象 + name 属性 + 一个通用 handleChange（计算属性名）；
- 受控 + 校验：validate 写错误消息、isVaild 汇总条件、提交按钮 disabled={!isVaild}；
- memo：高阶函数，props 没变时跳过子组件重渲染，避免"无辜陪跑"；
- 函数每次渲染都是新引用，memo 挡不住 → useCallback 缓存函数引用；
- useMemo 缓存计算结果，三者是性能优化组合拳。

## 引用说明

- 受控/非受控组件部分基于第五十三天提交 `dbc8557`（controlled/readme.md 与 uncontrolled-demo 项目）；
- useCallback/useMemo 部分基于第五十三天提交 `dbc8557`（useCallback/readme.md 与 callback-demo/src/App.jsx）。
