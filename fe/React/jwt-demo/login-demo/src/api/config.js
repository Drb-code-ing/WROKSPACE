import axios from 'axios'

const instance = axios.create({
  baseURL: '/api',
  timeout: 2000,
})

// 请求拦截器
instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if(token) {
    // 每次请求都带上 token
    config.headers['authorization'] = `Bearer ${token}`
  }
  return config
})

// 响应拦截器
instance.interceptors.response.use(res => {
  return res.data
})


export default instance