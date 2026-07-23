# Vibe Coding 工程初步：先规划、胶水编程与元方法论——以 React 待办清单为例

## 引言

v001 把 Vibe Coding 放进了 OPC（一人公司）的大叙事里：一个人 + AI，能不能扛住过去一个小团队的活。
v003 证明了 Claude Code 这类 Agent「有手有脚」——能读文件、写文件、跑命令。
v011 系统讲了 Prompt 的构建块和规则。

但第四十三天的笔记抛出了一个更扎心、也更落地的问题：

```text
会用 AI 写代码了，为什么产物还是两类垃圾？

1. 幻觉代码：看起来像那么回事，一跑就炸
2. 屎山代码：能跑，但乱到想改都不知道从哪下手
```

这不是模型不够聪明，也不是你不会写中文 prompt。**问题出在协作方式：你把 AI 当成「自动码字机」，而不是「需要入职培训的同事」。**

本文基于提交 `9626057`（第四十三天学习 vibe工程初步）里的：

- `ai/vibe/demo1/readme.md`（方法论）
- `ai/vibe/demo1/todoList/`（React 19 + Tailwind + @dnd-kit 待办清单）

只讲一件事：

```text
Vibe Coding 如何从「感觉写得挺爽」升级成「可复用的工程方法」
```

三条主线：

```text
1. 先规划，禁止先写代码
2. 胶水编程：能抄不写，能连不造
3. 元方法论：让提示词与协作方式自我进化
```

**明确边界：不重复 v001 的 OPC 七角色，不重复 v003 的 Agent 定义，不重复 v011 的 Prompt 语法课，也不重讲 v046/v048 的 React 事件与 props/state。**

---

## 一、Vibe 新兵的两种翻车：幻觉与屎山

### 1.1 一句 prompt 直接开干

场景很常见：用 React + Tailwind 做个待办清单。

Vibe 新兵的典型指令：

```text
帮我写一个 React 待办清单页面，支持新增、删除任务
```

看起来没毛病。AI 也会很快给你一坨 JSX。然后问题开始排队：

```text
- 要不要本地存储？
- 要不要 API 远程存储？
- 要不要拖拽排序？
- 要不要优先级、截止日期、标签？
- 字段叫 text 还是 title？
- 完成状态用 completed 还是 done？
```

AI 不会停下来问你。它会**擅自替你拍板**，然后在下一轮对话里再擅自改主意。于是你得到两种结果：

| 类型 | 表象 | 根因 |
|------|------|------|
| 幻觉代码 | 接口名乱编、库 API 过时、字段前后不一致 | 没有权威数据结构与边界 |
| 屎山代码 | 单文件 800 行、功能无限膨胀、改一处炸一片 | 没有模块拆分与「能抄不写」约束 |

笔记里的判断很狠，也很准：

> 这个指南，不是教你怎么写代码——而是教你怎么**指挥 AI 写可维护的代码**。

### 1.2 把 AI 当同事，而不是当打印机

第四十三天的第一性原理：

```text
新手把 Codex / Claude Code 当工具
进阶把它们当伙伴、同事、助手
```

你不会让新员工第一天就改核心业务，却不给员工手册、不讲业务流程、不划职责边界。
对 AI 也一样：

```text
入职材料 = 技术栈说明 + 项目规划 md + 功能边界 + 数据结构
```

`/init`、CLAUDE.md、readme 规划文档——本质都是**入职培训**。没有培训，就别抱怨对方「理解力不行」。

---

## 二、第一步：规划就是一切

### 2.1 强制：只做规划，禁止输出代码

笔记给出的标准操作不是「再写细一点 prompt」，而是**阶段锁死**：

```text
遵守胶水编程思维：优先使用成熟方案，避免凭空造逻辑。
第一个阶段：只做规划，禁止输出任何代码。

1. 确认技术栈
   React 19 + Tailwind CSS + useState

2. 梳理功能边界
   - 做：新增待办、删除待办、切换完成状态
   - 不做：本地持久化、筛选、拖拽（拖拽后面单独用胶水接）

3. 拆分模块（乐高组件）
   TodoInput / TodoItem / TodoList / App

4. 定义数据流
   useState 存 tasks 数组
   结构：{ id, text, completed }

5. 输出完整规划，等待我确认无误后，再分段实现代码
```

关键不是这五条本身，而是**流程上的硬门禁**：

```text
规划 → 人审 → 更新规划 → 再编码
```

每一轮 prompt 都会自动带上这份规划，项目就有了整体约束。AI 不再「每聊一次就换一套世界观」。

### 2.2 背后逻辑：你在管的是风险，不是文采

规划阶段真正在做的是四件事：

