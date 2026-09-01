import 'dotenv/config'
import { ChatOpenAI } from '@langchain/openai'
import {
  // InMemoryChatMessageHistory // 短期内存记忆
  FileSystemChatMessageHistory
} from '@langchain/community/stores/message/file_system'
import path from 'node:path' // 第 27 行 path.join 需要
import {
  HumanMessage, SystemMessage
} from '@langchain/core/messages'

const model = new ChatOpenAI({
  modelName:process.env.MODEL_NAME,
  apiKey:process.env.API_KEY,
  temperature:0,
  configuration:{
    baseURL:process.env.API_BASE_URL,
  }
})

async function fileHistoryDemo() {
  const filePath = path.join(process.cwd(), 'chat_history.json')
  const sessionId = 'user_session_001'

  const systemMessage = new SystemMessage(
    '你是一个友好，幽默的做菜助手，喜欢分享美食和烹饪技巧'
  )
  // 从文件系统恢复记忆
  const restoredHistory = new FileSystemChatMessageHistory({
    filePath,
    sessionId,
  })
  const restoredMessages = await restoredHistory.getMessages()
  console.log(`从文件中恢复了${restoredMessages.length}条历史信息:`)
  restoredMessages.forEach((msg, index) => {
    const type = msg.type
    const prefix = type === 'human' ? '用户' : '助手'
    console.log(`${index + 1} . [${prefix}]: ${msg.content.substring(0, 50)}...`)
  })
  console.log("[第三轮对话]")
  const userMessage3 = new HumanMessage("需要哪些食材？")
  console.log(`用户: ${userMessage3.content}`)

  await restoredHistory.addMessage(userMessage3) // message 数组添加了对话
  const message3 = [systemMessage, ...(await restoredHistory.getMessages())]
  const response3 = await model.invoke(message3)
  console.log(`助手: ${response3.content}\n`)
  await restoredHistory.addMessage(response3)
}
fileHistoryDemo()
  .catch(console.error)
