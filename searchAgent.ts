// 引入依赖
import "dotenv/config"
import { TavilySearch } from "@langchain/tavily"// 引入Tavily搜索
import { ChatOpenAI } from "@langchain/openai"// 引入OpenAI模型
import { HumanMessage } from "@langchain/core/messages"// 引入人类消息
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph"// 引入状态图和消息注解
import { ToolNode } from "@langchain/langgraph/prebuilt"// 引入工具节点

// 初始化搜索工具
const tavilyTool = new TavilySearch({maxResults: 3})//maxResults: 3 表示最多返回3条结果
const tools = [tavilyTool]// 初始化工具数组,现在只有一个工具Tavily搜索
const toolNode = new ToolNode(tools)// 初始化工具节点
// 初始化模型配置
const model = new ChatOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  // 配置模型调用,指定基础URL为Deepseek的API地址
  configuration: {
    baseURL: process.env.DEEPSEEK_BASE_URL,
  },
  model: "deepseek-chat",
  temperature: 0,// 温度参数,0表示确定性,1表示随机性
}).bindTools(tools)

// 流程判断函数
const shouldContinue = ({messages}: {messages: typeof MessagesAnnotation.State["messages"]}) => {
  const lastMsg = messages[messages.length - 1]
  return (lastMsg as any).tool_calls?.length ? "tools" : "__end__"// 如果最后一条消息有工具调用,则返回工具节点,否则返回结束节点
}
// 大模型调用节点
const callModel = async (state: typeof MessagesAnnotation.State) => {
  const reply = await model.invoke(state.messages)// invoke 方法调用模型,传入当前状态的消息数组
  return {messages: [reply]}// 返回包含模型回复的新数组
}

// 构建流程图
const graphBuilder = new StateGraph(MessagesAnnotation)
    .addNode("model", callModel)// 添加大模型调用节点
    .addNode("tools", toolNode)// 添加工具节点
    .addEdge("__start__", "model")// 从开始节点到大模型调用节点
    .addConditionalEdges("model", shouldContinue)// 添加条件边,根据shouldContinue函数判断是否使用工具
    .addEdge("tools", "model")// 如果使用工具,则从工具节点返回大模型调用节点

const agentGraph = graphBuilder.compile()// 编译状态图,生成可执行的图
// console.log(agentGraph)

// 启动运行
async function runAgent() {
  const res = await agentGraph.invoke(
    // 调用图,传入初始状态,包含人类消息
    {
      messages: [new HumanMessage({content: "2026年人工智能的发展趋势"})]
    }
  )
  console.log(res.messages[res.messages.length - 1].content)// 打印结果,取最后一条消息的内容
}
runAgent().catch(console.error)