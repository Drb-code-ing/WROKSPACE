import 'dotenv/config'
import { ChatOpenAI } from '@langchain/openai'
// 把大模型输出解析成纯字符串
// chain上 不用那么复杂，直接给我们content 内容
import { StringOutputParser } from '@langchain/core/output_parsers'// 字符串输出解析器
// prompt 好复用
// 以前是硬编码，直接写代码里面，不好维护、模块化
// agent 中很多业务都是prompt 驱动的，不同的用户是同一套ai 业务，只需要换身份就好，PromptTemplate 可以复用
// 会在AI 工作流的前面
import { PromptTemplate } from '@langchain/core/prompts'// 提示词模版

// 创意性llm
const creativeModel = new ChatOpenAI({
  model: 'deepseek-v4-pro',
  temperature: 0.8,// 增强创意的发散性
  topK: 4,// 仅从概率分布最高的4个词中采样，限制跑偏
  maxTokens: 1024,// 最大生成token数
  apiKey: process.env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: 'https://api.deepseek.com/v1',
  },
})
// 严谨性llm
const preciseModel = new ChatOpenAI({
  model: 'deepseek-v4-pro',
  apiKey: process.env.DEEPSEEK_API_KEY,
  temperature: 0.2,
  topK: 8,// 保证信息的完整性
  maxTokens: 1024,
  configuration: {
    baseURL: 'https://api.deepseek.com/v1',
  },
})
// prompt 更好维护 管理 复用
const storyPrompt = PromptTemplate.fromTemplate(
`
请写一篇短篇散文，主题：{theme}
风格温柔治愈，篇幅200字左右，不要分段，文字细腻又画面感
`
)
// 输出解析器，统一返回文本content
const outputParser = new StringOutputParser()
// 工作流 pipe 链起来 流转
// AI 工程复杂 设计好了AI 工作流
const creativeChain =  storyPrompt
.pipe(creativeModel)
.pipe(outputParser)

const preciseChain =  storyPrompt
.pipe(preciseModel)
.pipe(outputParser)

// 原料送到流水线生产
async function runWriteDemo() {
  const theme = '秋日山野晚风'

  console.log('创意写作模式')
  const creativeText = await creativeChain.invoke({ theme })
  console.log(creativeText)

  console.log('严谨写作模式')
  const preciseText = await preciseChain.invoke({ theme })
  console.log(preciseText)
}
runWriteDemo().catch(err => console.error(err))
