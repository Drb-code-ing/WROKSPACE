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
  model: process.env.OPENAI_API_KEY,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL
  },
  temperature: 0
})

// 日志 中间件 模型调用次数统计
const loggingMiddleware = createMiddleware({

})

const agent = createAgent({
  model,
  tools: [],
  systemPrompt: "你是一个助手。",
  middleware: [
    loggingMiddleware()
  ]
})