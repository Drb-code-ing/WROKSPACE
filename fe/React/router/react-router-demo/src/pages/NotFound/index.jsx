import {
  useEffect
} from 'react'
// 对比 location.href = '/'：
// - location.href：整页刷新，重新加载整个 SPA，所有 state 丢失，白屏体验差
// - useNavigate：SPA 内部跳转，不刷新页面，React Router 接管，性能好，状态保留
import { useNavigate } from 'react-router-dom'

function NotFound() {
  const navigate = useNavigate()
  useEffect(() => {
    const timer = setTimeout(() => {
      // location.href = '/'  // 整页刷新，会重新请求 HTML/JS/CSS
      navigate('/')           // SPA 内部路由切换，只更新组件，不重新加载资源
    }, 3000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div>
      <h1>404 Not Found</h1>
    </div>
  )
}

export default NotFound