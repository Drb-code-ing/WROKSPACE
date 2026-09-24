// hybrid 混合检索
// 例如 ssr 水合 nextjs
import dotenv from 'dotenv'
import { Client } from '@elastic/elasticsearch'
import { Document } from '@langchain/core/documents'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { Milvus } from '@langchain/community/vectorstores/milvus'
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai'
import { Annotation, END, START, StateGraph } from '@langchain/langgraph'
import DashscopeRerank from '../rerank/dashscope-rerank.mjs'
import {
  augmentQuery,
  QueryAugmentSchema,
  retrievalQueryString
} from './query-augment.mjs'

// 显式指向项目根的 .env：在哪个目录运行都能加载到密钥（src/rag/ 的上一级再上一级）
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const INDEX = 'life_notes'
const esClient = new Client({ node: "http://localhost:9200"})
const embeddings = new OpenAIEmbeddings({
    model: process.env.MODEL_NAME, // 必须与灌库时一致（text-embedding-v4），否则向量空间对不上
    apiKey: process.env.OPENAI_API_KEY,
    configuration: {
      baseURL: process.env.OPENAI_BASE_URL, // 硬编码 dashscope 公网地址 + ws- 专用 key 会 401
    }
})

const milvus = await Milvus.fromExistingCollection(embeddings, {
  url: "http://localhost:19530",
  collectionName: INDEX,
  textField: "doc_text",
  vectorField: "embedding",
})

const rerank = new DashscopeRerank({
  apiKey: process.env.OPENAI_API_KEY, // .env 没有 DASHSCOPE_API_KEY，rerank 用的就是这个 key（test.mjs 同款）
  model: 'qwen3-rerank',
  topN: 3,
  baseUrl: 'https://dashscope.aliyuncs.com/api/v1/services/rerank/text-rerank/text-rerank', // 注意构造参数是 baseUrl 不是 baseURL
})

const chatModel = new ChatOpenAI({
  model: process.env.LLM_MODEL_NAME ?? "deepseek-v4-flash", // ws- 端点是嵌入模型专用部署，跑不了 qwen-turbo；deepseek 是已验证可用的对话模型
  temperature: 0.2,
  configuration: {
    baseURL: process.env.DEEPSEEK_BASE_URL,
  },
  apiKey: process.env.DEEPSEEK_API_KEY
})


// 混合检索状态
const HybirdRetrievalState = Annotation.Root({
  query: Annotation(),
  queryAugmentation: Annotation(), // 查询扩展
  esHits: Annotation(), // Elasticsearch 检索结果
  milvusHits: Annotation(), // Milvus 检索结果
  merged: Annotation(), // 合并结果
  topDocuments: Annotation(), // 顶部文档
  answer: Annotation(),
})

// 从 Elasticsearch 检索结果中提取文档, 拼接字符串
function docFromEsHit(hit) {
  const s = hit._source ?? {}
  const text = [s.note_title ?? s.title, s.note_body ?? s.content]
    .filter(Boolean)
    .join('\n')

  return new Document({
    pageContent: text,
    metadata: {
      id: hit._id,
      source: 'es', ...s,
    }
  })
}

// 从文档数组中按 id 去重
function dedupeDocsById(docs) {
  const seen = new Set()
  const output = []
  for(const d of docs ?? []) {
    if(!d?.pageContent) continue
    const id = d.metadata.id != null ? String(d.metadata.id).trim() : ''
    if(!id) continue
    if(seen.has(id)) continue
    seen.add(id)
    output.push(d)
  }
  return output
}

// 合并的函数
// id mysql milvus es 关联
function merge(esDocs, milvusDocs) {
  const combinded = [...(esDocs ?? []), ...(milvusDocs ?? [])]
    .filter(d => d?.pageContent)

  return dedupeDocsById(combinded) // 按 id 去重
}

// 调试函数
function printDocs(label, docs) {
  console.log(`\n=== ${label} (${docs?.length ?? 0} 条) ===\n`)
  for(let i = 0; i < (docs ?? []).length; i++) {
    const d = docs[i]
    // g 是全局正则表达式，替换所有匹配项
    const preview = (d.pageContent ?? '').slice(0, 200).replace(/\n/g, ' ')
    console.log(`[${i} ${preview} ${d.pageContent?.length > 200 ? "..." : ""}]`)
    console.log(`metadata:`, d.metadata ?? {})
  }
}

function printQueryRewrite(original, augmentation) {
  const qs = augmentation.queries ?? []
  const forRetrieval = retrievalQueryString(original, augmentation) // 用于检索的查询
  console.log(`\n---查询扩展(LLM 生成 ${qs.length} 条检索句)---\n`)
}

// 格式化消息内容
// 用于处理模型返回的字符串或对象
function stringifyMessageContent(content) {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return String(content ?? "")
  return content.map(c => 
    typeof c === 'string' ? c : typeof c?.text === "string" ? c.text : ""
  ).join("")
}

// 格式化文档数组为上下文字符串
function formatDocsAsContext(docs) {
  return (docs ?? []).map((d, i) => {
    const meta = d.metadata ?? {}
    const src = meta.source ?? 'unknown' // 来源
    const id = meta.id != null ? String(meta.id).trim() : ''
    const head = id ? `[${i + 1}] id=${id} ${src ? `source=${src}` : `[${i + 1}]`}` : `[${i + 1}]`
    return `${head}\n${d.pageContent ?? ''}`
  }).join("\n\n---\n\n")
}

