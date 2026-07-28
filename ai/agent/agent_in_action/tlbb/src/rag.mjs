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

const getEmbedding = async (text) => {
  return await embedding.embedQuery(text)
}

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

async function retrieveRelevantContent(question, topK) {
  try {
    const queryVector = await getEmbedding(question)
    const searchResult = await client.search({
      collection_name: COLLECTION_NAME,
      vector: queryVector,
      limit: topK,
      metric_type: MetricType.COSINE,
      output_fields: ['id', 'book_id', 'chapter_num', 'index', 'content'],
    })
    return searchResult.results
  } catch (error) {
    console.error('检索相关内容失败:', error)
    return []
  }
}

async function answerEbookQuestion(question, topK) {
  try {
    const retrievedContent = await retrieveRelevantContent(question, topK)
    if(retrievedContent.length === 0) {
      console.log('未检索到相关内容')
      return '抱歉，我没有找到相关的《天龙八部》内容。'
    }
    const context = retrievedContent.map((item, inde) => `
    [片段${inde+1}]
    章节: 第${item.chapter_num}章
    内容: ${item.content}
    `).join('\n\n----\n\n')

    const prompt = `
    你是一个专业的《天龙八部》小说助手。
    基于小说回答问题，用准确详细的语言。
    请根据以下小说片段内容回答问题：
    ${context}
    用户问题：${question}

    回答要求：
    1. 如果片段中有相关信息，请结合小说内容给出详细准确的回答。
    2. 可以综合多个片段的内容提供完整的答案。
    3. 如果片段中没有修改信息，请如实告诉用户。
    4. 回答要准确，符合小说的情节和任务设定。
    5. 可以引用原文内容来支持你的回答。
    AI 助手的回答：
    `
    const response = await model.invoke(prompt)
    return response.content
  } catch (error) {
    console.error('回答问题失败:', error)
    return ''
  }
}

async function main() {
  try {
    await client.connectPromise
    try {
      await client.loadCollection({
        collection_name: COLLECTION_NAME,
      })
      console.log('集合加载成功')
    } catch (error) {
      console.error('加载集合失败:', error)
      return
    }
    const answer = await answerEbookQuestion('鸠摩智会什么武功?', 5)
    console.log(answer)
  } catch (error) {
    console.error('主程序失败:', error)
    return
  }
}
main().catch(error => console.error('主程序失败:', error))
