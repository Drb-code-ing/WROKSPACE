import * as dotenv from 'dotenv'
// node 最基本且简单的开发框架
// vite 启动的http server 是服务于前端 5173
// 5173 前端 -> 3000 BFF后端 -> llm 服务器
// 前端发送请求到BFF 层，享受服务 web server 后端 伺服状态 3000
// http server
import express from 'express'

// 让我们的key 更安全
// 纯前端 容易提供网络等泄露key 等敏感信息
// fetch -> bff(apiKey) -> llm 服务器
dotenv.config({
  path: ['.env.local', '.env']
})

const app = express()// server app
const port = 3002
// 路由
app.get('/', (req, res) => {
  // 不断地流式输出
  res.send('hello world')// 一次性发送
})
// 提供一个流式输出的bff 层，让前端调用
app.get('/stream', async (req, res) => {
  // prompt req 解析
  // fetch -> llm 服务器
  // llm
  // console.log(req.query.request)
  // res.json({
    // prompt: req.query.prompt
  // })
  const prompt = req.query.prompt
  const endpoint = 'https://api.deepseek.com/v1/chat/completions'
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VITE_DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        stream: true,
        messages: [{role: 'user', content: prompt}]
      })
    })

    console.log(response.body)// ReadableStream
  } catch(e) {
    console.log(e)
  }
})

app.listen(port, () => {
  console.log(`服务器在${port}端口启动`)
})

// llm 请求bff 来获取key
// 后端轻量的node 服务 就这一个文件 服务器端
// npm run dev  vite 服务
// node server.mjs  启动后端进程
console.log('我是一个在前端项目中藏着的BFF 程序')
