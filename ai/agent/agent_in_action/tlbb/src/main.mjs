import 'dotenv/config'
import { parse } from 'path'// 解析路径
import {
  MilvusClient,
  MetricType,
  IndexType,
  DataType,
} from '@zilliz/milvus2-sdk-node'
import {
  OpenAIEmbeddings,
} from '@langchain/openai'
import { EPubLoader } from '@langchain/community/document_loaders/fs/epub'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'

// config
const COLLECTION_NAME = 'ebook'
const VECTOR_DIM = 1024
const CHUNK_SIZE = 500
const EPUB_PATH = './天龙八部.epub'
const ADDRESS =process.env.MILVUS_ADDRESS
const TOKEN=process.env.MILVUS_TOKEN
const BOOK_NAME = parse(EPUB_PATH).name
console.log(parse(EPUB_PATH))

const embedding = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.MODEL_NAME,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
  dimension: VECTOR_DIM
})

// 向量数据库的初始化
const client = new MilvusClient({
  address: ADDRESS,
  token: TOKEN,
})

async function getEmbedding(text) {
  return await embedding.embedQuery(text)
}

async function ensureCollection(bookId) {
  //没有就建立，有就忽略
  try {
    // 检查集合是否存在
    const hasCollection = await client.hasCollection({
      collection_name: COLLECTION_NAME,
    })
    if (!hasCollection.value) {
      console.log('创建集合...')
      await client.createCollection({
        collection_name: COLLECTION_NAME,
        fields: [
          {name: 'id', data_type: DataType.VarChar, max_length: 100, is_primary_key: true},
          {name: 'book_id', data_type: DataType.VarChar, max_length: 100},
          {name: 'book_name', data_type: DataType.VarChar, max_length: 200},
          // 章节编号
          {name: 'chapter_num', data_type: DataType.Int32},
          // 第几个数据切片
          {name: 'index', data_type: DataType.Int32},
          {name: 'content', data_type: DataType.VarChar, max_length: 10000},
          {name: 'vector', data_type: DataType.FloatVector, dim: VECTOR_DIM},
        ]
      })
      console.log('集合创建成功:', hasCollection.value)

      console.log('创建索引...')
      await client.createIndex({
        collection_name: COLLECTION_NAME,
        field_name: 'vector',
        index_type: IndexType.IVF_FLAT,
        metric_type: MetricType.COSINE,
        // IVF_FLAT 建索引参数：先把全部向量聚成 nlist 个簇（倒排桶）。
        // 查询时只会进入最接近的若干簇再精算距离，而不是扫描全库；
        // nlist 越大，桶通常越细，需配合搜索阶段的 nprobe 一起调优。
        params: {
          nlist: 1024,
        }
      })
      // cosine 高维相似度计算  不慢  数据量太大了
      console.log('索引创建成功')
    }

    // 细节捕捉错误
    // 每次要做的
    try {
      await client.loadCollection({
        collection_name: COLLECTION_NAME,
      })
      console.log('集合加载成功')
    } catch (error) {
      console.error('集合已处于加载状态')
    }
  } 
  catch (error) {
    console.error('集合创建失败:', error)
  }
}

async function loadAndProcessEPubStreaming(bookId) {
  try {
    console.log(`\n 开始加载EPUB文件: ${BOOK_NAME}`)
    const loader = new EPubLoader(EPUB_PATH, {
      // 加载后就会按章节生成多个document
      // 内存需求的必然
      splitChapters: true
    })
    const documents = await loader.load()
    console.log(`\n 加载完成，共 ${documents.length} 个章节`)

    const textSplitter = new RecursiveCharacterTextSplitter({
      // 没有传separator，就用默认的 \n 。
      chunkSize: CHUNK_SIZE,
      chunkOverlap: 100,
    })
    let totalInserted = 0// 计数
    const documentLen = documents.length
    for(let chapterIndex = 0; chapterIndex < documentLen; chapterIndex++) {
      // 处理当前章节
      const chapter = documents[chapterIndex]
      const chapterContent = chapter.pageContent
      console.log(`\n 处理章节 ${chapterIndex + 1}/${documentLen}，共 ${chapterContent.length} 字`)
      // 切割章节内容
      const chunks = await textSplitter.splitText(chapterContent)
      console.log(`切割后共 ${chunks.length} 个数据切片`)
      if(chunks.length === 0) {
        console.log(`章节 ${chapterIndex + 1} 为空，跳过`)
        continue
      }
      console.log('生成向量并插入数据库...')
      const insertedCount = await insertChunksBatch(chunks, bookId, chapterIndex + 1)
      totalInserted += insertedCount
      console.log(`已插入 ${insertedCount} 条数据`)
    }

    console.log(`\n 共插入 ${totalInserted} 条数据`)
    console.log('处理完成')
    console.log('='.repeat(80))
    return totalInserted
  } catch (error) {
    console.error('加载EPUB文件失败:', error)
    throw error
  }
}

// 将一批chunk 插入向量数据库
async function insertChunksBatch(chunks, bookId, chapterNum) {
  try {
    // 检查是否有数据
    if(chunks.length === 0) {
      return 0
    }
    const insertData = await Promise.all(
      chunks.map(async (chunk, chunkIndex) => {
        const vector = await getEmbedding(chunk)
        return {
          // 书籍 ID + 章节号 + 章节内切片序号共同定位一个文本块：
          // 同一书不同章节、同一章节不同切片都不会冲突；再次处理同一本书时 ID 仍稳定，
          // 可据此做幂等写入、删除旧切片和定位问题，不必依赖随机 ID。
          id: `${bookId}_${chapterNum}_${chunkIndex}`,
          book_id: bookId,
          book_name: BOOK_NAME,
          chapter_num: chapterNum,
          index: chunkIndex,
          content: chunk,
          vector: vector,
        }
      })
    )
    // 批量插入
    const insertResult = await client.insert({
      collection_name: COLLECTION_NAME,
      data: insertData,
    })
    // 函数的返回结果要有可预测性 一致
    return +insertResult.insert_cnt || 0
  } catch (error) {
    console.error(`插入章节 ${chapterNum} 的数据失败: ${error.message}`)
    throw error
  }
}

const main = async () => {
  try {
    console.log('='.repeat(80))
    console.log('点子书处理程序')
    console.log('='.repeat(80))
    console.log('\n连接Milvus...')
    await client.connectPromise
    console.log('连接Milvus成功')
    const bookId = 1
    // 确保集合建立
    await ensureCollection(bookId)
    // 加载和处理EPUB文件
    // 一遍切割一遍embedding, 一遍插入Milvus
    await loadAndProcessEPubStreaming(bookId)
  } catch (error) {
    console.error(error)
  }
}
main().catch(error => {
  console.log(error)
})

