# SDD 规范驱动开发：文档即代码，两次创造与 proposal/design/task 三份规范

Vibe Coding（氛围编程）很上头：打开 AI Coding Agent 的交互面板，不停地给 AI 下任务——"帮我做一个用户认证系统"，AI 疯狂生成代码，第一天效率翻倍，第二周开始返工（AI 在猜），第一个月陷入自我怀疑。第六十二天的笔记指出：**问题不在 AI 能力，而在我们给大模型的上下文不够**。解法是一种新的 AI 协作范式——**SDD（Spec-Driven Development，规范驱动开发）**：先撰写文档、设计好项目，再让 AI 按规范写代码。这篇文章把这套范式拆开讲清楚，并用一个 Chrome 翻译插件的真实项目展示它怎么落地——文档先行之后，任务第一步（T1 工程脚手架）是如何在规范约束下完成的。

---

## 一、Vibe Coding 为什么返工：不是 AI 不行，是上下文不够

Vibe Coding 的典型体验是"上头"：Claude Code、Codex、Cursor、Trae、Copilot 这些工具，每一个都声称十倍效率提升。第一天确实快，但节奏是这样的：

- **第一周**：效率爆棚，不断下任务，AI 疯狂生成；
- **第二周**：开始返工——AI 在猜需求；
- **第一个月**：陷入自我怀疑。

为什么？笔记给了一句很关键的话：**AI 能力超强，是我们给大模型的上下文不够。**

具体到"帮我做一个用户认证系统"这句话，缺的是什么？是框架（mockjs？NestJS？Python？Java？）、是接口长什么样、是登录成功后跳哪。Vibe 模式直接开干，看上去跑得起来，后面一堆麻烦。更深一层：

- 上下文缺失、会话历史丢了（没有持久化），AI 只能**猜**，一旦开始猜就会出现**幻觉**；
- 每一轮失败都在消耗两样东西：**时间**（等 AI 生成）和**词源**（token 消耗）。

一句话总结 Vibe Coding 的病灶：**跳过了"第一次创造"，直接进入第二次创造。** 而 SDD 坚持：所有事物都要经过两次创造。

---

## 二、两次创造：文档是第一次，代码是第二次

这个概念来自《高效能人士的七个习惯》里的"以终为始"（Begin with the end in mind）。优秀老板做一件事，要经历两次创造，而不是一次：

1. **第一次创造——心智创造**：停下来，先写规范、设计好项目。在大脑里设计一遍，动手之前脑子里已经"有个样子"，然后用文档把样子落地，变成 Coding Agent 的上下文；
2. **第二次创造——物理创造**：根据规范，真正驱动 AI 写代码。

套用建造业和商业的常识就很好懂：**不画蓝图就不盖房，不写商业计划就不创业。** 编程也一样——在让 AI 动手之前，先回答清楚四个问题：

> **做什么？为什么做？怎么做？如何一步步做？**

Vibe Coding 的问题，恰恰是聊天窗口的诱惑让它跳过第一次创造、直接进入第二次。SDD 把第一次创造（写文档）变成了**主要工作内容**，代码生成反而越来越轻——因为**当代码生成成本越来越低，真正稀缺的是清晰、可执行、可验证的意图**，而这正是文档要设计的东西。

---

## 三、SDD 三份文档：proposal / design / task

SDD 的文档"按需加载"，核心是三份，每一份对应一个要回答的问题：

| 文档 | 回答的问题 | 定位 |
| --- | --- | --- |
| `proposal.md` | 做什么、为什么做 | 需求文档：头脑中这个系统应该是什么样、满足什么需求 |
| `design.md` | 怎么做 | 技术架构设计：怎么实现、用什么技术 |
| `task.md` | 先做什么、再做什么、什么可以并行 | 任务拆分：执行的顺序与依赖 |

