# 手写 Mini-Cursor：用 Node 子进程 + ReAct Loop 打造能写代码、执行命令的 AI 编程助手

## 引言

v034 我们写出了一个文件读取 Agent——它能读文件、分析代码，但有一个致命短板：**它只能"看"，不能"写"，更不能"运行"。**

真正的编程 Agent（Claude Code、Cursor、Trae）有三个核心能力：

```
1. 读文件 → 理解代码  ← v034 已实现
2. 写文件 → 修改代码  ← 今天实现
3. 跑命令 → 创建项目、安装依赖、启动服务器  ← 今天实现
```

今天，我们把这三块拼起来——**用 127 行的工具系统和 126 行的 Agent 循环，手写一个迷你版 Cursor。** 它能听懂"用 React + Vite 创建一个 TodoList 项目"，然后自己建项目、写代码、装依赖、启动服务器。

今天的代码量是之前的 3 倍，但每一行都是工程级的——涉及 Node.js 子进程管理、路径安全、消息关联、ReAct 循环防呆设计。**面试官最爱问的这些工程细节，今天全部覆盖。**

```
v034 ──→ v035 今天
Agent 入门     Agent 工程化
能读文件       能读、能写、能运行
单工具         四工具协同
概念验证       手写 Cursor
```

## 一、Agent 工具生态：从"一只手"到"四肢健全"

### v034 的 Agent 只有一只手

v034 的 `tool.mjs` 里只有一个工具：

```javascript
const tools = [readFileTool]  // 只会读文件
```

**只有一个工具的 Agent，就像一个只长了右手的人——能做一点事，但大部分事做不了。**

真实的编程 Agent 需要四只手：

```
编程 Agent 必备工具：

  read_file       → 读取文件内容、理解项目结构
  write_file      → 写入新代码、修改文件
  list_directory  → 查看目录结构、确认文件是否存在
  execute_command → 执行 npm/pnpm/git 等命令行操作
```

今天的目标：把四只手全接上。

### 工具一：read_file——最基础，最常用

v034 讲过，这里只回顾关键点：

```javascript
const readFileTool = tool(
    async ({ filePath }) => {
        const content = await fs.readFile(filePath, 'utf-8')
        console.log(`[工具调用] read_file(${filePath}) 成功读取 ${content.length} 字节`)
        return content
    },
    {
        name: 'read_file',
        description: `用此工具来读取文件内容，当用户要求读取文件、
        查看代码、分析文件内容时，调用此工具。`,
        schema: z.object({
            filePath: z.string().describe('要读取的文件路径')
        })
    }
)
```

**为什么日志这么重要？** Agent 的任务可能很复杂、很耗时——读一个大文件可能要几秒钟，用户太久没看到反馈，可能以为程序卡死了。`console.log` 是用户知道的唯一证据，证明 Agent 还在干活。

> **面试要点：Agent 的用户体验设计——Agent 不像 API，一次调用就返回。Agent 的运行时间可能很长（几分钟甚至几十分钟），"进度可见性"是工程中的关键需求。** 没有日志反馈的 Agent，用户会在 5 秒后关掉终端。

### 工具二：write_file——让 Agent 能"创造"

```javascript
const writeFileTool = tool(
    async ({ filePath, content }) => {
        try {
            const dir = path.dirname(filePath)        // 获取目录路径
            await fs.mkdir(dir, { recursive: true })  // 递归创建目录（如果不存在）
            await fs.writeFile(filePath, content, 'utf-8')
            console.log(`[工具调用] write_file(${filePath}) 成功写入 ${content.length} 字节`)
            return `成功写入文件 ${filePath}`
        } catch (err) {
            console.log(`[工具调用] write_file(${filePath}) 错误：${err.message}`)
            return `写入文件失败：${err.message}`
        }
    },
    {
        name: 'write_file',
        description: '向指定路径写入文件内容，自动创建目录',
        schema: z.object({
            filePath: z.string().describe('文件路径'),
            content: z.string().describe('要写入的文件内容')
        })
    }
)
```

**write_file 的三个工程细节：**

#### 1. `path.dirname()`——分离路径和文件名

```javascript
const dir = path.dirname('src/components/TodoApp.tsx')
// dir = 'src/components'
```

