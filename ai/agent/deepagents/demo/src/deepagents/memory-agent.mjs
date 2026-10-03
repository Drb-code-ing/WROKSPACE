import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ChatOpenAI } from '@langchain/openai'
import { createAgent, HumanMessage } from 'langchain'
import {
  createFilesystemMiddleware,
  createMemoryMiddleware, // Agent 记忆中间件
  FilesystemBackend, // 文件系统后端
} from 'deepagents'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceDir = path.join(__dirname, 'workspace-memory')
const projectMemoryPath = '/AGENTS.md'
const preferencesMemoryPath = 'memory/preferences.md' // 用户偏好

const model = new ChatOpenAI({
  model: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
  temperature: 0,
})

const prompts = [
  "根据记忆，这个项目是做什么的？只回答一句话。", // 需要读memory
  "请记住：我常用的包管理器是npm。",
  "请记住：本仓库主入口脚本是 src/deepagents/memory-agent.mjs。",
  "我常用什么包管理器？本demo 主入口脚本路径是什么？各用一行回答"
]

const backend = new FilesystemBackend({
  rootDir: workspaceDir,
  virtualMode: true,
})

const agent = createAgent({
  model,
  tools: [],
  systemPrompt: [
    '你是项目助手。工作区根路径为/ ，可用ls、read_file、write_file、edit_file工具。',
    '根据<agent_memory>回答：用户要求记住时，必须立刻edit_file，且按类型写入对应文件',
    `- ${projectMemoryPath}：项目说明、技术栈、架构、仓库约定等`,
    `- ${preferencesMemoryPath}：用户偏好（语言、包管理器、回答风格等）`,
    '不用混写：项目事实不用写入preferences，个人偏好不要写入 AGENTS.md'
  ].join("\n"),
  middleware: [
    createFilesystemMiddleware({ backend }),
    createMemoryMiddleware({
      backend,
      sources: [projectMemoryPath, preferencesMemoryPath],
    }),
  ]
})

// history 累积多轮对话：每轮把上一轮完整 messages 带进去，实现跨 invoke 的上下文延续
let history = []

for(const prompt of prompts) {
  console.log('\n 用户', prompt)
  // 注意：内层变量叫 result，不能叫 messages——会遮蔽外层并在 TDZ 阶段报错
  const result = await agent.invoke(
    {
      messages: [...history, new HumanMessage({ content: prompt })],
    },
    {recursionLimit: 30}
  )
  history = result.messages // 关键：把本轮完整消息写回，下一轮才有历史可带
  console.log('回复: ', result.messages.at(-1)?.content )
}