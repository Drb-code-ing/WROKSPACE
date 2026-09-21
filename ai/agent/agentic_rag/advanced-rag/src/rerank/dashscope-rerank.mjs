import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
// 显式加载脚本上两级的 .env，保证在任何工作目录下运行都能拿到密钥
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') })
import { 
  // 排序 + 压缩
  BaseDocumentCompressor // 基础文档压缩器
} from '@langchain/core/retrievers/document_compressors'

// 基于阿里云 重排模型
// 方便替换
export default class DashscopeRerank extends BaseDocumentCompressor {
  constructor({apiKey, model = 'qwen3-rerank', topN = 3, baseUrl}) {
    super()
    this.apiKey = apiKey
    this.model = model
    this.topN = topN
    this.baseUrl = baseUrl ?? process.env.RERANK_URL
  }
  async compressDocuments(documents, query, _callbacks) {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        input: {
          query,
          documents: documents.map(p => p.pageContent),
        },
        parameters: {
          return_documents: false, // 不返回文档内容
          top_n: this.topN, // 返回前N个文档（DashScope 是 snake_case：top_n）
        }
      }),
    })
    // 解析结果
    const json = await res.json()
    if(!res.ok) { // 注意：判断的是 Response 的 res.ok，不是 json.ok
      throw new Error(json?.message || `重排模型调用失败(HTTP ${res.status})`)
    }
    const results = json?.output?.results || []
    if(!Array.isArray(results)) {
      throw new Error('重排模型返回结果格式错误')
    }

    // 按分数重排，并把每条的相关性得分挂到 metadata 里带出去
    return results.map(item => ({
      ...documents[item.index],
      metadata: {
        ...documents[item.index].metadata,
        rerank_score: item.relevance_score,
      },
    }))
  }
}