**为什么不用字符串分割？** 因为 Windows 用 `\`，Linux/Mac 用 `/`。`path.dirname()` 自动适配操作系统——这是 Node.js `path` 模块的核心价值。

> **面试常考题：跨平台路径处理。** 手写 `filePath.split('/').slice(0, -1).join('/')` 在 Windows 上会直接出错。用 `path.dirname()`、`path.join()` 是标准答案。

#### 2. `fs.mkdir(dir, { recursive: true })`——递归创建目录

```javascript
// 要写入 src/components/TodoApp.tsx
// 但 src/components/ 目录可能还不存在

// ❌ 不用 recursive
await fs.mkdir(dir)  // 如果 src/ 不存在 → 报错 ENOENT

// ✅ recursive: true
await fs.mkdir(dir, { recursive: true })
// 自动创建 src/ → src/components/ → 然后写入文件
```

**`recursive: true` 等价于 `mkdir -p`（Linux 命令）。** 没有这个参数，你必须逐层检查并创建目录——那是 15 行代码 vs 1 行代码的差距。

#### 3. `try-catch`——工具崩溃 ≠ Agent 崩溃

```javascript
try {
    await fs.writeFile(filePath, content, 'utf-8')
    return `成功写入文件 ${filePath}`
} catch (err) {
    return `写入文件失败：${err.message}`
}
// 注意：catch 里是 return，不是 throw
// 工具失败不应该让整个 Agent 崩溃
```

**这是 Agent 工具设计的黄金法则：工具可以失败，但 Agent 不能死。** 工具返回错误信息（而不是抛出异常），LLM 看到错误信息后可以决定下一步——换一个路径、检查权限、或报告用户。如果工具直接 `throw`，整个 Agent 进程就挂了。

> **面试要点：Agent 的健壮性设计。** 每个工具都是一个"独立隔离的单元"——工具内部出错，只影响这一个工具调用的结果，不影响整个 Agent 循环。"失败隔离" + "错误信息返回" = Agent 能自己处理错误。

### 工具三：list_directory——让 Agent 能"看目录"

```javascript
const listDirectoryTool = tool(
    async ({ directory }) => {
        try {
            const files = await fs.readdir(directory)
            console.log(`[工具调用] list_directory(${directory}) 成功列出 ${files.length} 个文件和文件夹`)
            return `目录内容: \n${files.map(file => file).join('\n')}`
        } catch (err) {
            console.log(`[工具调用] list_directory(${directory}) 错误：${err.message}`)
            return `列出目录失败：${err.message}`
        }
    },
    {
        name: 'list_directory',
        description: '列出指定目录下的所有文件和文件夹',
        schema: z.object({
            directory: z.string().describe('目录路径')
        })
    }
)
```

**list_directory 在 Agent 工作流中的角色：**

```
Agent 创建完项目后：
  第一步：list_directory('.')        → 确认 react-todo-app 目录存在
  第二步：list_directory('react-todo-app/src')  → 确认 src/ 目录结构
  第三步：read_file('react-todo-app/src/App.tsx')  → 读取需要修改的文件
  第四步：write_file(...)             → 修改
  第五步：执行命令...
```

**`list_directory` 是 Agent 的"眼睛"。** LLM 不知道电脑上有什么文件——它需要一个工具来"看"。先看目录结构，再决定读哪个文件、往哪写。

### 工具四：execute_command——最强大也最危险

这是今天的重头戏。前面三个工具都是文件 I/O，这个工具让 Agent 能执行系统命令——**创建项目、安装依赖、启动服务器，全靠它。**

```javascript
import { spawn } from 'node:child_process'

const executeCommandTool = tool(
    async ({ command, directoryPath }) => {
        const cwd = directoryPath || process.cwd()
        console.log(`[工具调用] execute_command(${command}), 工作目录：${cwd}`)

        return new Promise((resolve, reject) => {
            const [cmd, ...args] = command.split(' ')
            const child = spawn(cmd, args, {
                cwd,
                stdio: 'inherit',  // 子进程输出直接显示在终端
                shell: true,
            })

            let errorMsg = ''
            child.on('error', (err) => {
                errorMsg = err.message
            })

            child.on('close', (code) => {
                if (code === 0) {
                    console.log(`[工具调用] execute_command(${command}) 成功`)
                    resolve(`命令执行成功 ${command}`)
                } else {
                    console.log(`[工具调用] execute_command(${command}) 失败，退出码：${code}`)
                    resolve(`命令执行失败，退出码：${code}，错误信息：${errorMsg}`)
                }
            })
        })
    },
    {
        name: 'execute_command',
        description: '执行系统命令，支持指定工作目录，实时显示输出',
        schema: z.object({
            command: z.string().describe('要执行的命令'),
            directoryPath: z.string().describe('工作目录')
        })
    }
)
```

这个工具不大，但工程点密集。逐个拆解：

## 二、Node.js child_process 深度剖析

### 为什么需要子进程？

```
Node.js 主进程（Agent 执行）
    │
    │  任务：创建 Vite 项目
    │  需要运行：pnpm create vite react-todo-app --template react-ts
    │
    ├── 方案一：在主进程中执行
    │   → 阻塞事件循环，整个 Agent 卡住
    │   → 命令崩溃 = Agent 崩溃
    │   → ❌
    │
    └── 方案二：开一个子进程执行
        → 主进程继续运行，不阻塞
        → 子进程崩溃 ≠ Agent 崩溃
        → IPC 通信通知主进程结果
        → ✅
