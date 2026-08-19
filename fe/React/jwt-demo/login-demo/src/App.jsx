import React, { lazy, Suspense } from 'react'
import { Routes, Route, BrowserRouter as Router } from 'react-router-dom'
// 路由守卫组件
import RequireAuth from './components/RequireAuth.jsx'
import Nav from './components/Nav'

const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Pay = lazy(() => import('./pages/Pay'))


function App() {
  // 组件状态几乎都不放在component，而是放在store

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