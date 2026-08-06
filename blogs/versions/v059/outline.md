# v059 博客大纲

**标题**：React 的托管边界：从鉴权路由守卫，到 useRef 的 DOM 与线程引用  
**日期**：2026-08-06  
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源 |
| --- | --- | --- |
| 引言 | React 托管了数据与页面，但边界上需要自己出手：鉴权与引用 | 综合 |
| 一、HTTP 无状态 | 为什么需要鉴权、有状态的三种方式（token/Cookie/localStorage） | fe/React/router/readme.md |
| 二、ProtectRoute 守卫 | 门禁组件、localStorage 判断、Navigate 拦截 | ProtectRoute.jsx |
| 三、props.children | 组件"填空"、Modal 弹窗定制 | readme.md + App.jsx |
| 四、登录页 | FormData 表单、useNavigate 回跳、replace 防后退 | Login/index.jsx |
| 五、Navigate vs useNavigate | 声明式 vs 命令式导航 | Login/index.jsx + ProtectRoute.jsx |
| 六、路由历史与 replace | history 栈、登录成功为什么用 replace | readme.md |
| 七、路由对象与两种选型 | navigate/location/history、hashRouter vs browserRouter | readme.md |
| 八、useRef：为什么需要引用 | DOM 编程的代价、React 的规避、useState 边界 | ref-demo/readme.md |
| 九、useRef 是什么 | 持久可变对象、current 属性、不触发渲染 | ref-demo/readme.md |
| 十、绑定 DOM：自动聚焦 | ref 属性、useEffect + focus | ref-focus-demo/src/App.jsx |
| 十一、引用一个值 | numRef + forceRender、可变但不响应 | App.jsx |
| 十二、useRef 与 worker 线程 | js 单线程、event loop、worker 独立线程 | App.jsx |
| 十三、面试问答 | 鉴权、Navigate、replace、useRef vs useState、单线程 | 综合 |
| 结语 | 声明式与命令式的边界 + 检查清单 | 综合 |

## 核心结论

- HTTP 无状态是鉴权的根源：用 token / Cookie / localStorage 补上"我是谁"的记忆；
- 鉴权路由 = 门禁组件 ProtectRoute + `localStorage` 状态 + `Navigate` 声明式拦截；
- `props.children` 让守卫/弹窗这类"外壳组件"保留定制性；
- 登录成功用 `navigate(from, { replace: true })` 回跳原页面并防止后退回登录页；
- `Navigate` 声明式（守卫），`useNavigate` 命令式（事件/副作用里调用）；
- hashRouter 改 URL 的 hash 部分实现 SPA，browserRouter 不用 hash；
- useRef 返回持久可变对象，`current` 指向任意值/DOM/线程，改变不触发渲染；
- `useState` 管数据业务状态（改变触发渲染），useRef 管 DOM 引用/可变对象（改变不渲染）；
- js 单线程 + event loop 异步无阻塞；计算密集型任务交给 worker 线程，用消息机制通信。

## 引用说明

- 鉴权路由部分基于第五十一天提交 `9c1e3a6`；
- useRef 部分基于第五十一天提交 `223aea1`；
- 「路由两种选型」来自 readme.md 当前工作区内容（尚未提交，coverage 记为 auto）。
