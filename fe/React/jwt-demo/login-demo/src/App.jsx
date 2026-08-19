import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, BrowserRouter as Router } from 'react-router-dom'
// 路由守卫组件
import RequireAuth from './components/RequireAuth.jsx'
import Nav from './components/Nav'
import { getRepo } from './api/repo'

const Home = lazy(() => import('./page/Home'))
const Login = lazy(() => import('./page/Login'))
const Pay = lazy(() => import('./page/Pay'))


function App() {
  // 组件状态几乎都不放在component，而是放在store
  useEffect(() => {
    (async () => {
      const res = await getRepo()
      console.log(res)
    })()
  }, [])

  return (
    <Router>
      <Nav />
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/pay" element={
            <RequireAuth>
              <Pay />
            </RequireAuth>
          } />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App