它们各自承载"第一次创造"的一部分：`proposal` 定"要什么"，`design` 定"怎么实现"，`task` 定"按什么顺序做"。三份规范合起来完成第一次创造（工作内容），代码是第二次创造（由 agent 完成）。而且这个过程不是一次性的——**不停地迭代**：每实现一段，都能回头用文档校验"这是不是我要的"。

> 补充：SDD 也有配套框架（Spec-kit）。核心主张一致——代码生成越便宜，意图的设计就越值钱。

---

## 四、项目准备：git 版本控制与 AI 会话管理

把 SDD 落到一个真实项目上。这一天的实践是做一个 **Chrome 英文网页 AI 翻译插件**：浏览英文网页时，一键提取文章核心内容，调用 AI 模型翻译，把结果以 Markdown 格式呈现并支持一键复制。

动手写需求前，笔记先给了两件事——它们是 AI 协作工程的"地基"：

**1. 创建项目和 git 仓库，做即时版本控制。** AI 生成的可验收代码，必须能追溯、能回退。当 AI 出现幻觉时，根据代码所处的状态有三种回退方式：

```bash
# ① 修改还没进暂存区：直接丢弃
git restore .

# ② 到了暂存区但还没提交：先移出暂存区，再丢弃
git restore --staged .
git restore .

# ③ 已经提交了：回退到上一个提交
git reset --hard HEAD^
```

**2. 管理 AI 会话。** 开启新的会话，就是开启新的上下文。不要在一个充满历史包袱的会话里一直往下做——上下文一长、会话一丢，AI 又开始猜。

---

## 五、需求分析：proposal.md 只写文档，不写代码

需求分析是 SDD 的第一步，笔记给出的流程是：

1. **清晰定义我们要做什么**；
2. **分析和调研**：用 skill、或和 Claude Code 多聊几次，把难点和方案聊清楚；
3. **花时间编写并验证需求**。

几个写 `proposal.md` 时的要点：

- 先明确"是什么"——**MVP（最小可行性单元）**，而不是一上来想完整产品；
- 给出**详细的举例和返回格式**，让"要什么"可验证；
- **只生成文档，其他的不要做**——这一步的任务就是文档，别顺手开始写代码；
- 明确**不做什么**：比如这个插件不是新造一套翻译系统，而是复用现有能力；
- 文档的好处是**可记录、可共享**——Vibe Coding 一关窗口可能就没了，文档不会。

回到实践项目，`proposal.md` 把核心功能定得很窄、很清晰：面向英文网页内容，一键提取当前页面的**主要文章内容**（排除导航、广告、评论），整理成 Markdown，调用 AI 翻译成中文，以打字机效果逐步展示，并只在本地保存**最近一次**结果。范围限制也写得很明确：不做历史记录、不做账号体系、不做云端同步、不做多语言切换。

---

## 六、技术架构设计：design.md 定成败

技术架构设计**直接关系到项目成败，尤其是技术选项**——一个正确的选项，能让后续开发事半功倍；反之，陷入泥潭。笔记反复强调：这是架构师的认知，拿不准就去查、去搜、去问 skill。

这个项目有两个关键技术难点：

**难点一：网页主要内容提取。** "一键提取文章核心内容"难在——如何从一堆导航、广告、评论区里认出正文？笔记的做法是上网搜 + 和 Claude Code 聊，最终在 `design.md` 里选定了经过生产验证的组合：

- **Mozilla Readability**（Firefox 阅读模式的底层引擎）负责正文提取，自动识别标题、作者、正文，剔除广告和侧边栏；
- **Turndown + turndown-plugin-gfm** 负责把正文 HTML 转成 Markdown，图片转成 `![alt](src)`、相对路径转绝对路径、保留标题层级/列表/引用/代码块/表格。

**难点二：AI 翻译模型怎么接。** 这里强调了一个关键原则——**OpenAI 兼容方式**：

