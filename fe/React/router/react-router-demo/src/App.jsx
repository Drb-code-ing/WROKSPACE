import {
  lazy,
  Suspense,
} from 'react'

import {
  // location.hash
  HashRouter as Router,// 前端路由
  Routes,// 路由配置数组
  Route,// 路由配置项
  Navigate,
} from 'react-router-dom'
import Navigation from './components/Navigation'
// SPA 动态切换多个页面
// 下载执行 影响首页加载速度
// 懒加载 只在需要时加载
// import Home from './pages/Home'
// import About from './pages/About'
// import User from './pages/User'

const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const User = lazy(() => import('./pages/User'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Products = lazy(() => import('./pages/Products'))
const ProductDetail = lazy(() => import('./pages/Products/ProductDetail'))
const NewProduct = lazy(() => import('./pages/Products/NewProduct'))
const Login = lazy(() => import('./pages/Login'))
const Pay = lazy(() => import('./pages/Pay'))
const ProtectRoute = lazy(() => import('./ProtectRoute'))



function App() {
  return (
    <>
    {/* 前端路由接管一切 */}
    <Router>
      {/* 路由懒加载 */}
      <Suspense fallback={<div>Loading...</div>}>
        {/* 导航栏 */}
        <Navigation />

        <div id="container">
          {/* 动态页面切换部分 既是配置，又是出现的地方 */}
          <Routes>
            {/* 有且只有一个Route 显示当前location.hash 对应页面级别组件 */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/user/:id" element={<User />} />
            {/* 多级路由，嵌套路由 */}
            <Route path="/products" element={<Products />} >
              <Route path=":productId" element={<ProductDetail />} />
              <Route path="new" element={<NewProduct />} />
            </Route>
            {/* 重定向路由 */}
            {/* 有个活动/game 100wan  /result 活动结束了 */}
            {/* /home 重定向到 首页 */}
            {/* /user/:id 登录? 送到/login  登录后送到 */}
            <Route path="old-path" element={<Navigate replace to="/new-path" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/pay" element={
              // 门禁保安
              // Pay 要进的房间
              <ProtectRoute>
                {/* children */}
                <Pay />
              </ProtectRoute>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Suspense>
    </Router>
    </>
  )
}

export default App
