import { chatOpenAI } from 'langchain/openai'
import { config } from 'dotenv'

config()

const apiKey = process.env.Deepseek_API_Key

const model = new chatOpenAI({
  modelName: 'deepseek-v4-flash',
  apiKey: apiKey,
  configuration: {
    baseURL: 'https://api.deepseek.cn/v1',
  }
})