> 翻译层基于 OpenAI 兼容接口抽象，模型、基地址、API Key 都从本地设置读取。默认接入通义千问 Qwen（DashScope 兼容地址 `https://dashscope.aliyuncs.com/compatible-mode/v1`），切换模型只需改配置，不修改业务代码。

**渲染层**也复用现成组件：用 `md-wx`（专为微信公众号优化的 Markdown 渲染组件）渲染翻译结果，不自研渲染器。

架构上，插件按运行环境分成三层，职责单向：

| 层 | 运行位置 | 职责 |
| --- | --- | --- |
| 内容脚本层 Content Script | 目标网页 | 读页面 DOM，提取文章并转 Markdown |
| 后台层 Background | 扩展进程 | 持有 AI 客户端配置，发起流式翻译并转发增量 |
| 界面层 Panel | React 应用 | 交互、状态机、打字机效果、结果渲染与本地持久化 |

三层之间通过 Chrome 消息机制通信，共享的类型与存储封装放在 `shared` 层。权限最小化：只申请 `activeTab`、`scripting`、`storage` 与翻译服务域名权限；API Key 只存本地、不写日志。

---

## 七、任务拆分与 T1 脚手架：task.md 驱动 AI 分步实现

文档规划完之后，`task.md` 把整个项目拆成 9 个任务，按优先级分成四层：P0 基础 → P1 核心链路 → P2 持久化 → P3 辅助功能 → P4 收尾。

```text
P0  T1 工程脚手架 ───► T2 主界面骨架
P1  T3 内容提取 ──► T4 翻译链路 ──► T5 打字机与md-wx渲染
P2                          └─────► T6 最近结果持久化
P3                                  ├──► T7 下载/打开原文
P3   T8 设置页（可并行）
P4  T9 错误处理与收尾
```

每个任务都独立可完成、有可见效果、有独立验证方式——这保证了每步推进都能人工验收，而不是攒到最后一起翻车。

**任务第一步 T1（工程脚手架与最小可运行扩展）** 已经完成，它把 SDD 的"代码是第二次创造"落到最小形态：Vite + React + TypeScript 工程，集成 `@crxjs/vite-plugin`，配置 Manifest V3 多入口。看关键文件：

`vite.config.ts` 用 `@crxjs/vite-plugin` 的 `crx({ manifest })` 把 Vite 和扩展清单接起来：

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';

import manifest from './src/config/manifest.config.ts';

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  resolve: { alias: { '@': '/src' } },
  build: { outDir: 'dist' },
});
```

Manifest V3 配置集中在 `src/config/manifest.config.ts`，popup / options / content / background 多入口一次声明，权限最小化：

```ts
import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: '网页翻译助手',
  action: { default_popup: 'src/panel/index.html' },
  background: { service_worker: 'src/background/index.ts', type: 'module' },
  content_scripts: [
    { matches: ['<all_urls>'], js: ['src/content/index.ts'], run_at: 'document_idle' },
  ],
  options_ui: { page: 'src/panel/options.html', open_in_tab: true },
  permissions: ['activeTab', 'scripting', 'storage'],
  host_permissions: ['https://dashscope.aliyuncs.com/*'],
});
```

popup 最小内容就是顶部栏 + 空状态占位（`src/panel/App.tsx`）：

```tsx
const App: React.FC = () => {
  return (
    <div className="popup">
      <header className="popup__header">
        <span className="popup__title">网页翻译助手</span>
      </header>
      <main className="popup__body">
        <p className="popup__empty">尚未开始翻译</p>
      </main>
    </div>
  );
};
```

T1 的完成标准很简单可验收：`npm run build` 无错误，`chrome://extensions` 加载 `dist` 后点击图标弹出占位主界面。**在 SDD 的流程里，这一步的意义不只是"搭了个壳"**——它验证了规范（docs/ 三份文档 + 布局规划）能正确驱动 agent 产出可运行的代码，也把后续 T2–T9 依赖的目录骨架和构建链路全部打好了。

---

