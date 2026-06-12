// node 内置的http 模块
// 早期js 特别是前端，没有模块化系统
// function src
// node 之后，一定要上模块化方案 require + module.exports
// esm 是升级版 import + export default
// require node 早期的模块化系统 commonjs
const http = require('http')
// 伺服状态
http.createServer((req, res) => {
  // 用户服务函数
  const todos = [{
    id: 1,
    title: '过四六级',
    completed: false
  },{
    id: 2,
    title: '回家过节',
    completed: false
  }]
  res.setHeader('Access-Control-Allow-Origin', '*')// 允许所有域名访问
  res.setHeader('Content-Type', 'application/json; charset=utf-8')// 响应头，规范编码格式为utf-8
  // req 用户对象
  if (req.url === '/') {
    res.end("hello world")// 响应用户
  }
  if (req.url === '/todos') {
    // 二进制文本
    res.end(JSON.stringify(todos))
  }
}).listen(5000, () => {
  console.log('server is running at http://localhost:5000')
})