//  http 请求llm 接口
// bun 代替npm 做包管理
import axios from 'axios'
import dotenv from 'dotenv'
dotenv.config()

async function chat() {
  // llm 可能会报错，需要捕获异常
  try {
    // GET 请求有上限
    // apiKey GET 不安全 明文传输
    // 请求行 url method http version
    // 请求头 Authorization apikey
    // 请求体 body(GET 不支持)
    // fetch http请求api
    const res =  await axios.post(
      `${process.env.DEEPSEEK_API_URL}`,
      {
        model: 'deepseek-v4-flash',
        messages: [
          {
            role: 'user',
            content: '你好，介绍一下Bun'
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',// 请求体格式
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`// 请求头 apikey
        }
      }
    )
    console.log(res.data.choices[0].message.content)
  } catch (error: any) {
    console.log('❌ 请求失败:', error.response?.data || error.message)
  }
}
chat()
