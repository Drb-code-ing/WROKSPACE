# v073 博客大纲

**标题**：SDD 规范驱动开发：文档即代码，两次创造与 proposal/design/task 三份规范
**日期**：2026-08-20
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源 |
| --- | --- | --- |
| 引言 | 开门见山：Vibe Coding 上头但返工，根因是上下文不够；SDD 让"文档先行"成为主要工作 | ai/sdd/readme.md |
| 一、Vibe Coding 为什么返工 | 第一天快、第二周返工（AI 猜）、第一个月自我怀疑；上下文缺失、会话历史丢失、幻觉、时间与词源消耗 | ai/sdd/readme.md |
| 二、两次创造：文档是第一次，代码是第二次 | 以终为始；心智创造（文档）→ 物理创造（代码）；不画蓝图不盖房 | ai/sdd/readme.md |
| 三、SDD 三份文档：proposal / design / task | 按需加载；需求（做什么/为什么）、设计（怎么做）、任务（先后顺序/并行）；代码是第二次创造 | ai/sdd/readme.md |
| 四、项目准备：git 版本控制与会话管理 | 建仓库即时版本控制；三种回退（restore / staged / reset）；新会话新上下文 | ai/sdd/action/readme.md |
| 五、需求分析：proposal.md 只写文档不写代码 | 第一步定义做什么；MVP；调研（skill/聊）；只生成文档；不做什么；可记录可共享 | ai/sdd/action/readme.md + docs/proposal.md |
| 六、技术架构设计：design.md 定成败 | 技术选型决定成败；难点（网页提取）上网搜；OpenAI 兼容切 Qwen；md-wx 渲染 | ai/sdd/action/readme.md + docs/design.md |
| 七、任务拆分与 T1 脚手架 | task.md P0-P4 / T1-T9 拆分；T1：Vite+React+TS + @crxjs，Manifest V3 多入口，popup 骨架 | docs/tasks.md + src/config/manifest.config.ts + src/panel/App.tsx + vite.config.ts |
| 面试问答 | SDD 是什么、为什么文档先行、两次创造、三份文档区别、git 回退、技术选型、T1 做什么 | 综合 |
| 结语 | 检查清单 | 综合 |

## 核心结论

- **Vibe Coding 返工根因不是 AI 弱，而是上下文不够**：会话历史丢失 → AI 猜 → 幻觉，每一轮失败都在消耗时间和词源；
- **两次创造**：第一次是心智创造（用文档把"系统应该什么样"落地成 Coding Agent 上下文），第二次是物理创造（根据规范驱动 AI 写代码）——不画蓝图就不盖房；
- **SDD 三份文档**：`proposal.md`（做什么/为什么）、`design.md`（怎么实现/技术架构）、`task.md`（先做什么/再做什么/什么可并行），按需加载；三份规范完成第一次创造，代码是第二次创造（agent）；
- **项目准备**：先建 git 仓库做即时版本控制，AI 幻觉时三种回退（未暂存 `git restore .`；已暂存 `--staged`；已提交 `git reset --hard HEAD^`）；开新会话换新上下文；
- **需求分析第一步**：清晰定义做什么 → 调研（和 claude code、skill 聊）→ 花时间编写验证；MVP、详细举例、只生成文档不做别的；
- **技术架构定成败**：正确选型事半功倍、错误选型陷入泥潭；本插件提取用 Readability+Turndown、翻译走 OpenAI 兼容（可切 Qwen）、渲染用 md-wx；
- **任务拆分**：task.md 按 P0-P4 拆 T1-T9，每个任务独立可完成、有可见效果、可独立验证；T1 已落地：Vite+React+TS + @crxjs 集成 Manifest V3 多入口，popup 顶部栏 + 空状态占位。

## 引用说明

- 主要基于第六十二天提交 `f7e5826`（"第六十二天 ssd规范驱动编程 初步"，含 `ai/sdd/readme.md` 与 `ai/sdd/action/readme.md` 初版）+ `b71dd39`（"第六十二天 ssd规范驱动编程 补充"，`ai/sdd/action/readme.md` 终稿）：
  - `ai/sdd/readme.md`（SDD 理念：Vibe Coding 问题、两次创造、三份文档）——`f7e5826`；
  - `ai/sdd/action/readme.md`（实践步骤：项目准备、会话管理、需求分析、技术架构）——`b71dd39`；
- 实践项目 `E:/chrome-extension-en-transiation`（本次 SDD 落地，独立 git 仓库）：
  - `docs/proposal.md`（需求文档）——`931da61`；
  - `docs/design.md`（技术架构设计）——`931da61`；
  - `docs/tasks.md`（任务拆分文档）——`931da61`；
  - `src/config/manifest.config.ts`（Manifest V3 多入口配置）——`608120a`；
  - `src/panel/App.tsx`（popup 最小骨架：顶部栏 + 空状态）——`608120a`；
  - `vite.config.ts`（@crxjs 插件集成）——`608120a`。
- 未登记 package.json / package-lock.json / tsconfig.json / 图标 / 各占位入口（background/index.ts、content/index.ts 等仅 `export {}` 无讲解价值）、layout 规划文件。
