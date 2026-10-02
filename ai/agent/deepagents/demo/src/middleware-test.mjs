// 中间件
import "dotenv/config"
import { z } from "zod"
import { ChatOpenAI } from "@langchain/openai"
import {
  createAgent,
  createMiddleware,
  HumanMessage,
  AIMessage
} from "langchain"

const model = new ChatOpenAI({
  model: process.env.OPENAI_MODEL ?? 'qwen-plus',
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL
  },
  temperature: 0
})

// 日志 中间件 模型调用次数统计
// 用户 request agent  中间 生成 response
// middleware 是Agent 的一部分 不影响Agent 运行的情况下添加一些额外的功能
const loggingMiddleware = createMiddleware({
  name: "loggingMiddleware",
  stateSchema: z.object({
    modelCallCount: z.number().default(0)
  }),
  // 监听Agent 的全生命周期
  beforeAgent: (state) => {
    console.log("\n[Login] Agent 开始运行 消息数：", state.messages.length)
  },
  beforeModel: (state) => {
    console.log("\n[Login] 即将调用模型 当前消息数：", state.messages.length)
    console.log(`\n已调用模型 ${state.modelCallCount} 次`)
    // 钩子返回部分 state 会被合并回去，实现计数累加
    return { modelCallCount: state.modelCallCount + 1 }
  },
  afterModel: (state) => {
    const last = state.messages.at(-1)
    const preview = typeof last === 'string' ? last.content.slice(0, 800) : JSON.stringify(last?.content)?.slice(0, 800)
    console.log("\n[Login] 模型回答预览：", preview)
  },
  afterAgent: (state) => {
    console.log("\n[Login] Agent 运行结束 累计调用模型次数：", state.modelCallCount)
  }
})

// 用户问题  加上上下文  回答
const addContextMiddleware = createMiddleware({
  name: "AddContextMiddleware",
  warpModelCall: async(request, handler) => {
    console.log("[Add Context] 注入格外的system上下文")
    return handler({
      ...request,
      // 覆盖 systemMessage
      systemMessage: request.systemMessage.concat(
        "\n\n 请用一句话简洁回答"
      )
    })
  }
})

const blockedContentMiddleware = createMiddleware({
  name: "BlockedContentMiddleware",
  beforeModel: {
    canJumpTo: ["end"],
    hook: (state) => {
      const last = state.messages.at(-1)
      const text = typeof last === 'string' ? last.content : String(last?.content ?? "")
      if(text.includes("BLOCKED")) {
        console.log("[Blocked] 检测到 BLOCKED 关键词，短路结束")
        return {
          messages: [new AIMessage("该请求已被 BLOCKED 关键词拦截，无法继续执行")],
          jumpTo: "end"
        }
      }
    }
  }
})

const agent = createAgent({
  model,
  tools: [],
  systemPrompt: "你是一个助手。",
  middleware: [
    loggingMiddleware,
    addContextMiddleware,
    blockedContentMiddleware
  ]
})

for(const text of [
  "用中文说：langchain createAgent 中的middleware 是什么？"
]) {
  // invoke 返回的是完整 state 对象（含 messages 和中间件扩展字段），不是数组
  const result = await agent.invoke({
    messages: [new HumanMessage(text)]
  })
}
