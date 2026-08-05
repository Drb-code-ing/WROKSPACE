import { Outlet } from 'react-router-dom'

function Products() {
  return (
    <div>
      <h1>Products</h1>
      {/* 嵌套路由，渲染子路由组件 */}
      <Outlet />
    </div>
  )
}

export default Products