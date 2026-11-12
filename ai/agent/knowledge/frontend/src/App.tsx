// 后台应用布局
// 侧边栏导航 + 顶部栏 + 主内容区的经典三栏布局
import type { ReactElement } from 'react'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import { useAuth } from './hooks/useAuth'
import { Navigate, Route, Routes } from 'react-router-dom'

// 路由守卫组件
function Guard({ children }: { children: ReactElement }) {
  // hooks
  const user = useAuth()
  if (!user) {
    // replace 会替换当前路由，不会添加到路由历史记录中，规避重复登录问题
    return <Navigate to="/login" replace />
  } else {
    return children
  }
}

function App() {

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <Guard>
              <AppLayout />
            </Guard>
          }
        ></Route>
      </Routes>
    </>
  )
}

export default App