```

**子进程 = 独立运行的程序实例。** 它有自己的内存空间、自己的标准输入输出、自己的退出码。主进程通过 IPC（Inter-Process Communication，进程间通信）和它交互。

> **面试核心概念：Node.js 的单线程 vs 多进程。** Node.js 主线程是单线程的（事件循环），但这不代表 Node 不能并发——`child_process` 模块允许 Node 启动多个子进程，每个子进程独立运行。主进程 + 多子进程 = 多进程并发模型。

### spawn 的四个关键参数

```javascript
const child = spawn(cmd, args, {
    cwd,           // 1. 工作目录——命令在哪个目录执行
    stdio: 'inherit', // 2. 标准 IO——子进程的输出怎么处理
    shell: true,      // 3. Shell 模式——是否通过 shell 执行
})
```

逐个理解：

#### 1. `cwd`（Current Working Directory）

```javascript
// Agent 在主进程中（cwd = E:\WROKSPACE）
// 但要创建的项目在子目录 react-todo-app/

// ❌ 错误做法：在 command 里写 cd
const command = 'cd react-todo-app && pnpm install'

// ✅ 正确做法：用 cwd 参数
spawn('pnpm', ['install'], { cwd: 'react-todo-app' })
```

**`cwd` 让子进程在指定目录执行——不需要 `cd` 命令。**

这是个重要细节——在 Agent 的 system prompt 里专门写了这条规则：

```
重要规则 - execute_command：
- workingDirectory 参数会自动切换到指定目录
- 当使用 workingDirectory 时，绝对不要在 command 中使用 cd
- 错误示例: { command: "cd react-todo-app && pnpm install", workingDirectory: "react-todo-app" }
  这是错误的！因为 workingDirectory 已经在 react-todo-app 目录了，再 cd react-todo-app 会找不到目录
```

**写进 system prompt 不是多此一举——Agent 不是人，它不知道 `cd` 和 `cwd` 是重复的。** 如果不明确说明，Agent 会把 `cwd` 参数和 `cd` 命令叠在一起——结果就是 `cd react-todo-app/react-todo-app/`，路径不存在，任务失败。

> **这个细节面试官可能会追问：为什么 Agent 需要这么详细的规则说明？**
>
> 答案：因为 LLM 是用自然语言推理的，而不是执行代码。LLM 看到 "execute_command 有 directoryPath 参数"和"需要进入目录执行命令"，它的默认行为是两件事都做——既设 directoryPath 又写 cd。它不理解这是"重复指定目录"。**做冗余处理比不做处理好——这就是 prompt engineering 的工程细节。**

#### 2. `stdio: 'inherit'`——子进程的输入输出

```
stdio 有三种常用配置：

  'pipe'   → 父进程捕获子进程的输出（通过管道读取）
             用于：需要分析命令输出内容的场景
             
  'inherit' → 子进程直接使用父进程的终端
             用于：想看到命令的实时输出（如 npm install 的进度条）
             
  'ignore'  → 丢弃子进程的所有输出
             用于：只关心成功/失败，不关心输出内容
```

```javascript
// 场景一：需要读命令输出 → pipe
const child = spawn('ls', ['-la'], { stdio: 'pipe' })
child.stdout.on('data', (data) => {
    console.log(`输出：${data}`)
})

// 场景二：要看实时进度 → inherit（npm install 的进度条需要终端交互）
const child = spawn('npm', ['install'], { stdio: 'inherit' })

// 场景三：后台静默执行 → ignore
const child = spawn('node', ['server.js'], { stdio: 'ignore' })
```

**`stdio: 'inherit'` 的好处：** `npm install` 有自己的进度条和彩色输出——用 `inherit`，这些输出直接出现在你的终端里，就像你自己敲命令一样。用 `pipe`，输出会被捕获但不会实时显示，体验就差很多。

#### 3. `shell: true`——让命令通过 shell 执行

```javascript
// shell: false（默认）
spawn('ls', ['-la'])                    // 直接执行 ls 程序

