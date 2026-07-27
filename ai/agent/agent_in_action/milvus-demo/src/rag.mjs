import 'dotenv/config'
import {
  MilvusClient, // c|s  B|C 架构
  IndexType,
  MetricType , // 相似度求方法
  DataType, // 字段数据类型约束
} from '@zilliz/milvus2-sdk-node'
import {
  OpenAIEmbeddings,
  ChatOpenAI
} from '@langchain/openai'

const ADDRESS =process.env.MILVUS_ADDRESS
const TOKEN=process.env.MILVUS_TOKEN
const COLLECTION_NAME = 'ai_dairy';
const VECTOR_DIM=1024; 

const embedding = new OpenAIEmbeddings({
 apiKey: process.env.OPENAI_API_KEY,
 model: process.env.MODEL_NAME,
 configuration: {
  baseURL: process.env.OPENAI_BASE_URL,
 },
 dimension: VECTOR_DIM,
})
// 创建 Milvus 客户端
const client =new MilvusClient({
    address: ADDRESS ,
    token: TOKEN
})

const model = new ChatOpenAI({
  temperature: 0.1,
  model: 'deepseek-v4-pro',
  apiKey: process.env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: process.env.DEEPSEEK_BASE_URL,
  },
})

async function retrieveRelevantDailies(question, topK) {
  try {
    const questionEmbedding = await embedding.embedQuery(question)
    const searchResults = await client.search({
      collection_name: COLLECTION_NAME,
      vector: questionEmbedding,
      limit: topK,
      metric_type: MetricType.COSINE,
      output_fields: ['id', 'content', 'date', 'mood', 'tags'],
    })
    return searchResults.results
  } catch (err) {
    console.error('检索相关日记失败', err)
  }
}

async function answerDairyQuestion(question, topK) {
  try {
    console.log('='.repeat(80))
    console.log(`问题: ${question}`)
    console.log('='.repeat(80))
    // rag 模块化

    console.log('检索相关日记')
    const retrievedDailies = await retrieveRelevantDailies(question, topK)
    if(retrievedDailies.length === 0) {
      console.log('没有找到相关日记')
      return
    }

    retrievedDailies.forEach((daily, i) => {
      console.log(`日记${i + 1} 相似度: ${daily.score.toFixed(4)}\n 内容: ${daily.content}`)
    })
    // 准备上下文
    const context = retrievedDailies.map((daily, i) => `
    [日记 ${i + 1}]
    日期: ${daily.date}
    心情: ${daily.mood}
    标签: ${daily.tags?.join(', ')}
    内容: ${daily.content}
    `).join('\n\n---\n\n')

    const prompt = `你是一个温暖贴心的AI 日记助手，基于用户的日记内容回答问题。用亲切自然的语言。
    请根据以下日记内容回答问题: ${context}
    问题: ${question}
    回答要求：
    1. 如果日记中有相关信息，请结合日记内容给出详细、体贴的回答。
    2. 可以总结多篇日记的内容，找出共同点或趋势。
    3. 如果日记中没有相关信息，请温和告知用户。
    4. 用第一人称“你”来称呼日记的作者。
    5. 回答要有同理心，让用户感到被理解和关心。
    `
    console.log('[AI 回答：]')
    const response = await model.invoke(prompt)
    console.log(response.content)
  } catch (err) {
    console.error('回答问题失败', err)
  }
}


async function main() {
  try {
    console.log('正在连接 zilliz cloud...')
    await client.connectPromise // 先握手
    console.log('连接成功，集群状态正常')
    await answerDairyQuestion('我最近做了什么让我们感到快乐的事?', 2)

   } catch (err) {
    console.error(err)
  }
}
main()