import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
// 显式加载脚本上两级的 .env，保证在任何工作目录下运行都能拿到密钥
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') })
import { Document } from '@langchain/core/documents'
import DashscopeRerank from './dashscope-rerank.mjs'

async function main() {
  const apiKey = process.env.OPENAI_API_KEY
  const compressor = new DashscopeRerank({apiKey, topN: 3})
  const query = "什么是文本排序模型"
   const docs = [
    new Document({ pageContent: "预训练语言模型的发展给文本培训模型带来了新的进展"}),
    new Document({ pageContent: "量子计算式计算科学的一个前沿领域"}),
    new Document({ pageContent: "文本排序模型广泛用于搜索引擎和推荐系统中"}),
  ]
  const ranked = await compressor.compressDocuments(docs, query)
  console.log("重新排序后的:", ranked)
}

main()
 .catch(console.error)
