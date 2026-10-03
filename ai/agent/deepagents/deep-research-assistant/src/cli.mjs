// 除了开发者，面向其他Agent的调用
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import readline from 'node:readline/promises' // 用于读取用户输入
import  { stdin as input, stdout as output } from 'node:process'
import { HumanMessage } from '@langchain/core/messages'

import { createIntelligenceDeskAgent } from './agent.mjs'

const recursionLimit = 300 // 递归深度限制

const FILE_TOOLS = new Set ([
  "write_file",
  "edit_file",
  "read_file",
  'ls',
  'glob', // 通配符匹配文件，如 '*.md'
  'grep', // 关键词搜索文件内容，如 'grep "hello" *.md'
])

const EVAL_TOOL = 'eval'
const PREVIEW_LEN = 100
const RESULT_PREVIEW_LEN = 120

async function readQuery() {
  // process.argv 是命令行参数数组 
  // [0] node可执行文件路径
  // [1] 被执行的脚本路径
  const fromArgs = process.argv.slice(2).join(' ').trim()
  if(fromArgs) return fromArgs
  // 从标准输入读取用户输入
  const rl = readline.createInterface({
    input,
    output,
  })

  try {
    return (await rl.question('请输入调研主题：')).trim()
  } finally {
    rl.close()
  }
}

async function run(query) {
  console.log(`query: ${query} \n`)
  console.log(`recursionLimit: ${recursionLimit} \n`)
  console.log(`-`.repeat(50))

  const agent = createIntelligenceDeskAgent()
  const pending = new Map()
  const pendingEval = new Map()

  for await(const [namespace, chunk] of await agent.stream(
    {messages: [new HumanMessage(query)]},
    // streamMode: 'updates' 流式返回每个节点的增量更新，而不是等待所有节点完成后再返回
    // subgraphs: true 允许深入到子图内部，把嵌套子Agent 的更新也流出来，否则只显示顶层
    // recursionLimit 递归深度限制，防止无限循环
    {streamMode: 'updates', subgraphs: true, recursionLimit}
  )) {
    // namespace: [] 表示顶层图节点，非空表示子Agent 内部节点
    const prefix = namespace.length ? `[${namespace.join('/')}] ` : ''
    // chunk 形如 { 节点名: { messages: [...] } }
    for (const [node, update] of Object.entries(chunk)) {
      const msgs = update?.messages ?? []
      const m = msgs[msgs.length - 1]
      if (!m) continue
      // AI 消息带 tool_calls → 打印要调用的工具；ToolMessage → 打印结果预览；普通消息 → 打印内容预览
      if (Array.isArray(m.tool_calls) && m.tool_calls.length) {
        for (const tc of m.tool_calls) {
          console.log(`${prefix}${node} → 调用工具 ${tc.name}`)
        }
      } else if (m.tool_call_id) {
        console.log(`${prefix}${node} ← ${String(m.content).slice(0, RESULT_PREVIEW_LEN)}`)
      } else {
        console.log(`${prefix}${node}: ${String(m.content).slice(0, PREVIEW_LEN)}`)
      }
    }
  }
}

async function main() {
  console.log('深度调研助手')

  const query = await readQuery()
  if(!query) {
    console.log('请提供调研主题')
    process.exit(1)
  }

  try {
    await run(query)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

main()
 .catch(err => {
   console.error(err)
   process.exit(1)
 })