// shell: true
spawn('pnpm create vite react-todo-app --template react-ts')
// → 启动一个 shell（Windows 上是 cmd.exe，Linux/Mac 上是 /bin/sh）
// → shell 解析命令字符串
// → shell 启动 pnpm 程序
```

**`shell: true` 的作用：** 让命令像在终端里敲的一样工作。管道（`|`）、重定向（`>`）、环境变量（`$PATH`）都能用。代价是性能——中间多了一层 shell 进程。

> **面试追问：`shell: true` 有安全风险吗？**
>
> 有——如果命令字符串包含用户输入，可能被注入恶意命令。例如 `command: "echo " + userInput`，如果 `userInput` 是 `"; rm -rf /"`，shell 会执行 `echo ; rm -rf /`，第二条命令就危险了。安全做法：**永远不要让用户输入直接拼接到命令字符串中。**

### spawn 的事件模型

```javascript
let errorMsg = ''
child.on('error', (err) => {
    errorMsg = err.message   // 进程启动失败（如命令不存在）
})

child.on('close', (code) => {
    if (code === 0) {
        // 正常退出
    } else {
        // 异常退出——code 是非零的退出码
    }
})
```

```
子进程的生命周期：

  spawn() 创建
      │
      ├── 'error' 事件 → 进程启动失败
      │   例如：命令不存在、没有执行权限
      │
      └── 'close' 事件 → 进程结束
           code === 0  → 成功
           code !== 0  → 失败（code 是程序的退出码，非零 = 出错）
```

**`error` 和 `close` 的区别：** `error` 是"根本启动不了"（命令找不到、权限不足），`close` 是"启动了但执行出错了"（编译失败、测试不通过）。两个事件都要处理。

### 为什么 execute_command 返回 Promise？

```javascript
return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { ... })

    child.on('close', (code) => {
        // 4 分钟后，子进程执行完...
        resolve(`命令执行成功 ${command}`)
        // ← Promise 才 resolve，await 才解除
    })
})
```

**`spawn` 是异步的——它启动子进程后立即返回，不等待子进程完成。** 但 Agent 需要知道命令执行的结果才能决定下一步。所以把 `close` 事件包装成 Promise——`await executeCommandTool(...)` 会等到命令真正执行完。

```
没有 Promise 包装：
  await executeCommandTool(...)  → 立即返回（子进程还在跑）
  → Agent 以为命令已经执行完了
  → 下一步操作基于错误的状态
  → 乱套了

有 Promise 包装：
  await executeCommandTool(...)  → 等到子进程关闭才返回
  → Agent 拿到准确的执行结果
  → 下一步操作基于真实的状态
  → 正确
```

## 三、手写 Mini-Cursor：把四个工具串成编程 Agent

有了四把工具，下一步是让 Agent 学会"使用"它们——这需要 ReAct 循环、System Prompt 设计、以及防呆规则。

### Mini-Cursor 的完整架构

```
┌──────────────────────────────────────────────────────────┐
│                    Mini-Cursor Agent                      │
│                                                          │
│  用户任务：用 React+Vite 创建 TodoList 项目                │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              System Prompt                          │ │
│  │  "你是一个项目管理助手，使用工具完成任务"             │ │
│  │  + 四个工具的详细说明                                │ │
│  │  + 重要规则（workingDirectory ≠ cd）                 │ │
│  └─────────────────────────────────────────────────────┘ │
│                          │                                │
│                          ▼                                │
│  ┌─────────────────────────────────────────────────────┐ │
│  │           ReAct 循环（max 30 轮）                    │ │
│  │                                                     │ │
│  │  while (未完成 且 未超30轮) {                         │ │
│  │    LLM.invoke(messages)  →  思考 + 决定用什么工具     │ │
│  │    如果有 tool_calls → 逐个执行工具 → 结果追加       │ │
│  │    如果没有 tool_calls → 任务完成，输出最终结果       │ │
│  │  }                                                  │ │
│  └─────────────────────────────────────────────────────┘ │
│                          │                                │
│                          ▼                                │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              四个工具                                 │ │
│  │  read_file | write_file | list_directory | exec_cmd  │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### 初始化：模型配置

