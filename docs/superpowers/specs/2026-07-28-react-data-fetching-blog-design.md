# React 数据请求与列表渲染博客设计

**目标版本：** v057  
**文章标题：** 《React 数据请求的第一步：用 TypeScript 契约串起 API、Effect 与列表渲染》

## 目标

基于 React + TypeScript 成员列表练习，写一篇偏实战与面试表达的学习博客。文章解释一个列表页从数据模型定义、API 模块调用到组件渲染更新的完整链路；重点是模块边界与状态流转，而非泛化讲解 HTTP、流式 API 或 React 基础语法。

## 范围

### 纳入

- `model/` 中 `MemberEntity` 对数据形状的约束；
- `api/` 中 `Promise<MemberEntity[]>` 对异步返回值的契约；
- `MemberTable` 的 `useState<MemberEntity[]>([])`、`useEffect` 与 async IIFE；
- 初始空数组渲染、请求完成、`setState`、列表重新渲染的时间顺序；
- `key` 与稳定业务 ID 的关系；
- 列表请求应补齐的 loading、error、过期请求处理边界；
- 面试常问问题与简洁回答框架。

### 排除

- 受控组件、props/state 上提等既有主题的重复展开；
- API Key、代理、跨域、流式 SSE 等网络接入主题；
- 引入 React Query、SWR 或全局状态库；
- 对现有学习项目做功能改造。

## 文章结构

1. 列表页真正的数据链路与职责划分；
2. TypeScript 数据模型：为何先定义 `MemberEntity`；
3. API 模块：为何返回 `Promise<MemberEntity[]>`；
4. 组件层：初始状态与挂载后副作用；
5. async IIFE：为何不直接把 Effect 写成 async；
6. `setState` 如何驱动二次渲染和 `map` 列表；
7. 工程化边界：loading、error、竞态、unmount；
8. 高频错误与面试表达；
9. 总结检查清单。

## 关键结论

- `model` 管数据契约，`api` 管请求实现，组件管状态与展示；
- 异步数据在组件首次渲染之后加载，不阻塞首屏提交；
- `setState` 不修改已有数组，而是触发带新状态的渲染；
- API 返回的稳定 ID 应同时承担业务定位与 React 列表 key 的职责；
- 模拟 API 与真实 HTTP 的调用方接口应尽量保持一致，使 UI 不依赖数据来源。

## 发布与验证

发布时创建 `blogs/versions/v057/blog.md`、`outline.md` 和 `coverage.json`；更新 `blogs/manifest.json` 中的来源和版本条目，并将 `blogs/CURRENT` 更新为 `v057`。发布前检查 JSON 合法性、Markdown 链接和 `git diff --check`；只提交本次博客与规格相关文件。
