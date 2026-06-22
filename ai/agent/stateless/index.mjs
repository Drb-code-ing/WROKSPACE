import { config }  from 'dotenv'
import OpenAI from 'openai'
config()

const client = new OpenAI({
  baseURL: process.env.DEEPSEEK_BASE_URL,
  apiKey: process.env.DEEPSEEK_API_KEY,
})
// 异步任务
// promise 实例
// 对话历史
const chatHistory = [
  { role: 'system', content: '你是一个严谨的助手' },
]

async function testStateless() {
  console.log('第一次请求，告诉模型一个信息')
  // 为了人llm 懂我们，每次请求都需要带上全部对话
  chatHistory.push({ role: 'user', content: '请记住，我的名字叫零零发' })

  const response = await client.chat.completions.create({
    model: 'deepseek-v4-flash',
    messages: chatHistory,
  })
  // 模型回复
  chatHistory.push({ role: 'assistant', content: response.choices[0].message.content })
  console.log('模型回复:', response.choices[0].message.content)
  console.log('第二次请求，直接问我是谁')
  chatHistory.push({ role: 'user', content: '我叫什么名字' })

  const response2 = await client.chat.completions.create({
    model: 'deepseek-v4-flash',
    messages: chatHistory//.concat({role: 'assistant', content: response.choices[0].message.content}),
  })
  console.log('模型回复:', response2.choices[0].message.content)
  console.log(chatHistory)
}
 
testStateless()
  .catch(err => {// test函数 reject
    console.log(err)
  })