```javascript
const model = new ChatOpenAI({
    modelName: 'deepseek-v4-pro',
    apiKey: process.env.DEEPSEEK_API_KEY,
    temperature: 0,  // 工具调用要确定性，不要"创意"
    configuration: {
        baseURL: 'https://api.deepseek.com/v1',
    },
})

const tools = [
    executeCommandTool,
    readFileTool,
    writeFileTool,
    listDirectoryTool
]

const modelWithTools = model.bindTools(tools)  // 一行注册所有工具
```

### 任务描述：一个结构化的 Prompt

```javascript
const case1 = `
创建一个功能丰富的React TodoList 应用
1. 创建项目：echo -e "n\nn" | pnpm create vite react-todo-app --template react-ts 
2. 修改 src/App.tsx，实现完整功能的TodoList:
   - 添加、删除、标记完成
   - 分类筛选（全部/进行中/已完成）
   - 统计信息显示
   - localStorage 数据库持久化
3. 添加复杂样式
   - 渐变背景（浅红/玫瑰红到白金）
   - 卡片阴影，圆角
   - 悬停修改
4. 添加动画
  - 添加/删除时的过渡动画
  - 使用css transition
5. 列出目录确定

注意：使用pnpm，功能要完整，样式要美观，要有动画效果

之后react-todo-app 项目中：
1. 使用pnpm install 安装依赖
2. 使用pnpm run dev 启动服务器
`
```

**这个 Prompt 的结构很讲究：**

```
层级一：明确最终目标（创建 TodoList 应用）
层级二：分解步骤（1→2→3→4→5）
层级三：每个步骤的具体要求（功能清单、样式规范、动画要求）
层级四：技术约束（使用 pnpm）
层级五：最终验证（install + dev）
```

**为什么要把任务写得这么详细？** 因为 Agent 没有常识——如果你只说"做个 todo 应用"，它可能给你 5 行的 HTML 文件。**把验收标准写进 Prompt，Agent 才知道"做到什么程度算完成"。**

### System Prompt 设计：写给 LLM 的操作手册

```javascript
new SystemMessage(`你是一个项目管理助手，使用工具完成任务。
当前工作目录：${process.cwd()}
工具：
1. read_file: 读取文件内容
2. write_file: 写入文件内容
3. list_directory: 列出目录内容
4. execute_command: 执行系统命令
   重要规则 - execute_command：
   - workingDirectory 参数会自动切换到指定目录
   - 当使用 workingDirectory 时，绝对不要在 command 中使用 cd
   - 错误示例: { command: "cd react-todo-app && pnpm install", workingDirectory: "react-todo-app" }
   这是错误的！因为 workingDirectory 已经在 react-todo-app 目录了，再 cd react-todo-app 会找不到目录
   - 正确示例: { command: "pnpm install", workingDirectory: "react-todo-app" }
   这样就对了！workingDirectory 已经切换到 react-todo-app，直接执行命令即可
   
   回复要简洁，只说做了什么
`)
```

**System prompt 的五要素：**

| 要素 | 内容 | 作用 |
|------|------|------|
| 角色定义 | "项目管理助手" | 框定 LLM 的行为边界 |
| 上下文 | `process.cwd()` | 告诉 LLM 它在哪里 |
| 工具列表 | 4 个工具的简要说明 | 让 LLM 知道有哪些能力 |
| 使用规则 | execute_command 的注意事项 | **防止误操作**（cd 重复） |
| 输出风格 | "回复要简洁" | 节省 token |

> **面试追问：为什么要在 System Prompt 里写 `process.cwd()`？**
>
> LLM 不知道自己运行在哪台机器、哪个目录。如果不告诉它当前目录，它可能会用 `/Users/xxx/projects/my-app` 这种编造的路径。**把运行时上下文（工作目录、可用工具列表、操作系统信息）写进 System Prompt，是让 LLM 做出正确决策的前提。**

### ReAct 循环：Agent 的心跳

```javascript
async function runAgentWithTools(query, maxIterations = 30) {
    const messages = [
        new SystemMessage(`你是一个项目管理助手...`),
        new HumanMessage(query)
    ]

    for (let i = 0; i < maxIterations; i++) {
        console.log(chalk.blue(`第 ${i} 次思考...`))
        const response = await modelWithTools.invoke(messages)
        messages.push(response)

        // 终止条件：没有 tool_calls = Agent 认为任务完成
        if (!response.tool_calls || response.tool_calls.length === 0) {
            console.log(`\n AI 最终回复: \n${response.content}\n`)
            return response.content
        }

        // 执行所有工具调用
        for (const toolCall of response.tool_calls) {
            const foundTool = tools.find(t => t.name === toolCall.name)
            if (foundTool) {
                const toolResult = await foundTool.invoke(toolCall.args)
                messages.push(new ToolMessage({
                    content: toolResult,
                    tool_call_id: toolCall.id
                }))
            }
        }
    }

    return messages[messages.length - 1].content
}
```

