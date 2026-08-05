// a 点击后跳转，二次处理
// 不直接用a标签，react-router-dom 提供的 Link 组件
// 会自动处理点击事件，不会刷新页面，不会触发 hashchange 事件
import { Link } from 'react-router-dom';

function Navigation() {
  return (
    <nav>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/user/123">小家</Link></li>
        <li><Link to="/products/123">商品详情</Link></li>
        <li><Link to="/products/new">商品新增</Link></li>
      </ul>
    </nav>
  );
}

export default Navigation