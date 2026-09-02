import 'dotenv/config'
import { 
  OpenAIEmbeddings,
  ChatOpenAI
} from '@langchain/openai'
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history'
import { MilvusClient, MetricType } from '@zilliz/milvus2-sdk-node'
import {
  HumanMessage,
  SystemMessage
} from "@langchain/core/messages"

const COLLECTION_NAME = 'conversations' // 集合
const VECTOR_DIM = 1024 // 维度

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.API_KEY,
  model: 'text-embedding-v3',
  configuration: {
    baseURL: process.env.API_BASE_URL
  },
  dimension: VECTOR_DIM
})

async function getEmbedding(text) {
  const result = await embeddings.embedQuery(text)
  return result
}

const model = new ChatOpenAI({
  modelName:process.env.MODEL_NAME,
  apiKey: process.env.API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.API_BASE_URL,
  }
})

const client = new MilvusClient({
  address: 'localhost:19530'
})

async function retrievalRelevantConversations(query, k) {
  try {
    const queryVector = await getEmbedding(query) // embedding
    const searchResult = await client.search({
      collection_name: COLLECTION_NAME,
      vector: queryVector,
      metric_type: MetricType.COSINE,
      limit: k,
      output_fields: ['id', 'content', 'round', 'timestamp'],
    })
    return searchResult.results
  } catch (err) {
    console.error('检索相关历史对话失败:', err)
    return []
  }
}

async function retrievalMemoryDemo() {
  try {
    console.log('连接到Milvus...')
    await client.connectPromise
    console.log('已连接\n')
  } catch (error) {
    console.error('连接Milvus失败:', error)
    return
  }
}
retrievalMemoryDemo()

// 当前会话的history 实例
const history = new InMemoryChatMessageHistory()
const conversations = [
  { input: "我之前提到的机器学习项目进展如何？" },
  { input: "我周末进场做什么？" },
  { input: "我的职业是什么？" }
]

for(let i = 0; i < conversations.length; i++) {
  const { input } = conversations[i]
  const userMessage = new HumanMessage(input)

  console.log(`\n 第${i+1}轮对话`)
  console.log(`用户: ${input}`)
  console.log(`\n [检索相关历史对话]`)
  const retrievedConversations = await retrievalRelevantConversations(input, 2)
  // milvus 检索历史对话
  if(retrievedConversations.length === 0) {
    console.log('没有检索到相关历史对话')
    continue
  }
  const relevantHistory = retrievedConversations
    .map((conv, idx) => {
      return `[历史对话 ${idx+1}]
        轮次：${conv.round}
        内容：${conv.content}
      `
    }).join('\n\n--------\n\n')
  console.log(relevantHistory, '-------------')

  const contextMessage = relevantHistory ? 
    [new HumanMessage(`相关历史对话：\n ${relevantHistory}\n\n 用户问题：${input}`)]
    : [userMessage]
  const response = await model.invoke(contextMessage)
  console.log(response.content)

  await history.addMessage(userMessage) // 单条消息用 addMessage，addMessages 要传数组
  await history.addMessage(response)
  // 会话 持久化Milvus
  const conversationText = `用户：${input}\n助手：${response.content}`
  const convId = `conv_${Date.now()}_${i+1}` // 时间 + i 唯一会话ID
  const convVector = await getEmbedding(conversationText)

  try {
    await client.insert({
      collection_name: COLLECTION_NAME,
      data: [{
        id: convId,
        content: conversationText,
        round: i + 1,
        vector: convVector,
        timestamp: new Date().toISOString(),
      }],
    })
    console.log(`插入会话 ${convId} 成功`)
  } catch(err) {
    console.error('插入会话失败:', err)
  }
}