**注意这里和 v034 的一个重要区别：v034 用 `Promise.all` 并行执行多个工具调用，这里用 `for...of` 串行执行。** 为什么？

```
v034（文件读取 Agent）：
  LLM 一次可能返回多个 tool_call（读三个文件）
  → 三个文件没有依赖关系 → Promise.all 并行
  → 快！

v035（编程 Agent）：
  LLM 通常一次只返回一个 tool_call（顺序操作）
  创建项目 → 等结果 → 读文件 → 等结果 → 写文件 → 等结果
  → 有严格的前后依赖 → for...of 串行
  → 正确！
```

**两种模式各有适用场景——不是并行一定比串行好。** 当工具调用之间有依赖关系时，必须串行。

### 防呆设计：用 setTimeout 防止 Agent 卡死

```javascript
setTimeout(() => {
    console.log("⏰ 超时兜底强制退出进程")
    process.exit(0)
}, 100000000)  // 约 27.8 小时
```

**这个 setTimeout 是兜底机制。** Agent 可能因为各种原因卡住——LLM API 无响应、子进程僵尸、无限循环。如果没有这个兜底，进程可能永远不死，占用系统资源。

> **工程实践：任何长时间运行的服务都需要"超时兜底"。** 不是针对 Agent——这是分布式系统的通用原则。服务健康检查（health check）+ 超时自动重启（watchdog）= 面向失败的设计。

## 四、完整的执行流程回放

让我们看 Mini-Cursor 从收到任务到完成项目的全过程：

```
任务："用 react+vite 创建一个 todolist 项目，并运行起来"

第 1 次思考：
  观察：需要创建 Vite 项目
  tool_call: execute_command("pnpm create vite react-todo-app --template react-ts")
  执行：spawn 子进程创建项目（约 20 秒）
  结果：react-todo-app/ 目录创建成功 ✓

第 2 次思考：
  观察：项目已创建，需要理解当前代码结构
  tool_call: list_directory("react-todo-app/src")
  结果：App.tsx, App.css, main.tsx, index.css, vite-env.d.ts

第 3 次思考：
  观察：需要读取 App.tsx 了解现有代码
  tool_call: read_file("react-todo-app/src/App.tsx")
  结果：Vite 默认模板代码（计数器示例）

第 4 次思考：
  观察：需要把计数器改成 TodoList
  tool_call: write_file("react-todo-app/src/App.tsx", <完整的 TodoList 代码>)
  结果：写入成功 ✓

第 5-6 次思考：
  写入 App.css 样式文件
  包含：渐变背景、卡片阴影、过渡动画

第 7 次思考（可能）：
  检查目录确认所有文件到位
  tool_call: list_directory("react-todo-app/src")

第 8 次思考：
  观察：代码写完了，需要安装依赖
  tool_call: execute_command("pnpm install", { directoryPath: "react-todo-app" })
  结果：依赖安装成功 ✓

第 9 次思考：
  观察：依赖装完了，可以启动
  tool_call: execute_command("pnpm run dev", { directoryPath: "react-todo-app" })
  结果：Vite 开发服务器启动在 http://localhost:5173 ✓

第 10 次思考：
  观察：所有步骤完成
  无 tool_calls → 输出最终总结
  "项目已创建并运行在 http://localhost:5173，功能包括添加、删除、标记完成、
   分类筛选、统计信息、localStorage 持久化、过渡动画..."
  → 循环结束 ✓
```

**从"创建一个项目"到"服务器跑起来"，全部由 Agent 自主完成。** 整个过程 10 轮左右，涉及 read_file、write_file、list_directory、execute_command 四种工具的交替使用。

## 五、node-exec.mjs：理解子进程的独立实验

`node-exec.mjs` 是一个独立的小实验——不需要 LangChain，不需要 Agent，纯粹的 Node.js 子进程操作：

```javascript
import { spawn } from 'node:child_process'

const command = 'pnpm create vite react-todo-app --template react-ts'
const [cmd, ...args] = command.split(' ')  // ['pnpm', 'create', 'vite', ...]
const cwd = process.cwd()

const client = spawn(cmd, args, {
    cwd,
    stdio: 'inherit',  // 子进程的输出直接显示在当前终端
    shell: true
})

let errorMsg = ''
client.on('error', (err) => {
    errorMsg = err.message
})

client.on('close', (code) => {
    if (code === 0) {
        process.exit(0)  // 成功
    } else {
        console.error(`错误：${errorMsg}`)
        process.exit(1 || code)  // 失败
    }
})
```