```text
1. 划边界
   防止 AI 擅自加功能，无限膨胀成屎山

2. 强制模块拆分
   生成结果好读、好审、好改
   （AI 写的代码，人必须能 review）

3. 规定数据结构
   从根源减少字段幻觉
   text 就是 text，不能这轮叫 title 下轮叫 content

4. 把规划当长期资产
   这份 md 伴随项目完整生命周期
   不是一次性聊天记录
```

这和传统软件工程里的「先设计后实现」同构，但在 Vibe Coding 里更急迫——因为 AI 的生成速度会把「没想清楚」放大成「瞬间屎山」。

### 2.3 Demo 证据：规划落成组件树

第四十三天的 `todoList` 不是「一个 App.jsx 包打天下」，而是规划落地后的标准拆分：

```text
App.jsx          — 持有 tasks 状态与增删改/重排逻辑
TodoInput.jsx    — 受控输入，负责新增
TodoList.jsx     — 列表容器 + 拖拽 Provider
TodoItem.jsx     — 单条展示 + 完成/删除 + sortable
```

`App.jsx` 里的数据真相源非常干净：

```jsx
const [tasks, setTasks] = useState([])

function addTask(text) {
  setTasks((currentTasks) => [
    ...currentTasks,
    { id: crypto.randomUUID(), text, completed: false },
  ])
}

function toggleTask(id) {
  setTasks((currentTasks) =>
    currentTasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task,
    ),
  )
}

function deleteTask(id) {
  setTasks((currentTasks) =>
    currentTasks.filter((task) => task.id !== id),
  )
}
```

注意三点，全是规划阶段就该拍板的：

```text
1. 字段固定为 id / text / completed
2. 状态只住在 App，子组件通过 props + 回调通信
3. 更新用函数式 setState，避免闭包旧值
```

`TodoInput` 只关心「本地输入草稿」，提交后立刻清空——局部 UI state 与业务 state 分离，和 v048 讲的 props/state 分工是同一条工程线：

```jsx
function TodoInput({ onAdd }) {
  const [text, setText] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const taskText = text.trim()
    if (!taskText) return
    onAdd(taskText)
    setText('')
  }
  // ...
}
```

**规划不是文档形式主义，而是把「人必须做主的决策」提前写死。**

---

## 三、第二步：胶水编程思维

### 3.1 一句话定义

笔记里的比喻非常好记：

> 胶水本身不创造零件，只负责把现成零件连在一起。
> 你只写衔接、调用、流转的粘合代码，把各个模块连通。
> **轮子别人做好，你只做胶水；胶水不生产零件，只负责粘合零件。**

落到操作原则：

```text
能抄不写：优先 GitHub 上经典、优质、经过验证的方案
能连不造：A、B、C 组件用胶水拼起来，而不是从零自研底层
```

AI 最擅长的是「看起来完整的从零实现」——也最容易在边界 case 上幻觉。
**胶水编程故意缩小 AI 的创造面：只让它写适配层。**

### 3.2 错误示范：从零造拖拽

需求升级：给待办列表加拖拽排序。

错误指令：

```text
帮我写 React 待办清单的拖拽排序功能
```

高概率发生的事：

```text
AI 自己监听 mousedown / mousemove
自己算坐标、自己写排序
漏掉 touch、滚动容器、无障碍、取消拖拽……
代码难维护，下一轮改需求直接炸
```

笔记的判断：

> 手写拖拽排序逻辑边界 case 很多，容易出现幻觉 bug，而且难以维护。

### 3.3 正确示范：调研成熟库，只写粘合

正确流程：

```text
当前需求：给待办列表增加拖拽排序
1. 先调研 React 生态成熟拖拽库
2. 选定社区验证过的方案（本 Demo 使用 @dnd-kit/react）
3. 绝不自研底层拖拽
4. 输出顺序：
   - 安装依赖命令
   - 把现有 TodoList / TodoItem 与库衔接
   - 只写模块适配与数据流转的粘合代码
```

`package.json` 里证据很清楚——依赖面积极克制：

```json
"dependencies": {
  "@dnd-kit/react": "^0.5.0",
  "react": "^19.2.7",
  "react-dom": "^19.2.7"
}
```

`TodoList` 只做 Provider 与 dragEnd 适配：

```jsx
import { DragDropProvider } from '@dnd-kit/react'
import TodoItem from './TodoItem.jsx'

function TodoList({ tasks, onToggle, onDelete, onReorder }) {
  function handleDragEnd(event) {
    if (event.canceled) return
    const activeId = event.operation.source?.id
    const overId = event.operation.target?.id
    if (activeId && overId) {
      onReorder(activeId, overId)
    }
  }

  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      <ul className="space-y-3">
        {tasks.map((task, index) => (
          <TodoItem
            key={task.id}
            task={task}
            index={index}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </DragDropProvider>
  )
}
```

`TodoItem` 只挂 `useSortable`：

