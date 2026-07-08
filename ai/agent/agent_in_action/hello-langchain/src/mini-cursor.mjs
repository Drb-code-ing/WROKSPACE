// 手写 mini cursor
// 使用vite 基于react 创建一个todolist 项目
// 给我目录列表
//  编程Agent 自动化
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { ChatOpenAI } from '@langchain/openai'
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  ToolMessage
} from '@langchain/core/messages'
import {
  executeCommandTool,
  readFileTool,
  writeFileTool,
  listDirectoryTool
} from './all-tools.mjs'
import chalk from 'chalk'// 颜色输出 突出重点

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '.env') })

const model = new ChatOpenAI({
  modelName:'deepseek-v4-pro',
  apiKey: process.env.DEEPSEEK_API_KEY,
  temperature: 0,
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
// lang + chain(链条)
const modelWithTools = model.bindTools(tools)

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

// Agent 执行函数ReAct
async function runAgentWithTools(query, maxIterations = 30) {
  const messages = [
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
    `),

    new HumanMessage(query)
  ]
  // ReAct 循环是Agent 执行机制
  for(let i = 0; i < maxIterations; i++) {
    console.log(chalk.blue(`第 ${i} 次思考...`))
    const response = await modelWithTools.invoke(messages)
    messages.push(response)
    if(!response.tool_calls || response.tool_calls.length === 0) {
      console.log(`\n: AI 最终回复: \n${response.content}\n`)
      return response.content
    }

    for(const toolCall of response.tool_calls) {
      const foundTool = tools.find(t => t.name === toolCall.name)
      if(foundTool) {
        const toolResult = await foundTool.invoke(toolCall.args)
        messages.push(new ToolMessage({
          content: toolResult,
          tool_call_id: toolCall.id
        }))
      }
    }
  }

  // 最后一次回复
  return messages[messages.length - 1].content
}

try {
  await runAgentWithTools(case1)
} catch (err) {
  console.error(`\n错误: ${err.message}`)
}

setTimeout(() => {
  console.log("⏰ 超时兜底强制退出进程");
  process.exit(0);
}, 100000000);