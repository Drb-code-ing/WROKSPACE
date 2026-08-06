import { Navigate, useLocation } from 'react-router-dom'

function ProtectRoute({ children }) {
  console.log(children)
  // 拦截请求 鉴权
  // html5 本地存储 域名沙盒
  const isAuth = localStorage.getItem('isLogin') === 'true'
  console.log(isAuth)
  // useLocation 返回 React Router 的 location（纯对象，可序列化）
  // 不能用 window.location，它含原型/方法，pushState 无法克隆会报 DataCloneError
  const location = useLocation()
  if (!isAuth) {
    // 未登录 跳转登录页 设置state路由状态对象
    // replace：替换当前 /pay 历史，避免登录后还能后退回 /login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return (
    <div>
      {children}
    </div>
  )
}

export default ProtectRoute