const ANSWER_PROMPT = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是阅读用户[生活笔记]知识库并作回答的助手。
      规则：
      - 只根据下方[检索片段] 推断答案； 片段里没有的信息不要编造。
      - 若片段不足以回答问题， 明确说明 [笔记里没提到], 并可给出一句保守建议。
      - 回答简洁有条理，可使用简短列表， 口吻自然中文。
    `
  ],
  [
    "human",
    `用户问题: {query}
      检索片段: {context}
    `
   ]
])

const NO_CONTEXT_PROMPT = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是阅读用户[生活笔记]知识库并作回答的助手。当前没有检索到任何片段。
    请用一两句话说明无法从笔记中回答，并礼貌询问用户是否换一个说法或补充关键词。
    `
  ],
  [
    "human",
    `用户问题: {query}`
  ]
])

// 编译混合检索图
export function compileHybridRetrievalGraph(esClient, milvus, reranker, chatModel) {
  const ES_K = 15
  const MILVUS_K = 15
  return new StateGraph(HybirdRetrievalState)
  // 查询扩展
    .addNode("query_augment", async(state) => ({
      queryAugmentation: await augmentQuery(chatModel, state.query ?? ''),
    }))
    // Elasticsearch 检索
    .addNode("es_recall", async(state) => {
      const qs = retrievalQueryString(state.query, state.queryAugmentation)
      const n = Math.max(1, qs.length) // 至少检索 1 条
      const kEach = Math.max(2, Math.ceil(ES_K / n))
      // 并行检索
      // 每个检索句检索 kEach 条
      const batches = await Promise.all(
        // promise 数组
        qs.map(q => 
          esClient.search({
            index: INDEX,
            size: kEach,
            query: {
              // 多字段检索
              multi_match: {
                query: q,
                // bm25 标题匹配加权重
                fields: ['note_title^2', 'note_body', 'title', 'content'],
                // 优先取单字段最高分
                type: 'best_fields',
                analyzer: "ik_smart"
              }
            }
          })
        )
      )
      console.log(batches, '--------------')
      // hits -> Document -> 扁平化 -> 去重
      const flat = batches.flatMap(b => (b.hits?.hits?.map(docFromEsHit) ?? []))

      return {
        esHits: dedupeDocsById(flat) // 按 id 去重后返回
      }
    })
    // Milvus 检索
    .addNode("milvus_recall", async(state) => {
      const qs = retrievalQueryString(state.query, state.queryAugmentation)
      const n = Math.max(1, qs.length)
      const kEach = Math.max(2, Math.ceil(MILVUS_K / n))
      const batches = await Promise.all(
        qs.map((q) => milvus.similaritySearch(q, kEach))
      )
      const flat = batches.flat() // 扁平化 milvus直接返回Document, 不需要和上面一样转换二维数组
      return {
        milvusHits: dedupeDocsById(flat) // 按 id 去重后返回
      }
    })
    // 合并
    .addNode("merge", async(state) => ({
      merged: merge(state.esHits, state.milvusHits),
    }))
    // rerank
    .addNode("rerank", async(state) => {
      const merged = state.merged ?? []
      if(!merged.length) return { topDocuments: [] }
      const topDocuments = await reranker.compressDocuments(merged, state.query) // 基类方法名是 compressDocuments，没有 rerank
      return {
        topDocuments: topDocuments
      }
    })
    // 生成答案
    .addNode("generate_answer", async(state) => {
      const query = state.query ?? ''
      const docs = state.topDocuments ?? []

      if(!docs.length) {
        const chain = NO_CONTEXT_PROMPT.pipe(chatModel)
        const msg = await chain.invoke({ query })
        return {
          answer: stringifyMessageContent(msg.content).trim() // 格式化消息内容
        }
      }
      // pipe 用于将 prompt 和 model 连接起来
      const chain = ANSWER_PROMPT.pipe(chatModel)
      const msg = await chain.invoke({
        query,
        context: formatDocsAsContext(docs) // 格式化文档内容
      })
      return {
        // 可能返回多模态内容，需要格式化，不能直接.trim()
        answer: stringifyMessageContent(msg.content).trim() // 格式化消息内容
      }
    })
    .addEdge(START, "query_augment")
    .addEdge("query_augment", "es_recall")
    .addEdge("query_augment", "milvus_recall")
    // 扇入(fan-in)：两条边指向同一个节点 = merge 等两路都完成
    .addEdge("es_recall", "merge")
    .addEdge("milvus_recall", "merge")
    .addEdge("merge", "rerank")
    .addEdge("rerank", "generate_answer")
    .addEdge("generate_answer", END)
    .compile()
}

const graph = compileHybridRetrievalGraph(esClient, milvus, rerank, chatModel)
const drawable = await graph.getGraphAsync()
console.log(drawable.drawMermaid())

const question = "家里无线老是断断续续的咋整啊"
const state = await graph.invoke({ query: question })
printQueryRewrite(state.query, state.queryAugmentation) // 打印查询扩展
printDocs("Elasticsearch 检索结果:", state.esHits) // 打印es检索文档
printDocs("Milvus 检索结果:", state.milvusHits) // 打印milvus检索文档
printDocs("合并结果:", state.merged) // 打印合并结果
console.log("大模型生成回答")
console.log(state.answer)