```jsx
import { useSortable } from '@dnd-kit/react/sortable'

function TodoItem({ task, index, onToggle, onDelete }) {
  const { ref, isDragging } = useSortable({ id: task.id, index })
  // 渲染 checkbox / 文本 / 删除按钮
}
```

真正的「业务胶水」在 `App.reorderTasks`：把库事件翻译成数组重排——这才是你该让 AI 写、也该重点 review 的部分：

```jsx
function reorderTasks(activeId, overId) {
  if (!overId || activeId === overId) return

  setTasks((currentTasks) => {
    const activeIndex = currentTasks.findIndex((task) => task.id === activeId)
    const overIndex = currentTasks.findIndex((task) => task.id === overId)
    if (activeIndex === -1 || overIndex === -1) return currentTasks

    const nextTasks = [...currentTasks]
    const [movedTask] = nextTasks.splice(activeIndex, 1)
    nextTasks.splice(overIndex, 0, movedTask)
    return nextTasks
  })
}
```

对照一下两种路径的风险面：

```text
从零自研拖拽
  AI 生成面：大
  幻觉面：大
  维护成本：高
  你的审核负担：整套交互状态机

胶水接入 @dnd-kit
  AI 生成面：小（适配层）
  幻觉面：低
  维护成本：低
  你的审核负担：id 映射 + 数组重排
```

**胶水编程不是偷懒，是主动缩小不可控区域。**

---

## 四、第三步：元方法论——让协作方式自我进化

### 4.1 从「一次写好 prompt」到「系统会改进 prompt」

前两步解决的是单次交付质量。第三步更上层：

```text
如何让 AI 协作方式本身越用越好？
```

笔记点到的方向：

```text
Claude Code / Codex 的记忆模块
Harness 架构
用结果反馈去优化提示词与规范
```

可以把它理解成一层「提示词的提示词」：

```text
α（阿尔法）提示词
  描述：怎么干活、遵守什么规范、输出什么格式

生成结果
  代码 / 计划 / 评审意见

评价与打分
  人审 + 自动化检查（lint、测试、类型）

Ω（欧米茄）提示词 / 规范沉淀
  把踩坑写回 CLAUDE.md、规划 md、skills、hooks
  下一轮 α 自动变强
```

名字不重要，闭环重要：

```text
规范 → 生成 → 验收 → 回写规范
```

### 4.2 和已有文章的接缝

这条线和仓库里已有认知是连续的，只是本篇只点到「为什么需要」，不展开实现：

```text
v030：Agent Loop / 反思
v031：多 Agent 协作与状态
v042：Agent Skills
v047：Workflow 骨架 vs Agent 大脑
```

第四十三天补的是 **Vibe Coding 现场的操作哲学**：
你不是在和模型「聊一次天」，你是在建设一套会进化的协作系统。

### 4.3 最小可执行的元方法论

即使还不上复杂 harness，今天就能做的三件事：

```text
1. 项目根目录维护活的规划 md
   每次大改需求先改规划，再改代码

2. 把反复出现的失败写成约束
   例如：「禁止手写拖拽，统一 @dnd-kit」
   例如：「tasks 字段固定为 id/text/completed」

3. 验收清单标准化
   lint / 手动点选路径 / 边界 case
   通过才允许进入下一功能
```

这比追求「一条万能神 prompt」现实得多。

---

## 五、放回 AI Native 开发者坐标

把本篇放进学习线里：

```text
v001  Vibe / OPC 是什么（愿景）
v003  Claude Code 能干什么（工具能力）
v011  Prompt 怎么写（语言层）
v044–v048  React / 端侧 AI / 组件健壮性（实现层）
v049（本篇）  Vibe Coding 怎么工程化（方法层）
```

三种工作方式的对比：

| 方式 | 你做什么 | 风险 | 产物特征 |
|------|----------|------|----------|
| 传统手写 | 自己设计、自己实现 | 慢，但可控 | 质量取决于个人功底 |
| 裸 Vibe | 一句话让 AI 开写 | 快，但幻觉/屎山 | 短期爽，长期债 |
| 工程化 Vibe | 规划门禁 + 胶水约束 + 规范回写 | 稍慢于裸 Vibe，远快于手写 | 可审、可演进、可协作 |

一句话定位：

> **Vibe Coding 的竞争力，不在「生成得有多快」，而在「约束得有多清楚」。**

---

## 六、可直接复用的实践清单

### 6.1 开新功能前的五步门禁

```text
[ ] 1. 技术栈是否写死？（含版本倾向）
[ ] 2. 做什么 / 不做什么是否成对出现？
[ ] 3. 组件/模块边界是否拆开？
[ ] 4. 核心数据结构是否人定而非 AI 定？
[ ] 5. 是否明确「本阶段禁止输出代码，只出规划」？
```