**这个实验的价值在于：让你在不需要 Agent 的情况下，先理解子进程的工作原理。** 当你把 `spawn` 包装进 LangChain 的 `tool()` 时，你就已经知道它底层在做什么。

```
学习路径：

  node-exec.mjs          → all-tools.mjs          → mini-cursor.mjs
  纯 Node 子进程实验      把 spawn 包装成 LangChain  完整的 ReAct Agent
  理解 spawn 原理         tool，配 description      拼上所有工具
  独立可运行              供 LLM 调用                自动化编程
```

**这是学习 Agent 的推荐路径——不要一上来就写 Agent，先把每个工具独立写好、测好。** 工具是 Agent 的"手脚"，手脚不好使，大脑再聪明也白搭。

## 六、完整的技术对比：Chatbot → Agent → Mini-Cursor

```
层级          能力                        代码量       关键技术

Chatbot      一问一答                     50 行        fetch() + completion API
   ↓
Read Agent   能读文件、分析代码            150 行       LangChain tool() + ReAct
   ↓
Write Agent  能读文件、写文件              250 行       + fs/promises + path
   ↓
CLI Agent    能读文件、写文件、执行命令      400 行       + child_process/spawn
   ↓
Mini-Cursor  能自主完成编程任务            500+ 行      + System Prompt 工程化
                                                        + 防呆设计
                                                        + 工具协同
```

**每一层都建立在上一层的基础上。** 没有 Read Agent 的 ReAct 循环，就不可能有 Mini-Cursor 的自动化编程。工程是堆出来的，不是跳出来的。

## 七、面试要点汇总

今天的内容对面试价值极高——下面是关键面试题的速查表：

### Node.js 相关

| 面试题 | 答案要点 |
|--------|---------|
| Node 是单线程的，怎么实现并发？ | `child_process` 启动多进程、`worker_threads`、事件循环 + 异步 I/O |
| spawn 和 exec 的区别？ | spawn 返回流（stream），适合长时间运行；exec 缓冲全部输出后回调，适合短命令 |
| stdio 的三种模式？ | `pipe`（父进程捕获）、`inherit`（共享终端）、`ignore`（丢弃） |
| shell: true 的作用和风险？ | 让命令通过 shell 执行，支持管道/重定向。风险：命令注入 |
| IPC 是什么？ | Inter-Process Communication，进程间通信。Node 中通过 `child.send()` 和 `process.on('message')` 实现 |

### Agent 工程相关

| 面试题 | 答案要点 |
|--------|---------|
| Agent 需要哪些工具？ | read_file、write_file、list_directory、execute_command、search、browser 等 |
| 工具失败怎么办？ | try-catch 捕获，**return 错误信息而不是 throw**——工具失败 ≠ Agent 崩溃 |
| System Prompt 怎么写？ | 五要素：角色定义、运行时上下文、工具列表、使用规则、输出风格 |
| ReAct 循环的终止条件？ | 无 tool_calls / 超最大轮次 / 超 token 限制 / 连续相同结果 |
| 什么时候用 Promise.all，什么时候用 for...of？ | 无依赖关系 → Promise.all 并行；有依赖关系 → for...of 串行 |

### 路径与文件系统

| 面试题 | 答案要点 |
|--------|---------|
| 跨平台路径处理？ | 不要用字符串分割，用 `path.dirname()`、`path.join()`、`path.resolve()` |
| 递归创建目录？ | `fs.mkdir(dir, { recursive: true })` = `mkdir -p` |
| 为什么要分离路径和文件名？ | Windows 用 `\`，Unix 用 `/`——`path` 模块自动适配 |

## 八、AI 工程化认知升级

### 工具设计的两个层次

```
层次一：功能能做
  → 工具能完成基本操作（读文件、写文件、执行命令）
  → 最低要求

层次二：工程可靠
  → 容错处理（try-catch，返回错误信息）
  → 日志反馈（console.log 让用户知道进度）
  → 路径安全（path 模块，跨平台兼容）
  → 目录自动创建（recursive: true）
  → 防止误操作（System Prompt 中写明规则）
  → 超时兜底（setTimeout 防卡死）
