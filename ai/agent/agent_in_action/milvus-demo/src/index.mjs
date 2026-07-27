import 'dotenv/config'
import {
  MilvusClient, // C/S  B/S
  MetricType, // 计算相似度的类型
  IndexType, // 索引类型
  DataType, // 字段数据类型约束
} from '@zilliz/milvus2-sdk-node'
import {
  OpenAIEmbeddings, // OpenAI 嵌入模型，用于将文本转换为向量
} from '@langchain/openai'

const ADDRESS = process.env.MILVUS_ADDRESS
const TOKEN = process.env.MILVUS_TOKEN
const COLLECTION_NAME = 'ai_dairy'
const VECTOR_DIM = 1024

const embedding = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.MODEL_NAME,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
  dimension: VECTOR_DIM,// 向量维度
})

const client = new MilvusClient({
  address: ADDRESS,
  token: TOKEN,
})

const getEmbedding = async (text) => {
  return await embedding.embedQuery(text)
}

async function main() {
  console.log('正在连接 zilliz cloud...')

  const checkHealth = await client.checkHealth()
  if(!checkHealth.isHealthy) {
    console.log('连接失败', checkHealth.reasons)
    return
  }
  console.log('连接成功，集群状态正常')

  await client.createCollection({
    collection_name: COLLECTION_NAME,
    // 字段定义
    fields: [
      {
        name: 'id',
        data_type: DataType.VarChar,
        max_length: 50,
        is_primary_key: true,
      },
      {
        name: 'vector',
        data_type: DataType.FloatVector,
        dim: VECTOR_DIM,// 向量维度
      },
      {
        name: 'content',
        data_type: DataType.VarChar,
        max_length: 5000,
      },
      {
        name: 'date',
        data_type: DataType.VarChar,
        max_length: 50,
      },
      {
        name: 'mood',
        data_type: DataType.VarChar,
        max_length: 50,
      },
      {
        name: 'tags',// 标签
        data_type: DataType.Array,
        element_type: DataType.VarChar,
        // 最大标签数量
        max_capacity: 10,
        // 最大标签长度
        max_length: 50,
      },
    ]
  })
  console.log('集合创建成功')

  // await client.createIndex({
  //   collection_name: COLLECTION_NAME,
  //   field_name: 'vector',// 给向量字段建索引
  //   index_type: IndexType.IVF_FLAT,// 聚簇索引 毫秒级返回
  //   metric_type: MetricType.COSINE
  // })
  console.log('索引创建成功')

  console.log('正在加载集合...')
  await client.loadCollection({
    collection_name: COLLECTION_NAME,
  })
  console.log('集合加载成功')

  const diaryContents = [
             {
               id: 'diary_001',
               content: '今天天气很好，去公园散步了，心情愉快。看到了很多花开了，春天真美好。',
               date: '2026-01-10',
               mood: 'happy',
               tags: ['生活', '散步']
             },
             {
               id: 'diary_002',
               content: '今天工作很忙，完成了一个重要的项目里程碑。团队合作很愉快，感觉很有成就感。',
               date: '2026-01-11',
               mood: 'excited',
               tags: ['工作', '成就']
             },
             {
               id: 'diary_003',
               content: '周末和朋友去爬山，天气很好，心情也很放松。享受大自然的感觉真好。',
               date: '2026-01-12',
               mood: 'relaxed',
               tags: ['户外', '朋友']
             },
             {
               id: 'diary_004',
               content: '今天学习了 Milvus 向量数据库，感觉很有意思。向量搜索技术真的很强大。',
               date: '2026-01-12',
               mood: 'curious',
               tags: ['学习', '技术']
             },
             {
               id: 'diary_005',
               content: '晚上做了一顿丰盛的晚餐，尝试了新菜谱。家人都说很好吃，很有成就感。',
               date: '2026-01-13',
               mood: 'proud',
               tags: ['美食', '家庭']
             }
           ]
  console.log('向量化开始...')
  const diaryData =  await Promise.all(
    // 先转换为promise数组
    diaryContents.map(async (diary) => ({
      ...diary,
      vector: await getEmbedding(diary.content)// 向量化
    }))
  )
  const insertResult = await client.insert({
    collection_name: COLLECTION_NAME,
    data: diaryData,
  })
  console.log('插入数据成功', insertResult.insert_cnt)
}

main().catch(console.error)