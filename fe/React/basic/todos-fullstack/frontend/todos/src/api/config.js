// api 配置文件
import axios from 'axios'

// fetch 缺点是功能小
// app /api/todos -> :3000/todos
// 实例化axios
const instance = axios.create({
  baseURL: '/api',// 基础路径
  // baseURL: 'http://localhost:3000',
  timeout: 5000,
})

export default instance