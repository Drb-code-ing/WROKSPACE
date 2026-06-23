// prompt("文本输入") -> tokens(编码器) -> 向量化(embedding) -> llm(transformer) -> tokens(解码器) -> 文本输出
import { OpenAI } from 'openai'
import dotenv from 'dotenv'
dotenv.config()

const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,// 阿里百炼
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
})
// llm 向量化封装函数
async function getEmbedding(text) {
  // 文本 数学 高维度 向量化
  const res = await client.embeddings.create({
    // 嵌入模型
    model: 'text-embedding-v4',
    input: text,
    dimension: 1024,// 维度
  })
  return res.data[0].embedding
}

async function run() {
  // 语义相似
  // 文本匹配决对不一样
  // embedding 语义 1024 维度 向量化-1->1数学表达
  const text1 = "Andrej Karpathy LLM Tokenization 分词原理"
  const text2 = "卡帕西讲解大模型BPE字词分词"
  const vec1 = await getEmbedding(text1)
  const vec2 = await getEmbedding(text2)
  console.log(vec1)
  console.log(vec1.length)
}

run()
