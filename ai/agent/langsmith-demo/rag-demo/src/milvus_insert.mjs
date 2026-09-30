import 'dotenv/config'
import { 
  existsSync, 
  readFileSync, 
  readdirSync 
} from 'fs'
import { join } from 'path' // 路径拼接
import { MilvusClient, DataType, IndexType, MetricType } from '@zilliz/milvus2-sdk-node'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters' // 递归文本分割器
import { OpenAIEmbeddings } from '@langchain/openai' // OpenAI 嵌入模型

const COLLECTION_NAME = process.env.COLLECTION_NAME ?? 'rag_docs'
// 项目上线milvus 独立于程序外aliyun 服务
// MilvusClient 自动带上https
const MILVUS_ADDRESS = (process.env.MILVUS_ADDRESS ?? 'localhost:19530').replace(/^https?:\/\//, "")

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL ?? 'text-embedding-v3',
  configuration: {
    baseURL: process.env.OPENAI_API_BASE_URL,
  }
})

const client = new MilvusClient({
  address: MILVUS_ADDRESS,
})


async function loadChunks(dataDir = "./data") {
  if(!existsSync(dataDir)) {
    throw new Error(`dataDir ${dataDir} not exists`)
  }

  // 列出目录下所有文件名，过滤出 .text / .md 结尾的文档文件
  // /.(txt|md)$/：反斜杠转义点号（正则里 . 匹配任意字符）；
  // (txt|md) 分组二选一；$ 锚定结尾，即匹配文件扩展名
  const files = readdirSync(dataDir).filter((f) => /\.(txt|md)$/.test(f))
  if(files.length === 0) {
    throw new Error(`dataDir ${dataDir} not contain any text or md file`)
  }

  const docs = files.map(f => ({
    pageContent: readFileSync(join(dataDir, f), 'utf-8'), // 读取文件内容
    // 其他元数据，如文件名、创建时间等
    metadata: {
      source: f,
    }
  }))

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  })
  return splitter.splitDocuments(docs)
}

async function main() {
  try {
    console.log("connect to milvus...")
    await client.connectPromise
    console.log("connect to milvus success\n")

    const chunks = await loadChunks()
    console.log(chunks)
    // 如果集合存在，先删除
    if((await client.hasCollection({ collection_name: COLLECTION_NAME })).value) {
      await client.dropCollection({ collection_name: COLLECTION_NAME })
      console.log(`drop collection ${COLLECTION_NAME} success`)
    }

    const vectors = await embeddings.embedDocuments(chunks.map(c => c.pageContent))
    const dim = vectors[0].length
    await client.createCollection({
      collection_name: COLLECTION_NAME,
      fields: [
        {
          name: "langchain_primaryid",
          is_primary_key: true,
          data_type: DataType.Int64,
          autoID: true
        },
        {name: "langchain_vector", data_type: DataType.FloatVector, dim: dim,},
        {name: "langchain_text", data_type: DataType.VarChar, max_length: 8000},
        {name: "source", data_type: DataType.VarChar, max_length: 256},
      ]
    })
    console.log(`create collection ${COLLECTION_NAME} success`)
    console.log("\n Creating index...")
    await client.createIndex({
      collection_name: COLLECTION_NAME,
      field_name: "langchain_vector", // 要建索引的向量字段（index_name 只是索引的名字）
      index_name: "langchain_vector_idx",
      index_type: IndexType.IVF_FLAT,
      metric_type: MetricType.L2,
      params: {
        nlist: 128,
      }
    })
    console.log("create index success")
    // 加载集合
    await client.loadCollection({collection_name: COLLECTION_NAME})

    const data = chunks.map((chunk, i) => ({
      langchain_text: chunk.pageContent,
      source: chunk.metadata.source,
      langchain_vector: vectors[i],
    }))

    const result = await client.insert({
      collection_name: COLLECTION_NAME,
      data: data,
    })
    console.log(`Insert ${data.length} docs success`)
  } catch(error) {
    console.error(error)
    process.exit(1)
  }
}

main()