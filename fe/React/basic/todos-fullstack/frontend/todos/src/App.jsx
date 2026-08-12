import React, { lazy, Suspense } from 'react'
import { Routes, Route, BrowserRouter as Router } from 'react-router-dom'
import Nav from './components/Nav'
const Home = lazy(() => import('./pages/Home'))
const Todos = lazy(() => import('./pages/Todos'))


function App() {

  return (
    // 路由接管一切；Suspense 为懒加载页面提供加载中的兜底
    <Router>
        <Nav />
        <Suspense fallback={<div>加载中...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/todos" element={<Todos />} />
          </Routes>
        </Suspense>
    </Router>
  )
}

export default App
