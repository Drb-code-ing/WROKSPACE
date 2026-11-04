import 'dotenv/config'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage } from '@langchain/core/messages'
import OSS from 'ali-oss'

// 私有桶的图片不能直接把公网地址丢给模型（DashScope 会 403 下载失败），
// 先用 AK/SK 生成有时效的预签名 URL，再交给模型
const ossClient = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  authorizationV4: true,
  secure: true, // 签名 URL 走 https
  bucket: process.env.OSS_IMAGE_BUCKET ?? process.env.OSS_BUCKET,
})

const signedUrl = ossClient.signatureUrl(
  process.env.OSS_IMAGE_KEY ?? 'multi-model/images/zao.png',
  { expires: 3600 },
)
console.log('预签名 URL:', signedUrl)

const model = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'qwen3-vl-plus',
  configuration: {
    baseURL: process.env.OPENAI_API_BASE_URL,
  }
})

const response = await model.invoke([
  new HumanMessage({
    content: [
      { type: 'text', text: '详细描述这张图片的内容' },
      {
        type: 'image_url',
        image_url: {
          url: signedUrl,
        }
      }
    ]
  })
])

console.log(response.content)
