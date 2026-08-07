# v060 博客大纲

**标题**：React 的复用与并行：从自定义 Hooks 封装状态逻辑，到 Web Worker 的多线程计算  
**日期**：2026-08-07  
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源 |
| --- | --- | --- |
| 引言 | 复用（自定义 Hooks）与并行（Web Worker）：一个省人的时间、一个省机的时间 | 综合 |
| 一、组件通信困境 | 父子/兄弟/爷孙/陌生人关系、层层传递的搬运之苦 | context-demo/reeadme.md |
| 二、useContext 跨层级直达 | createContext → Provider → useContext 三步、ThemeContext demo | ThemeContext.jsx + App2.jsx + Page.jsx |
| 三、自定义 Hooks | use 开头、hooks 目录、封装响应式与副作用 | reeadme.md |
| 四、useMouse | 事件监听封装成响应式坐标、useEffect 清理监听 | hooks/useMouse.js + App.jsx |
| 五、useTheme | 把 useContext 再封一层、模块化抽离 | hooks/useTheme.js + components/Child.jsx |
| 六、useTodos | TypeScript 版、Todo 契约、函数式更新、能力清单 | todos-ts-hooks useTodos.ts + todo.ts |
| 七、回到单线程 | event loop 解决等待但解决不了耗 CPU、适用场景 | ref-demo/readme.md |
| 八、Web Worker 是什么 | js 单线程没变、v8 运行时 vs C++ 浏览器、不能碰 DOM、消息机制 | ref-demo/readme.md |
| 九、useRef + Worker 完整 demo | worker.js 5 亿次循环、postMessage/onmessage/terminate 全流程 | App.jsx + worker.js |
| 十、为什么用 useRef 存 worker | 每次渲染不重建、挂载初始化、卸载销毁、useState 对比 | ref-demo/readme.md 总结 |
| 十一、面试问答 | useContext、自定义 Hook、事件清理、单线程、消息机制、useRef 存 worker | 综合 |
| 结语 | 复用与并行两条主线 + 检查清单 | 综合 |

## 核心结论

- 组件层级深时 props 层层传递太麻烦，用 context 跨层级共享：`createContext` → `Provider` → `useContext`；
- 自定义 Hook 是 `use` 开头的函数，放在 hooks 目录，能把 React 的响应式、副作用封装进去复用；
- `useMouse` 封装事件监听 + 响应式坐标，卸载时必须在 `useEffect` cleanup 里移除监听；
- `useTheme` 把 `useContext(ThemeContext)` 再封一层，组件只问"主题是什么"，不问数据从哪来；
- `useTodos` 用 TS 封装整套待办逻辑（增/删/切换/清空/过滤），`useState<Todo[]>` 泛型约束 + 函数式更新；
- JS 主线程单线程，`event loop` 解决"等待"但解决不了"耗 CPU"的计算（游戏引擎、LLM、加密）；
- Web Worker 是浏览器（C++ 多进程多线程）开辟的辅助线程，JS 单线程并没有改变；
- worker 不能访问 DOM，只能通过消息机制（`postMessage` / `onmessage` / `self`）与主线程通信；
- useRef 持久存放 worker 实例：每次渲染不重建、useEffect 挂载时初始化、卸载时 `terminate()` 销毁；
- 引用一条线程不是"业务状态"，不用 useState 存 worker，避免无谓的重新渲染。

## 引用说明

- Web Worker 部分基于第五十二天提交 `a23bf7e`（ref-demo/readme.md、ref-focus-demo/src/App.jsx、worker.js）；
- 自定义 Hooks 部分基于第五十二天提交 `f7c434b`（context-demo 与 todos-ts-hooks 项目）。
