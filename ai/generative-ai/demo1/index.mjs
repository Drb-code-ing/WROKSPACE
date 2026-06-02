// .env 中的 apiKey 读取进来
// dotenv
import dotenv from 'dotenv'
import { OpenAI } from 'openai'
dotenv.config()
// process 进程对象
// 什么是进程？
// 操作系统中的一个程序(核心概念)
// node index.mjs 进程对象 本质是启动了一个进程
// 进程是一个分配资源(内存、CPU、IO等)的最小单位
// node 就是process 这个全局对象
// process.env 是一个对象，包含了环境变量
console.log(process.env.DEEPSEEK_API_KEY)
console.log(process.env.DEEPSEEK_BASE_URL)
const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL,
})
// 函数表达式
// async 修饰符 表示是异步函数
// 函数体中可以使用await 关键字 等待异步操作完成
const main = async () => {
  console.log('程序开始运行')
  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'user',
        content: '你好',
      },
    ],
  })
  console.log(response.choices[0].message.content)
  // await new Promise(resolve => {
    // setTimeout(() => {
      // console.log('1秒后运行')
      // resolve()
    // }, 1000)
  // })
  console.log('程序结束')
}
main()