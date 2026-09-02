import 'dotenv/config'
// 被截断的数组 -> 字符串拼接 -> ai summarization
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history'
import {
  HumanMessage, 
  AIMessage,
  getBufferString,
  SystemMessage,
  trimMessages // langchain 提供的截断函数，裁剪老的，保留新的
} from '@langchain/core/messages'
import { getEncoding } from 'js-tiktoken' // 用于计算 token 开销
import { ChatOpenAI } from '@langchain/openai' // 1.x 中 chat_models 子路径已移除，ChatOpenAI 在 openai 包里

const model = new ChatOpenAI({
  modelName:process.env.MODEL_NAME,
  apiKey:process.env.API_KEY,
  temperature:0,
  configuration:{
    baseURL:process.env.API_BASE_URL,
  }
})

// 总结历史消息
async function summarizeHistory(messages) {
  if(messages.length === 0) {
    return ''
  }

  // JS 版是位置参数 (messages, humanPrefix, aiPrefix)，不接受 options 对象
  const conversation = getBufferString(messages, '用户', '助手')
  // console.log(conversation)
  const sumaryPrompt = `请总结以下对话，保留核心内容:\n${conversation}`
  const summarResponse = await model.invoke(
    [new SystemMessage(sumaryPrompt)]
  )
  return summarResponse.content
}

async function summarizationMemoryDemo() {
  const history = new InMemoryChatMessageHistory()
  const maxMessages = 6
  const messages = [
    { type: 'human', content: '我叫李四' },
    { type: 'ai', content: '你好李四，很高兴认识你！' },
    { type: 'human', content: '我是一名设计师' },
    { type: 'ai', content: '设计师是个很有创造力的职业！你主要做什么类型的设计？' },
    { type: 'human', content: '我喜欢艺术和音乐' },
    { type: 'ai', content: '艺术和音乐都是很好的爱好，它们能激发创作灵感。' },
    { type: 'human', content: '我擅长 UI/UX 设计' },
    { type: 'ai', content: 'UI/UX 设计非常重要，好的用户体验能让产品更成功！' },
  ];

  for(const msg of messages) {
    if(msg.type === 'human') {
      await history.addMessage(new HumanMessage(msg.content))
    } else {
      await history.addMessage(new AIMessage(msg.content))
    }
  }

  let allMessages = await history.getMessages()
  console.log(`原始的消息数量：${allMessages.length}`)
  console.log(`原始消息`, allMessages.map(m => 
    `${m.constructor.name}:${m.content}`).join('\n'))
  
  if(allMessages.length > maxMessages) {
    const keepRecent = 2
    const messageToSummarize = allMessages.slice(0, -keepRecent) // 先取要总结的旧消息
    allMessages = allMessages.slice(-keepRecent) // 再保留最近的消息
    console.log(`\n 历史消息过多，开始总结...`)
    console.log(`\n 将被总结的消息数量: ${messageToSummarize.length}`)

    const summary = await summarizeHistory(messageToSummarize)
    // console.log(`\n 总结结果: ${summary}`)
    // 清空历史消息
    await history.clear()
    // 添加总结结果
    await history.addMessage(new AIMessage(summary))

    const newMessages = await history.getMessages()
    for(const msg of newMessages) {
      console.log(`${msg.constructor.name}:${msg.content}`)
    }
  }
}
summarizationMemoryDemo()
  .catch(console.error)