```

**功能能做 ≠ 工程可靠。** 同样 4 个工具，50 行代码也能写，127 行代码也能写——差别就在工程细节。面试官看的不只是"你用了什么 API"，更看"你怎么处理异常"。

### Agent 开发的完整技能树

```
AI Native 开发者（FDE）的能力栈（更新版）：

  概念层：Agent = LLM + Memory + Tool + RAG + MCP + Skills
  机制层：ReAct Loop = while + tool_calls + ToolMessage
  基础层：Token + Embedding（LLM 怎么读文字）
  框架层：LangChain（tool() + bindTools() + Message 类型）
  系统层：Node.js child_process（spawn + IPC + 进程管理）  ← 今天新增
  工程层：容错设计 + 进度反馈 + 跨平台适配 + 防呆机制    ← 今天新增
  优化层：Promise.all 并行（无依赖）/ for...of 串行（有依赖）
  后  端：nest.js（把 Agent 部署成产品）
```

### 从学到造：今天跨出的关键一步

```
v029: Agent 是什么       → 概念层
v030: Agent 怎么跑       → 机制层（Loop）
v031: Agent 怎么写       → 工程化（LangGraph + Supervisor）
v032: LLM 怎么读         → 基础层（Token + Embedding）
v033: 框架怎么用         → 实战层（LangChain 入门）
v034: Promise × LangChain → 实战层进阶（并行工具调用）
─── 以上是"学概念 + 打基础" ───
v035（今天）: 手写 Cursor → 工程层（完整工具系统 + Node 子进程）
─── 以下是"造轮子" ───
下一步: 多 Agent 协作、RAG 接入、产品化部署
```

**今天是你从"AI 学习者"变成"AI 工程师"的分水岭。** 因为今天你写的不是一个 demo——你写的是一个四工具协同、能自主完成编程任务的 Agent。它背后是 Node.js 系统编程、Agent 架构设计、Prompt Engineering 三个领域的交叉知识。

## 结语

第三十一天，我们把四块积木拼成了一座能跑的房子：

### 1. 四个工具 = Agent 的四肢

```
read_file       → 看（理解代码）
write_file      → 写（创造代码）
list_directory  → 观察（了解项目结构）
execute_command → 执行（跑命令、建项目）
```

**工具的种类和质量，直接决定 Agent 的能力边界。** Claude Code 的强大，不是因为它的 LLM 更聪明——而是因为它有精心设计的工具集（File System Tool、Search Tool、Bash Tool、Edit Tool、Web Fetch Tool……）。今天你写的这四个工具，就是这些工具的"迷你版"。

### 2. Node.js 子进程 = Agent 连接系统的桥梁

```
spawn(cmd, args, { cwd, stdio, shell })
    │
    ├── cwd: 指定工作目录（不用 cd）
    ├── stdio: inherit（看实时输出）/ pipe（捕获输出）/ ignore（静默）
    ├── shell: 让命令像在终端里一样工作
    │
    └── 事件：error（启动失败）+ close（执行结束）
```

**没有子进程，Agent 就只能活在"文件世界"里——能读能写，但不能运行。** 子进程让 Agent 走出了文件世界，进入了真实的系统环境。

### 3. Mini-Cursor = ReAct + 四工具 + System Prompt

```
用户任务 → System Prompt（设定角色 + 规则）→ ReAct 循环
  → LLM 思考 → 决定用哪个工具 → 执行工具 → 观察结果
  → 再思考 → 再用工具 → ... → 任务完成
```

**126 行代码，包含了一个编程 Agent 的所有核心基因。** 这 126 行不是终点，而是一个框架——你可以往里面加新的工具（搜索网页、调用 API、操作数据库），Agent 的能力就随之扩展。

### 核心认知

**"让 AI 帮你写代码"这件事的价值，不在于少敲了几行代码——而在于你把自己的角色从"写代码的人"变成了"定义任务、审查结果、做决策的人"。**

```
以前：你写代码，AI 提供建议
现在：你定义任务，AI 写代码，你审查结果
以后：多个 Agent 协作，你定义系统，Agent 自主运作
```

工具在变，角色在变，但不会变的是两样东西：**理解底层原理的能力**和**工程化思维**。今天你理解了 spawn 的四个参数，明天换一个框架，你还是能快速上手——因为原理是通的。今天你设计了 System Prompt 的五要素，明天写更复杂的 Agent，这个模板仍然有效。

下篇见。

---

*本篇内容基于第三十一天学习笔记，重点呈现了 Agent 工具系统的完整构建、Node.js child_process 的工程实践，以及 Mini-Cursor 编程 Agent 的从零实现。*
