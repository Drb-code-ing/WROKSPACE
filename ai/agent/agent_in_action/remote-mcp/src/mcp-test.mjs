import 'dotenv/config';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { ChatOpenAI } from '@langchain/openai';
import chalk from 'chalk';
import {
    HumanMessage,
    SystemMessage,
    ToolMessage
} from '@langchain/core/messages';

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
  },
  'amap-maps': {
    transport: 'http',
    url: 'https://mcp.amap.com/mcp?key=af632f22616ad9caf827ccac6b33a6f3',
  },
  'chrome-devtools': {
    command: 'npx',
    args: ['-y', 'chrome-devtools-mcp@latest'],
  },
  filesystem: {
    command: 'npx',
    args: [
      '-y',
      '@modelcontextprotocol/server-filesystem',
      'e:/WROKSPACE/ai/agent/agent_in_action/remote-mcp',
    ],
  },
})

const tools = await mcpClient.getTools()
console.log(tools)
const modelWithTools = model.bindTools(tools)

async function runAgentWithTools(query, maxIterations = 30) {
  const messages = [
    new HumanMessage(query)
  ]

  for(let i = 0; i < maxIterations; i++) {
    console.log(chalk.blue(`第${i + 1}次迭代`))
    const response = await modelWithTools.invoke(messages)
    messages.push(response)

    if(!response.tool_calls || response.tool_calls.length === 0) {
      console.log(chalk.bgRed(`AI回答: ${response.content}`))
      return response.content
    }

    console.log(chalk.bgBlue(`工具调用：${response.tool_calls.map(t => t.name).join(', ')}`))

    for(const toolCall of response.tool_calls) {
      const foundTool = tools.find(t => t.name === toolCall.name)
        if(foundTool) {
          let contentStr
          try {
            const toolResult = await foundTool.invoke(toolCall.args)
            // mcp tool 返回一般字符串
            // haiyoukeneng 处理对象
            if(typeof toolResult === 'string') {
              contentStr = toolResult
              // str
              // filesystem {text}
            } else if (toolResult && toolResult.text) {
              contentStr = toolResult.text
              // str
            }
          } catch (error) {
            contentStr = `工具 ${toolCall.name} 调用失败：${error.message}`
          }
          messages.push(new ToolMessage({
            content: contentStr,
            tool_call_id: toolCall.id,
          }))
        }
    }
  }

  return messages[messages.length - 1].content
}

await runAgentWithTools('北京南站附近的酒店，最近的 3 个酒店，拿到酒店图片，打开浏览器，展示每个酒店的图片，每个 tab 一个 url 展示，并且在把那个页面标题改为酒店名')

await mcpClient.close()
