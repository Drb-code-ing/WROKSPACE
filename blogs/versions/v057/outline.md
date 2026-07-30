# v057 博客大纲

**标题**：React 数据请求的第一步：用 TypeScript 契约串起 API、Effect 与列表渲染  
**日期**：2026-07-30  
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源 |
| --- | --- | --- |
| 引言 | 从成员列表切入，说明数据链路比 JSX 更重要 | 综合 |
| 一、职责分层 | `model`、`api`、组件各自职责 | readme.md |
| 二、Model 契约 | `MemberEntity`、`useState<MemberEntity[]>([])` | model/member.ts |
| 三、API 契约 | `Promise<MemberEntity[]>` 与可替换数据源 | api/memberApi.ts |
| 四、Effect 请求 | 首次渲染、Effect、await、setState 的执行顺序 | MemberTable.tsx |
| 五、状态驱动列表 | `map`、重新渲染和声明式 UI | MemberTable.tsx |
| 六、稳定 key | 业务 ID 与列表节点身份 | MemberTable.tsx |
| 七、工程化边界 | loading、error、empty、竞态和过期请求 | 扩展实践 |
| 八、面试问答 | useEffect、类型契约、JSX 请求、空数组语义 | 综合 |
| 结语 | 用清晰边界构建可维护的数据请求链路 | 综合 |
