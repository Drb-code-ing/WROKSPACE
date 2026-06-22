// 封装一个多Agent 协作系统 前端 后端 审核
import "dotenv/config";
import { StateGraph, Annotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";

// 初始化模型
const llm = new ChatOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: process.env.DEEPSEEK_BASE_URL,
  },
  modelName: "deepseek-v4-flash",
  temperature: 0,// 温度设置,0表示确定性,1表示随机性
})

// 初始化便签 公共state
const TeamState = Annotation.Root({
  task: Annotation<string>,// 任务描述
  messages: Annotation<{role: string, content: string}[]>({
    reducer: (current, update) => current.concat(update),// 合并新消息到当前消息列表
    default: () => [],// 默认消息列表为空
  }),
  next: Annotation<string>,// 下一个任务
  finalReport: Annotation<string>,// 最终报告内容
})

// 角色映射：自定义角色 → LangChain 标准角色
function mapRole(role: string): string {
  const roleMap: Record<string, string> = {
    supervisor: "system",
    frontend_expert: "assistant",
    backend_expert: "assistant",
    devops_expert: "assistant",
    user: "user",
  }
  return roleMap[role] || "user"
}

// 格式化消息：保留语义标识
function formatMessages(messages: {role: string, content: string}[]) {
  return messages.map(msg => ({
    role: mapRole(msg.role),
    content: `[${msg.role}]: ${msg.content}`,
  }))
}

// ====== Supervisor ====== 监督者
async function supervisor(state: typeof TeamState.State) {
  const systemPrompt = `You are a supervisor managing a development team:
  
  Team members:
  - frontend_expert: UI/UX, React, CSS, component, design
  - backend_expert: API design, database, server logic, auth
  - devops_expert: deployment, CI/CD, infrastructure, scaling

  Your job:
  1. Analyze the user's task
  2. Decide which expert should work next
  3. If enough information has been gathered, respond "FINISH"

  Reply whith ONLY one word:
  - frontend_expert backend_expert devops_expert or FINISH
  `

  const msg = await llm.invoke([
    {role: "system", content: systemPrompt},
    ...formatMessages(state.messages),// 合并所有消息到模型输入（带角色标识）
    {role: "user", content: `[CURRENT_TASK]: ${state.task}\n\n [YOUR INSTRUCTION]: who should work next? Reply ONLY one word.`},// 用户任务描述
  ])

  const decision = msg.content.toString().trim().toLowerCase()
  return {
    next: decision,
    messages: [{role: "supervisor", content: `-> Assigning to ${decision}`}],
  }
}

// ====== 子Agent ======
async function frontendExpert(state: typeof TeamState.State) {
  const msg = await llm.invoke([
    {role: "system", content: "You are a senior frontend engineer. Provide detailed, production-ready frontend solutions. with code examples."},
    {role: "user", content: state.task},
  ])
  return {
    messages: [{role: "frontend_expert", content: msg.content}],
  }
}

async function backendExpert(state: typeof TeamState.State) {
  const msg = await llm.invoke([
    {role: "system", content: "You are a senior backend engineer. Provide detailed API design, database schemas, and server architecture with code examples."},
    {role: "user", content: state.task},
  ])
  return {
    messages: [{role: "backend_expert", content: msg.content}],
  }
}

async function devopsExpert(state: typeof TeamState.State) {
  const msg = await llm.invoke([
    {role: "system", content: "You are a senior devops engineer. Provide deployment strategies, CI/CD configurations, and infrastructure designs."},
    {role: "user", content: state.task},
  ])
  return {
    messages: [{role: "devops_expert", content: msg.content}],
  }
}

// ====== 报告编译 ====== 生成最终报告内容
async function compileReport(state: typeof TeamState.State) {
  const msg = await llm.invoke([
    {role: "system", content: "Synthesize all export inputs into a comprehensive final report. Structure it clearly with sections"},
    ...formatMessages(state.messages),
  ])
  return {
    finalReport: msg.content,
  }
}

// ====== 路由 ======
function supervisorRouter(state: typeof TeamState.State) {
  if(state.next === "finish") return "finish"
  if(["frontend_expert", "backend_expert", "devops_expert"].includes(state.next)) {
    return state.next
  }
  return "finish"// 默认返回 finish 键
}

// 子Agent 干完活 -> 回到 Supervisor
function expertRouter(state: typeof TeamState.State) {
  return "supervisor"
}

// 构建图
const teamWorkflow = new StateGraph(TeamState)
  .addNode("supervisor", supervisor)
  .addNode("frontend_expert", frontendExpert)
  .addNode("backend_expert", backendExpert)
  .addNode("devops_expert", devopsExpert)
  .addNode("compileReport", compileReport)
  .addEdge("__start__", "supervisor")
  .addConditionalEdges("supervisor", supervisorRouter, {
    frontend_expert: "frontend_expert",
    backend_expert: "backend_expert",
    devops_expert: "devops_expert",
    finish: "compileReport",
  })
  // 子Agent 干完活 -> 回到 Supervisor
  .addEdge("frontend_expert", "supervisor")
  .addEdge("backend_expert", "supervisor")
  .addEdge("devops_expert", "supervisor")
  .addEdge("compileReport", "__end__")
  .compile()// 编译状态图

  const result = await teamWorkflow.invoke({
    task: "我要开发一个个人学习网站"
  })
  console.log(result)
