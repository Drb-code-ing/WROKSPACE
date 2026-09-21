// ES CRUD
import { Client } from '@elastic/elasticsearch'
 
const client = new Client({
  node: 'http://localhost:9200',
})

const INDEX_NAME = 'travel_journal'

async function createIndex() {
  const exists = await client.indices.exists({
    index: INDEX_NAME,
  })

  if (exists) {
    console.log('索引已存在')
    return
  }
  // 创建索引
  await client.indices.create({
    index: INDEX_NAME,
    mappings: {
      properties: {
        note_title: { type: 'text', analyzer: 'ik_max_word', search_analyzer: 'ik_smart' },
        note_body: { type: 'text', analyzer: 'ik_max_word', search_analyzer: 'ik_smart' },
        tags: { type: 'keyword' },
        mod: { type: 'keyword' },
        priority: { type: 'integer' },
        create_time: { type: 'date' },
        update_time: { type: 'date' },
      },
    },
  })
  console.log('索引创建成功')
}

async function seedData() {
  const now = new Date().toISOString()
  const docs = [
    {
      note_title: '杭州西湖半日游',
      note_body: '早上绕湖慢跑，中午吃片儿川，下午在断桥拍照放松。',
      tags: ['旅行', '周末', '杭州'],
      mood: 'relaxed',
      priority: 2,
      create_time: now,
      update_time: now
    },
    {
      note_title: '城市骑行计划',
      note_body: '周六沿江骑行 20 公里，带上水和简易修车工具。',
      tags: ['运动', '骑行'],
      mood: 'energetic',
      priority: 3,
      create_time: now,
      update_time: now
    },
    {
      note_title: '雨天宅家阅读',
      note_body: '下雨天在家看书，整理本周笔记并做晚餐。',
      tags: ['生活', '阅读'],
      mood: 'calm',
      priority: 1,
      create_time: now,
      update_time: now
    }
  ]
  // flatMap 扁平化数组：每条文档 = 动作行(index) + 数据行
  const operations = docs.flatMap((doc) => [{index: {_index: INDEX_NAME}}, doc])
  // 批量插入
  console.log(operations)
  await client.bulk({
    operations, // 批量操作数组
    refresh: true, // 刷新索引，确保数据立即可见
  })
}

async function main() {
  await createIndex() // 创建索引
  await seedData() // 初始化数据
}
main()
 .catch((e) => {
  // 把真实错误打印出来，方便定位（吞掉错误只能看到一句失败提示）
  console.error('初始化数据失败:', e.message ?? e)
 })