## 面试问答

**问：SDD（规范驱动开发）是什么？和 Vibe Coding 有什么区别？**

> SDD（Spec-Driven Development）是一种新的 AI 协作范式：先写文档（proposal / design / task）完成"第一次创造"，再让 AI 按规范写代码完成"第二次创造"。Vibe Coding 跳过了文档这一步，直接让 AI 生成代码，导致上下文缺失、AI 靠猜、出现幻觉、反复返工。SDD 坚持所有事物都要经过两次创造，文档先行是主要工作内容。

**问：Vibe Coding 返工的根因是什么？**

> 不是 AI 能力不行，而是给大模型的上下文不够：会话历史丢失、需求没说清楚，AI 只能猜，猜就产生幻觉。每一轮失败都在消耗时间（等生成）和词源（token）。所以要先写文档，把"做什么、为什么、怎么做、如何一步步做"落成可执行可验证的意图。

**问：proposal / design / task 三份文档分别回答什么问题？**

> proposal.md 回答"做什么、为什么做"（需求）；design.md 回答"怎么做"（技术架构与技术选型）；task.md 回答"先做什么、再做什么、什么可以并行"（任务拆分与依赖）。三份规范按需加载，合起来完成第一次创造，代码是第二次创造，且随迭代不断更新。

**问：AI 协作项目为什么先建 git 仓库？AI 出现幻觉怎么回退？**

> 因为 AI 生成的可验收代码必须能追溯、能回退。按状态分三种：未进暂存区直接 `git restore .`；已暂存先 `git restore --staged .` 再 `git restore .`；已提交用 `git reset --hard HEAD^` 回退到上一提交。

**问：技术架构设计为什么重要？这个插件怎么做的选型？**

> 技术选项直接决定项目成败：选对了事半功倍，选错了陷入泥潭。本插件两个难点：网页正文提取选 Mozilla Readability + Turndown（生产验证过的组合）；AI 翻译走 OpenAI 兼容接口、默认接 Qwen，模型/密钥/基地址全部配置化，切换模型不改业务代码。

**问：task.md 的任务拆分有什么讲究？T1 做了什么？**

> 任务按 P0-P4 分层、每个任务独立可完成、有可见效果、可独立验证，并明确依赖（主链路串行、设置页可并行）。T1 是工程脚手架：Vite+React+TS 集成 @crxjs，配置 Manifest V3 的 popup/options/content/background 多入口与最小权限，popup 顶部栏 + 空状态占位，可构建、可加载、可验收。

---

## 结语：把"写代码"变成"按规范执行"

第六十二天这套 SDD 流程，本质是把 AI 协作的注意力从"疯狂生成"转移到"先想清楚"：

```text
proposal.md   做什么、为什么（MVP，含不做什么）
design.md     怎么做（技术选型、架构分层、权限与隐私）
task.md       先做什么、再做什么、什么可并行（T1-T9）
───────────────────────────── 第一次创造（心智创造）
      ↓ 规范驱动
代码           agent 按 task 一步步实现（第二次创造）
```

动手前，拿这份清单自检：

- [ ] 能否说清 Vibe Coding 返工的根因是"上下文不够"而不是"AI 不行"？
- [ ] 能否讲出"两次创造"：文档是心智创造、代码是物理创造？
- [ ] 能否区分 proposal / design / task 三份文档各自回答什么问题？
- [ ] 能否说出 AI 幻觉时三种 git 回退方式？
- [ ] 能否解释"技术选型决定项目成败"并用本插件举例？
- [ ] 能否理解 task.md 的拆分原则（分层、独立可完成、可见效果、独立验证）？
- [ ] 能否讲出 T1 脚手架如何用 @crxjs 把 Vite 和 Manifest V3 接起来？

掌握了 SDD，你就把"让 AI 写代码"从碰运气的聊天，变成了一条**文档可追溯、任务可拆分、每一步都可验收**的工程流水线。
