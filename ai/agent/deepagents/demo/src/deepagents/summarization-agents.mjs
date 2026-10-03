import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ChatOpenAI } from '@langchain/openai'
import { createAgent, HumanMessage } from 'langchain'
import {
  createFilesystemMiddleware,
  createSummarizationMiddleware, // 摘要中间件
  FilesystemBackend, // 文件系统后端
} from 'deepagents'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceDir = path.join(__dirname, 'workspace-summarization')
const historyPathPrefix = '/conversation_history'

const summaryPrompt = `
  你是对话摘要助手。请用中文总结以下对话，包含：
  1. 讨论的主要话题
  2. 达成的关键结论或决定
  3. 继续对话所需的重要上下文

  保持简洁，不要罗列无关细节。

  待摘要的对话：
  {conversation}
  摘要：
`

fs.rmSync(workspaceDir, { recursive: true, force: true })
fs.mkdirSync(workspaceDir, { recursive: true })

const model = new ChatOpenAI({
  model: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
  temperature: 0,
})

const backend = new FilesystemBackend({
  rootDir: workspaceDir,
  virtualMode: true,
})

const agent = createAgent({
  model,
  tools: [],
  systemPrompt: 
  "你是会话助手。记住用户提到的关键事实，中文简短回答。若看到[此前对话摘要]，请据此继续对话。",
  middleware: [
    createFilesystemMiddleware({ backend }),
    // 摘要选项（trigger/keep/historyPathPrefix/summaryPrompt/model）属于 createSummarizationMiddleware，
    // 传给 filesystem 中间件会被静默忽略
    createSummarizationMiddleware({
      model,
      backend,
      historyPathPrefix,
      summaryPrompt,
      trigger: { type: 'messages', value: 8 }, // 当对话长度超过8条时触发摘要
      keep: { type: 'messages', value: 4 }, // 摘要后保留最近4条
    })
  ]
})

const prompts = [
  "请记住：我的宠物猫叫小橘。",
  "请记住：我住在北京。",
  "请记住：我喜欢喝拿铁。",
  "请记住：我的生日是 5 月 1 日。",
  "根据我们聊过的内容，我的猫叫什么、住哪、喜欢喝什么、生日是哪天？每项一行。",
];

const historyDir = path.join(workspaceDir, historyPathPrefix.replace(/^\//, ''))
console.log(historyDir)

function listHistoryFiles() {
  if(!fs.existsSync(historyDir)) return []
  return fs.readdirSync(historyDir) // 读取所有文件
}

let messages = []
let knowHistory = new Set(listHistoryFiles())

for(const prompt of prompts) {
  console.log('\n 用户：', prompt)
  const { messages: newMessages } = await agent.invoke(
    {messages: [...messages, new HumanMessage({content: prompt})]},
    {recursionLimit: 30}
  )

  messages = newMessages
  console.log('回复：', messages.at(-1).content)
  console.log('当前消息数：', messages.length)
}