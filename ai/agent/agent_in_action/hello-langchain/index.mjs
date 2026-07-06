import { ChatOpenAI } from '@langchain/openai'
import dotenv from 'dotenv'

dotenv.config()

const apiKey = process.env.Deepseek_API_Key

const model = new ChatOpenAI({
  modelName: 'deepseek-v4-flash',
  apiKey: apiKey,
  configuration: {
    baseURL: 'https://api.deepseek.com/v1',
  }
})
// client.chat.completions.create
const response = await model.invoke('棍王杯台球赛一个设什么奖励？')
console.log(response)