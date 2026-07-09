import 'dotenv/config'
// agent 配置 mcp client ? 可以配置多个server
import { MultiServerMCPClient } from '@langchain/mcp-adapters'
import { ChatOpenAI } from '@langchain/openai'
import chalk from 'chalk'
import { 
  HumanMessage,
  ToolMessage,
  SystemMessage,
} from '@langchain/core/messages'

const model = new ChatOpenAI({
  modelName: 'deepseek-v4-flash',
  apiKey: process.env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: 'https://api.deepseek.com/v1',
  }
})

const mcpClient = new MultiServerMCPClient({
  'my-mcp-server': {
    command: 'node',
    args: ["e:/WROKSPACE/ai/agent/agent_in_action/mcp-demo/my-mcp-server.mjs"]
  }
})

// 获取工具
const tools = await mcpClient.getTools()
const modelWithTools = model.bindTools(tools)

async function runAgentWithTools(query, maxIterations=30) {}