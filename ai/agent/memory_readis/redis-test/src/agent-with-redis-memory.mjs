import "dotenv/config"
import Redis from 'ioredis'
import * as readline from "node:readline/promises"
import { stdin, stdout } from "node:process"
import { ChatOpenAI } from "@langchain/openai";
import {
  createAgent, HumanMessage, summarizationMiddleware
} from "langchain";
import {
  mapChatMessagesToStoredMessages, // 把前端传过来的消息转换为存储在redis中的格式
  mapStoredMessagesToChatMessages, // 把存储在redis中的消息转换为前端需要的格式
} from '@langchain/core/messages';

const REDIS_HOST = process.env.REDIS_HOST ?? 'localhost';
const REDIS_PORT = Number(process.env.REDIS_PORT) ?? 6379;
const REDIS_DB = Number(process.env.REDIS_DB ?? 0);
const MEMORY_TTL = Number(process.env.MEMORY_TTL_SECONDS ?? 1800);
const KEY_PREFIX = process.env.MEMORY_KEY_PREFIX ?? "agent:short_memory";
const SESSION_ID = process.env.MEMORY_SESSION_ID ?? "demo_user_001";

const summaryPrompt = `
你是对话摘要助手。请用中文总结以下对话，包含：
1. 讨论的主要话题
2. 用户提到的重要事实（姓名、偏好、日期等，务必保留原文信息）
3. 继续对话所需的关键上下文

保持简洁、不要编造、不要遗漏用户明确说过的信息。

待摘要的对话：
{messages}

摘要：`

class RedisMessageStore {
  constructor({redis, keyPrefix, ttlSeconds}) {
    this.redis = redis;
    this.keyPrefix = keyPrefix;
    this.ttlSeconds = ttlSeconds;
  }

  messagesKey(sessionId) {
    return `${this.keyPrefix}:${sessionId}:messages`;
  }

  async loadMessages(sessionId) {
    const raw = await this.redis.get(this.messagesKey(sessionId));
    if (!raw) return [];
    return mapStoredMessagesToChatMessages(JSON.parse(raw))
  }

  async saveMessages(sessionId, messages) {
    const payload = JSON.stringify(mapChatMessagesToStoredMessages(messages));
    await this.redis.set(this.messagesKey(sessionId), payload, 
    'EX', this.ttlSeconds);
  }

  async clear(sessionId) {
    await this.redis.del(this.messagesKey(sessionId));
  }
  // 获取过期时间
  async ttl(sessionId) {
    return await this.redis.ttl(this.messagesKey(sessionId));
  }
}

const model = new ChatOpenAI({
  model: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
  temperature: 0,
})

const agent = createAgent({
  model,
  tools: [],
  systemPrompt: "你是会话助手，记住用户提到的关键事实，中文简短回答。若消息中有对话摘要，请据此对话。",
  middleware: [
    summarizationMiddleware({
      model,
      summaryPrompt,
      trigger: { messages: 8 },
      keep: { messages: 4 },
    }),
  ],
})

const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  db: REDIS_DB,
})
// store 用于存储和检索记忆
const store = new RedisMessageStore({
  redis,
  keyPrefix: KEY_PREFIX,
  ttlSeconds: MEMORY_TTL,
})

async function invokeWithMemory(agent, store, sessionId, userText) {
  // 加载历史消息
  const history = await store.loadMessages(sessionId)
  const result = await agent.invoke(
    { messages: [...history, new HumanMessage(userText)] },
    { recursionLimit: 30 }, // 递归调用次数限制
  )
  console.log(result)
  await store.saveMessages(sessionId, result.messages)
  const ttl = await store.ttl(sessionId)
  console.log(`记忆过期时间：${ttl} 秒`)
  return result
}

console.log("输入 exit / quit / :q 退出 /clear 清除记忆\n")
// 读取用户输入
const rl = readline.createInterface({input: stdin, output: stdout})
let prevCount = (await store.loadMessages(SESSION_ID)).length

try {
  while(true) {
    const userText = (await rl.question("你：")).trim()
    if(!userText) continue
    if(["exit", "quit", ":q"].includes(userText.toLowerCase())) break

    if(userText === "/clear") {
      await store.clear(SESSION_ID)
      prevCount = 0
      console.log("记忆已清除")
      continue
    }

    // 调用agent
    const { messages } = await invokeWithMemory(agent, store, SESSION_ID, userText)
    console.log(messages)
    console.log("\n 助手:", messages.at(-1)?.content)
    console.log(`当前记忆长度：${messages.length} 条消息`)

  }
} catch (error) {
  console.error("读取用户输入失败:", error)
} finally {
  rl.close()
  await redis.quit()
}