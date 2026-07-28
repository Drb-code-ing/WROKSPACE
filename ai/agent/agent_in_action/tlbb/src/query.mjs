import 'dotenv/config'
import {
  MilvusClient, // c|s  B|C 架构
  IndexType,
  MetricType , // 相似度求方法
  DataType, // 字段数据类型约束
} from '@zilliz/milvus2-sdk-node'
import {
  OpenAIEmbeddings,
} from '@langchain/openai'

const ADDRESS =process.env.MILVUS_ADDRESS
const TOKEN=process.env.MILVUS_TOKEN
const COLLECTION_NAME = 'ebook'
const VECTOR_DIM=1024

const embedding = new OpenAIEmbeddings({
 apiKey: process.env.OPENAI_API_KEY,
 model: process.env.MODEL_NAME,
 configuration: {
  baseURL: process.env.OPENAI_BASE_URL,
 },
 dimension: VECTOR_DIM,
})
const client =new MilvusClient({
    address: ADDRESS ,
    token: TOKEN
})
const getEmbedding = async (text) => {
  return await embedding.embedQuery(text)
}


async function main() {
  try {
    console.log('连接Milvus...')
    await client.connectPromise
    console.log('连接Milvus成功\n')

    await client.loadCollection({
      collection_name: COLLECTION_NAME,
    })

    const query = '段誉会什么武功?'
    const queryVector = await getEmbedding(query)
    const searchResult = await client.search({
      collection_name: COLLECTION_NAME,
      vector: queryVector,
      limit: 3,
      metric_type: MetricType.COSINE,
      output_fields: ['id', 'book_id', 'chapter_num', 'index', 'content']
    })
    // SDK 返回的是包含 results 数组的对象，真正的命中列表在 searchResult.results。
    searchResult.results.forEach((item, index) => {
      console.log(`
        ${index + 1}.[Score: ${item.score.toFixed(4)}]\n
        ID: ${item.id}\n
        Book ID: ${item.book_id}\n
        Content: ${item.content}\n
      `)
    })
  } catch (error) {
    console.error('查询失败:', error)
    throw error
  }
}
main().catch(error => {
  console.error('查询失败:', error)
})
