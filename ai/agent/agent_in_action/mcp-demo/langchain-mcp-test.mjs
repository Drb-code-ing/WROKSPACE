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
const res = await mcpClient.listResources()// 获取所有资源
let resourceContent = ''
for(const [serverName, resources] of Object.entries(res)) {
  for(const resource of resources) {
    const content = await mcpClient.readResource(
      serverName,
      resource.uri
    )
    resourceContent += content[0].text
  }
}
console.log(resourceContent,'----------------------------------')

const modelWithTools = model.bindTools(tools)

async function runAgentWithTools(query, maxIterations=30) {
  const messages = [
    new SystemMessage(resourceContent || '(无资源)'),
    new HumanMessage(query)
  ]
  for(let i = 0; i < maxIterations; i++) {
    console.log(chalk.bgGreen(`正在等待AI思考，第${i+1}轮...`))
    const response = await modelWithTools.invoke(messages)
    messages.push(response)

    if(!response.tool_calls || response.tool_calls.length === 0) {
      console.log(`\n AI 最终回复：\n${response.content}`)
      return response.content
    }

    console.log(chalk.bgBlue(`检测到 ${response.tool_calls.length} 个工具调用`))
    console.log(chalk.bgBlue(`工具调用： ${response.tool_calls.map(t => t.name).join(', ')}`))

    for(const toolCall of response.tool_calls) {
      // find 方法 匹配的第一项，如果找到了，后面不会执行
      // Promise.all 只要一个失败，整体失败，不会等剩下的结果，但是已经发起的异步任务会继续执行
      const foundTool = tools.find(t => t.name === toolCall.name)
      if(foundTool) {
        const toolResult = await foundTool.invoke(toolCall.args)
        // 返回的是纯文本，tool的返回是由上下文相关性，一定要带上 tool_call_id
        messages.push(new ToolMessage({
          content: toolResult,
          tool_call_id: toolCall.id,
        }))
      }
    }
  }
  // 循环次数达到最大，仍然无法回复问题，返回最后一次回复
  return messages[messages.length - 1].content
}

// await runAgentWithTools('查一下用户001的信息')
await runAgentWithTools('my-mcp-server.mjs 的 MCP Server 的使用指南是什么？')
// 关闭MCP 子进程与通信连接, 释放进程资源
// 关闭和MCP Server 的通信连接
// my-mcp-server.mjs 被启动了，手动关闭进程，释放相关资源，避免脚本一直挂着不退出

// node langchain-mcp-test.mjs 会启动进程
// 启动一个子进程child_process
// 子进程连接my-mcp-server.mjs
// 主进程通过stdio 和他们通话
// close() 把这个连接和子进程一起关掉
await mcpClient.close()