import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 利用vite 来解决跨域
  server: {
    // 代理配置
    proxy: {
      // 前端想去后端请求 /api 开头的路径
      '/api': {
        // 跨域  在浏览器环境下，同源策略的安全性问题
        // 这里vite 会拦截 /api 开头的请求，转发到服务器端，从而解决跨域问题
        target: 'http://localhost:3002',
        secure: false,
        rewrite: path => path.replace(/^\/api/, ''),// 去掉 /api 前缀
      }
    }
  }
})
