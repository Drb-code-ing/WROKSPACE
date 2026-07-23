# v049 大纲

## 标题
Vibe Coding 工程初步：先规划、胶水编程与元方法论——以 React 待办清单为例

## 主题
第四十三天学习笔记 `ai/vibe/demo1/readme.md` + `todoList` 实战。把「用自然语言让 AI 写代码」从凭感觉升级为可复用的工程方法：① 规划先行（禁止先写代码）② 胶水编程（能抄不写、能连不造）③ 元方法论（让提示词与协作方式自我进化）。用 React 19 + Tailwind + @dnd-kit 待办清单做对照演示。

## 与相邻版本的边界
- **v001**：OPC / Vibe Coding 全景与一人公司叙事——本篇不重复 OPC 七角色。
- **v003**：Claude Code / Agent 落地页实战——本篇不重复 Agent 有手有脚的定义。
- **v011**：Prompt 五构建块与四规则——本篇不系统讲提示词语法。
- **v044 / v046 / v048**：React 组件树、合成事件、props/state 健壮性——本篇只借用组件拆分结果，不重讲 React 基础。
- **v047**：Workflow vs Agent——本篇不写工作流选型。
- **v049（本篇）**：Vibe Coding 的工程方法论三板斧 + 待办 Demo 证据链。

## 核心线索
幻觉/屎山问题 → 规划 prompt 五步 → 胶水编程（拖拽用 dnd-kit）→ 元方法论 → 实践清单与面试题。

## 章节结构
1. 引言 — 为什么「会用 AI 写代码」仍然写出屎山
2. 一、Vibe 新兵的两种翻车：幻觉与屎山
3. 二、第一步：规划就是一切
4. 三、第二步：胶水编程思维
5. 四、第三步：元方法论让协作自我进化
6. 五、放回 AI Native 坐标
7. 六、实践清单
8. 七、面试题
9. 结语

## 核心来源
- `ai/vibe/demo1/readme.md`
- `ai/vibe/demo1/todoList/src/App.jsx`
- `ai/vibe/demo1/todoList/src/components/TodoInput.jsx`
- `ai/vibe/demo1/todoList/src/components/TodoItem.jsx`
- `ai/vibe/demo1/todoList/src/components/TodoList.jsx`
- `ai/vibe/demo1/todoList/package.json`

## 面试要点
- 为什么不要一上来让 AI 写代码
- 什么是胶水编程 / 为什么优先成熟组件
- 规划文档如何约束多轮 prompt
- 功能边界与数据结构为何必须人工拍板
- Vibe Coding 与传统编码 / 纯 Prompt 的区别
