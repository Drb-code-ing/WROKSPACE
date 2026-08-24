# v075 博客大纲

**标题**：微信公众号 Markdown 渲染组件：需求文档的验收清单、juice 内联样式的复制链路，与渐进式任务拆分
**日期**：2026-08-24
**目标平台**：稀土掘金（juejin.cn）
**学习笔记**：第六十四天（E:\wx-md，微信公众号 Markdown 渲染组件 md-wx 的 SDD 全流程）

## 结构

| 章节 | 内容 | 来源 |
| --- | --- | --- |
| 引言 | 开门见山：公众号编辑器只认内联 style，难点不在渲染而在复制时把 CSS 内联化；一个 NPM 组件项目走完需求→架构→原型→任务拆分 | E:\wx-md 综合 |
| 一、需求文档 | proposal 定位（通用 Markdown 预览 NPM 包）、产品目标 4 条、成功标准 5 条、内容/样式边界与"本期不包含"8 条——"不做什么"最值钱 | docs/proposal.md |
| 二、双层用户 | 组件使用方（开发者）vs 终端用户（内容创作者）；典型使用流程 5 步；第 4.8 节设置能力导出与自定义排版规则 | docs/proposal.md 3.1-3.3、4.8 |
| 三、技术选型 | 选型表：React 18+ / Vite / CSS Modules+PostCSS / react-markdown+remark-gfm / react-syntax-highlighter / juice；react-markdown 的安全考量；目录结构与编码规范 | docs/design.md 1-3 |
| 四、核心难点 | 公众号只认内联 style；juice 复制链路 6 步（handleCopy → innerHTML → 主题 CSS → juice → 高亮 span → clipboard）；`.title{color:blue}` → `<h1 style>` 原理；验收基准"不结构错乱、不需重排版" | docs/design.md 4、proposal.md 4.5 |
| 五、玻璃拟态原型 | 高保真交互原型的作用；ui-design.html：玻璃拟态设计语言、固定工具栏、5 主题色板、手机/桌面设备框动画、完整交互反馈与可访问性 | docs/ui-design.html、README.md |
| 六、任务拆分 | tasks.md 拆分原则 4 条；阶段一基础架构（1.1 初始化 / 1.2 基础样式）、阶段二核心预览（2.1 渲染引擎 / 2.2 预览容器）、阶段三主题系统（3.1 useTheme / 3.2 设置面板）；每任务含 checkbox + 验收标准 | docs/tasks.md |
| 七、AI 辅助需求 | 需求怎么做（头脑风暴 Skill、原型工具+MCP）；tavily 实时调研缓解幻觉；任务拆分像带新员工（上下文限制、细节能力）；项目规则 4 条约束 AI | README.md |
| 面试问答 | 公众号为何只认内联 style + juice 解法；react-markdown vs dangerouslySetInnerHTML；为何写"本期不包含"；设置能力导出解决什么；双层用户设计；任务拆分原则；tavily 作用 | 综合 |
| 结语 | 要什么→怎么做→长什么样→按什么顺序 的完整链路 + 检查清单 | 综合 |

## 核心结论

- **需求文档的价值在边界**：proposal 用"成功标准"把目标变可验证，用"内容与样式边界"+"本期不包含"8 条把范围锁死——不做编辑器、不做图片上传、不做账号、不做直接发布，避免顺着"markdown 组件"无限膨胀；
- **通用组件是双层用户设计**：组件使用方（集成者）要传 Markdown、控制设置区、自定义布局；终端用户要实时预览、切主题、切设备、复制到公众号。能力内聚、UI 外放；
- **公众号兼容 = 内联样式**：公众号编辑器只认内联 `style`。`juice` 把 HTML + 主题 CSS 解析匹配，`.title{color:blue}` → `<h1 style="color:blue">`，主题颜色/字体/边距/代码高亮全内联化，实现所见即所得复制；
- **react-markdown 安全**：解析成 React 组件树而非拼 HTML 字符串，天然规避 XSS，适合接收任意外部 Markdown 的通用组件；
- **高保真原型让"第一次创造"可见**：ui-design.html 用玻璃拟态实现固定工具栏、5 主题下拉、手机/桌面设备框动画、完整交互反馈，文档+画面构成对产品界面的完整共识；
- **任务拆分 = 渐进式 + 可验收**：每阶段有"预期效果"、每任务有 checkbox 清单和"验收标准"，让 AI 一次只做一件可验收的事；
- **AI 辅助需求的三件套**：头脑风暴 Skill 吃维度、tavily 实时搜索缓解幻觉、四条项目规则（边界/风格/技术栈/沟通）约束 AI 行为。

## 引用说明

- 基于第六十四天学习笔记（E:\wx-md，非 git 仓库，hash 记 `auto`）：
  - `E:/wx-md/README.md`（需求文档方法论 / AI 原型 / tavily / 任务拆分与项目规则）——`auto`；
  - `E:/wx-md/docs/proposal.md`（需求文档：定位/目标/成功标准/双层用户/功能规则/验收/边界）——`auto`；
  - `E:/wx-md/docs/design.md`（技术架构：选型/目录/编码规范/公众号内联样式复制链路）——`auto`；
  - `E:/wx-md/docs/design_guide.md`（设计指南：可访问性/性能/组件架构建议/维护扩展）——`auto`；
  - `E:/wx-md/docs/tasks.md`（任务拆分：阶段一基础/阶段二核心预览/阶段三主题系统）——`auto`；
  - `E:/wx-md/docs/ui-design.html`（玻璃拟态高保真交互原型）——`auto`。
- 素材说明：今日笔记为 SDD（第六十二天，v073）方法论在"微信公众号 Markdown 渲染组件"项目上的完整应用（proposal/design/tasks + 原型），未涉及 npm 依赖、构建产物等非讲解价值文件。