### 6.2 胶水编程检查表

```text
[ ] 这个能力社区是否已有成熟库？
[ ] 是否优先 npm 安装，而不是让 AI 手写底层？
[ ] AI 是否只负责：安装命令 + 适配层 + 数据流转？
[ ] review 焦点是否落在「粘合代码」而非「整套算法」？
```

### 6.3 待办 Demo 对应的最小验收

```text
[ ] 新增：空字符串/纯空格不能提交
[ ] 切换完成：样式与计数同步
[ ] 删除：列表即时更新
[ ] 拖拽：顺序变化且不丢字段
[ ] 数据结构始终保持 { id, text, completed }
```

### 6.4 给 AI 的「反屎山」提示骨架

```text
你是资深前端同事，不是代码打印机。
遵守：
1. 先给规划，等我确认前禁止写代码
2. 优先成熟库，禁止从零实现拖拽/虚拟列表/富文本等重能力
3. 字段名以规划为准，不得自行改名
4. 组件拆分按规划执行，状态上置、展示下沉
5. 每完成一段，说明改了哪些文件、如何手动验证
```

---

## 七、面试高频问题与答题框架

### 7.1 什么是 Vibe Coding？它和「让 ChatGPT 写代码」有何不同？

**回答框架：**

> Vibe Coding 是用自然语言驱动 AI 完成软件交付的工作方式。它和「贴一段需求让 ChatGPT 吐代码」的差别，不在模型，而在工程约束：有规划文档、有功能边界、有成熟组件优先策略、有人审门禁。没有约束的 Vibe 只是更快地制造技术债。

### 7.2 为什么强调「先规划，禁止先写代码」？

**回答框架：**

> AI 生成速度极快，会把「没想清楚」瞬间放大成大片代码。规划阶段强制确认技术栈、功能边界、模块拆分和数据结构，等于给后续每一轮 prompt 提供全局约束，降低字段幻觉和功能膨胀。人审规划的成本，远低于人审屎山的成本。

### 7.3 什么是胶水编程？举一个例子。

**回答框架：**

> 胶水编程指优先复用社区验证过的零件，自己（或让 AI）只写模块之间的衔接与数据流转。例如待办拖拽：不手写坐标监听，而是接入 `@dnd-kit/react`，只在 `onDragEnd` 里把 active/over id 映射为数组重排。零件越成熟，幻觉面越小。

### 7.4 功能边界和数据结构为什么必须人来拍板？

**回答框架：**

> 这两项是产品与架构决策，不是实现细节。若交给模型自行发挥，它会在多轮对话中改字段名、加未要求的功能，造成接口漂移和范围失控。人定边界与 schema，模型负责在约束内实现，这是可控协作的前提。

### 7.5 如何让 Vibe Coding 越用越强，而不是每次从零聊天？

**回答框架：**

> 建立反馈闭环：把验收失败与最佳实践回写到规划 md、项目规范、Skills 或 harness 配置。下一轮生成自动带上更强约束。本质是「规范 → 生成 → 验收 → 回写规范」，而不是追求一条永远完美的万能 prompt。

### 7.6 Vibe Coding 里，人的核心价值是什么？

**回答框架：**

> 决策与审核：定目标、划边界、选零件、审规划、验结果、沉淀规范。代码敲击可以被大量替代，但「做什么、不做什么、用什么拼、怎样算做完」仍是人的责任。AI 是高产同事，不是产品负责人。

---

## 结语

第四十三天的 vibe 工程初步，没有发明新框架，而是把很多人「凭感觉用 AI」的过程，收成了可执行的三板斧：

```text
1. 规划门禁
   技术栈 / 边界 / 模块 / 数据
   先审规划，再写代码

2. 胶水编程
   能抄不写，能连不造
   AI 主写适配层，不主写底层轮子

3. 元方法论
   规范 → 生成 → 验收 → 回写规范
   让协作系统自我进化
```

对照 Demo，证据链很完整：

```text
readme 规划  →  组件拆分与字段约定
@dnd-kit     →  拖拽能力的成熟零件
App 重排函数 →  真正该写的胶水
```

如果只能带走一句话，就带走这句：

> **别急着让 AI 写代码；先让它读懂你的规划，再只允许它粘胶水。**

它和相邻文章一起，构成 AI Native 开发者的完整动作：

```text
v001：为什么要 Vibe / OPC
v003：用什么 Agent 工具干活
v011：Prompt 语言怎么组织
v047：Workflow 与 Agent 如何选型
v048：React 组件如何写得健壮
v049（本篇）：Vibe 现场如何避免幻觉与屎山
```

下一阶段，可以把这套方法继续套到更复杂的业务：多实体表单、权限流、BFF 联调——规划更厚，胶水更多，但门禁不变。
