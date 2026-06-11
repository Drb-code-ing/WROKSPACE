# v023 博客大纲

**标题**：RESTful API 与面向接口编程：一个 AI Native 开发者的后端工程化初体验
**日期**：2026-06-11
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源笔记 |
|------|------|---------|
| 引言 | 回顾 v018（Bun+TS）和 v022（数据类型），引出从基础到实战——搭建第一个 RESTful API | 综合 |
| 一、OOP 三大支柱与接口 | 封装、继承、多态的核心概念，接口作为 OOP 基石 | backend/bun/todos/readme.md |
| 二、TypeScript 接口实战 | interface 定义 Todo 类型，强类型约束，面向接口编程 | backend/bun/todos/server.ts, backend/bun/todos/readme.md |
| 三、RESTful 设计思想 | 一切皆资源，URL 命名规范，HTTP 动词语义 | backend/bun/todos/readme.md |
| 四、Bun HTTP 服务器 | Bun.serve、fetch 函数、请求/响应模型、CORS | backend/bun/todos/server.ts |
| 五、路由分发实战 | URL 解析、method 判断、pathname 匹配、路径参数提取 | backend/bun/todos/server.ts |
| 六、完整 Todo API 走读 | 从接口定义到路由实现，逐行解读 | backend/bun/todos/server.ts |
| 结语 | 从类型到接口到 RESTful API，后端工程化的第一块拼图 | - |
