import { pool } from './db.mjs'
import * as users from './users.mjs'
import * as conversations from './conversations.mjs'
import * as messages from './messages.mjs'

async function run() {
  // const user = await users.createUser({ name: '张三' })
  // console.log("创建用户", user)
  // const fetchedUser = await users.getUserById(user.id)
  // console.log("获取用户", fetchedUser)
  // const updatedUser = await users.updateUser(user.id, '王五')
  // console.log("更新用户", updatedUser)

  // const conversation = await conversations.createConversation(2, '测试对话')
  // console.log("创建对话", conversation)
  // const fetchedConversation = await conversations.getConversationById(conversation.id)
  // console.log("获取对话", fetchedConversation)

  // const message = await messages.createMessage(2, 'user', '你好')
  // console.log("创建消息", message)
  // const fetchedMessage = await messages.getMessageById(message.id)
  // console.log("获取消息", fetchedMessage)

  const seedMessages = [
    { role: "user", content: "PostgreSQL 支持哪些数据类型？" },
    {
      role: "assistant",
      content:
        "PostgreSQL 支持整数、文本、JSON、数组，以及 pgvector 扩展提供的向量类型。",
    },
    { role: "user", content: "怎么做相似度搜索？" },
    {
      role: "assistant",
      content:
        "可以使用 pgvector 的 cosine 距离运算符 <=>，配合 hnsw 索引加速向量检索。",
    },
  ];

  // for (const msg of seedMessages) {
    // await messages.createMessage(2, msg.role, msg.content, true)
  // }

  const query = "向量相似度怎么查"
  const result = await messages.searchSimilaryMessage(2, query, 2)
  console.log("检索结果", result)
}
run()
 .catch(err => {
   console.error("运行失败", err.message)
   process.exit(1)
 })
 .finally(() => pool.end())
