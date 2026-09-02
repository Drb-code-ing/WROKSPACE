// 上下文管理的三个手段  截断
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history'
import {
  HumanMessage, 
  AIMessage,
  trimMessages // langchain 提供的截断函数，裁剪老的，保留新的
} from '@langchain/core/messages'
import { getEncoding } from 'js-tiktoken' // 用于计算 token 开销

// 按消息数量截断 简单 slice
async function messageCountTruncation() {
  const history = new InMemoryChatMessageHistory()
  const maxMessages = 4
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
    if (msg.type === 'human') {
      await history.addMessage(new HumanMessage(msg.content))
    } else {
      await history.addMessage(new AIMessage(msg.content))
    }
  }

  let allMessages = await history.getMessages()
  const trimmedMessages = allMessages.slice(-maxMessages)
  console.log(`保留消息数量：${trimmedMessages.length}`)
  console.log('保留的消息：', trimmedMessages.map(
    m => `${m.constructor.name}: ${m.content}`).join('\n'))
}
// 自定义 token 计算函数，根据encoder 编码类型计算对应 token 数量
function countTokens(messages, encoder) {
  let cotal = 0
  for(const msg of messages) {
    const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
    cotal += encoder.encode(content).length
  }
  return cotal
}

// 按 token 数量截断 复杂 计算token开销
async function tokenCountTruncation() {
  const history = new InMemoryChatMessageHistory()
  const maxTokens = 100
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
  if (msg.type === 'human') {
    await history.addMessage(new HumanMessage(msg.content))
  } else {
    await history.addMessage(new AIMessage(msg.content))
  }
 }

 let allMessages = await history.getMessages()
 const enc = getEncoding('cl100k_base') // 编码
 // 最近的，content 定制的token 长度计算 截取 
 const trimmedMessages = await trimMessages(allMessages, {
  maxTokens: maxTokens, // 注意是 maxTokens，不是 maxLength（那是 Python 版写法）
  // 自定义 token 计算函数，不同模型的 token 计算方式不同
  // 二分查找，找到最大的消息数量，使 token 数量不超过 maxTokens
  // 这里假设 token 数量是单调递增的，所以可以使用二分查找来优化
  tokenCounter: async (msgs) => countTokens(msgs, enc),
  strategy: 'last',
 })

 console.log(trimmedMessages, '-----------------------')
 const totalTokens = countTokens(trimmedMessages, enc)
 console.log(`保留 token 数量：${totalTokens}`)
}

async function runAll() {
  //await messageCountTruncation() // 按消息数量截断 简单 slice
  await tokenCountTruncation() // 按 token 数量截断 复杂 计算token开销
}
runAll()
  .catch(console.error)