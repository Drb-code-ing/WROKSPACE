import { OpenAI } from 'openai'
import dotenv from 'dotenv'
dotenv.config()
const client = new OpenAI({
  baseURL: process.env.DEEPSEEK_BASE_URL,
  apiKey: process.env.DEEPSEEK_API_KEY,
})
// 限制死循环 最大尝试次数 超预算(maxToken) 边界
const limit = {
  maxRound: 5,
  maxToken: 2000,
  sameStop: 2
}

const task = {
  desc: '小红书美妆文案',// 目标
  rules: ["标题带数字", "正文<300字", "大爆款", "结尾有行动号召"]
}

let round = 0, totalToken = 0, lastText = '', sameCount = 0

function needStop() {
  return round > limit.maxRound || totalToken >= limit.maxToken || sameCount >= limit.sameStop
}

async function gen() {
  const res =  await client.chat.completions.create({
    model: 'deepseek-v4-flash',
    messages: [
      { role: 'user', content: `假如你是一位资深小红书博主，写一篇${task.desc}，要求符合${task.rules.join('、')}，只输出文案` }
    ]
  })
  console.log(res.usage.total_tokens, res.choices[0].message.content)
  return {
    text: res.choices[0].message.content.trim(),
    token: res.usage.total_tokens
  }
}

async function check(text) {
  const res = await client.chat.completions.create({
    model: 'deepseek-v4-flash',
    messages: [
      { role: 'user', content: `效验文案${text}，规则：${task.rules.join('、')}, 只输出JSON {pass: 布尔, fail: 数组}` }
    ]
  })
  return JSON.parse(res.choices[0].message.content.trim())
}

async function runLoop() {
  console.log('AI Loop 开始')
  while(!needStop()) {
    round++
    console.log(`\n第${round}轮`)
    // 干活 返回promise 返回一个对象
    // 可以解构text token
    const { text, token } = await gen()
    totalToken += token
    sameCount = text === lastText ? sameCount + 1 : 0
    lastText = text

    const { pass, fail } = await check(text)
    if (pass) {
      console.log('文案验通过')
      console.log(`最终文案：${text}`)
      return
    }
    console.log(`文案验不通过，${fail}`)
  }
  console.log('\n触发刹车强制停止')
}
runLoop()
