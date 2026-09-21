import { Client } from '@elastic/elasticsearch'
 
const client = new Client({
  node: 'http://localhost:9200',
})

const INDEX_NAME = 'travel_journal'

// 新增文档
async function createDocument() {
  const now = new Date().toISOString()
  const res = await client.index({
    index: INDEX_NAME,
    document: {
      note_title: '夜跑复盘',
      note_body: '今天夜跑5公里，配速稳定，结束后做了拉伸',
      tags: ['运动', '夜跑'],
      mood: 'focused',
      priority: 2,
      create_time: now,
      update_time: now
    }
  })
  console.log(`新增成功，文档ID: ${res._id}`)
  return res._id
}

// 查询文档
async function getDocument(docId) {
  const res = await client.get({
    index: INDEX_NAME,
    id: docId
  })
  console.log('查询结果:', res._source)
}

async function updateDocument(docId) {
  await client.update({
    index: INDEX_NAME,
    id: docId,
    doc: {
      note_body: '今天夜跑6公里，状态不错，拉伸后恢复很快。',
      tags: ['运动', '夜跑', '训练'],
      update_time: new Date().toISOString()
    },
    refresh: true
  })
  console.log('更新成功')
}

// 搜索文档
async function searchDocument(docId) {
  const res = await client.search({
    index: INDEX_NAME,
    query: {
      match: {
        note_body: {
          query: '夜跑训练',
          analyzer: 'ik_smart' // 查询时，使用粗索引去匹配
        }
      }
    }
  })
  const rows = res.hits.hits.map(item => ({
    id: item._id,
    ...item._source,
  }))
  console.log('搜索结果:', rows)
}

async function main() {
  // const docId = await createDocument()
  // console.log(docId)
  const docId = '0Amww6ABB4Fe370xMku6'
  await getDocument(docId)
  await updateDocument(docId)
  await searchDocument(docId)
}
main()
 .catch(console.error)