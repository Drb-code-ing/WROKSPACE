import {
  MilvusClient,
  // 索引类型
  // Milvus 存的是高维向量
  // 没有索引时，每次查询都要把库里的向量和查询的向量逐一算相似度, O(n)
  // 数据量大了，慢的没法用
  // 字典 拼音 偏旁的索引，迅速减少查询范围
  // 图书馆，找一本三体 没有索引，每本都要翻一下。
  // 文学馆 | 小说 | 科幻
  // IVF_FLAT 聚簇索引 毫秒级返回
  IndexType,
  // 计算相似度的类型
  MetricType,
} from '@zilliz/milvus2-sdk-node'
import 'dotenv/config'

const ADDRESS = process.env.MILVUS_ADDRESS
const TOKEN = process.env.MILVUS_TOKEN

async function main() {
  const client = new MilvusClient({
    address: ADDRESS,
    token: TOKEN
  })
  console.log('正在连接 zilliz cloud...')

  const checkHealth = await client.checkHealth()
  if(!checkHealth.isHealthy) {
    console.log('连接失败', checkHealth.reasons)
    return
  }
  console.log('连接成功，集群状态正常')

  // mysql table 集合
  const COLLECTION_NAME = 'test'
  const DIMENSION = 4// 维度
  try {
    // await client.createCollection({
      // collection_name: COLLECTION_NAME,
      // dimension: DIMENSION,
      // auto_id: true,// 自动创建 id 字段
    // })
    // console.log('集合创建成功')
    // 创建索引 让查询更快
    // await client.createIndex({
      // collection_name: COLLECTION_NAME,
      // field_name: 'vector',// 给某字段建索引
      // index_type: IndexType.AIFFlat,
      // metric_type: MetricType.COSINE
    // })
    // console.log('索引创建成功')

    // 插入数据
    // const data = [
      // row field
      // 相比于mysql 宽松一些，可以在插入数据时建立字段
      // {vector: [0.1, 0.2, 0.3, 0.4], content: '这是第一条数据'},
      // {vector: [0.5, 0.6, 0.7, 0.8], content: '这是第二条数据'},
    // ]
    // const insertRes = await client.insert({
      // collection_name: COLLECTION_NAME,
      // data
    // })
    // console.log('插入数据成功')

    const searchRes = await client.search({
      collection_name: COLLECTION_NAME,
      data: [[0.1, 0.1, 0.3, 0.4]],
      limit: 2,
      output_fields: ['content']
    })
    console.log('查询结果', JSON.stringify(searchRes.results, null, 2))
  } catch (err) {
    console.log('集合可能存在或创建失败', err.message)
  }
}

main().catch(console.error)