import {
  // useNavigate：命令式跳转（在事件处理、副作用、条件判断里调用）
  //   const navigate = useNavigate()
  //   navigate('/home')  // 点按钮后跳转、登录成功后跳转
  //   navigate(-1)        // 后退
  //   navigate('/', { replace: true })  // 替换历史记录
  //
  // Navigate：声明式跳转（渲染时直接重定向，像组件一样写在 JSX 里）
  //   if (!isAuth) return <Navigate to="/login" replace />
  //   常用于路由守卫：未登录时渲染到登录页
  useNavigate,
  useLocation,
 } from 'react-router-dom'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  // /login  from为空
  // /post/new 从这里来 -> login  from对象
  // 可选链运算符 es11
  const from = location.state?.from?.pathname || '/'
  console.log(from)

  function handleSubmit(e) {
    e.preventDefault()// 阻止表单默认提交行为
    // 原生的表单数据对象
    const formData = new FormData(e.currentTarget)
    const username = formData.get('username')
    const password = formData.get('password')

    if(username === 'admin' && password === '123456') {
      localStorage.setItem('isLogin', 'true')
      // navigate(from)
      // 浏览器访问会留下历史记录 history 栈
      // 浏览器有前进后退导航
      // 登录成功后，如果还能返回登录页面，用户就会蒙
      // 把用户当小白，replace 跳转到新页面的同时将新页面的历史记录替换掉/login的记录
      navigate(from, { replace: true })
    } else {
      alert('用户名或密码错误')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>登录</h1>
      <input 
      name="username"
      placeholder="请输入用户名" 
      required// 必填项
      />
      <input 
      name="password"
      placeholder="请输入密码" 
      required
      />
      <button type="submit">登录</button>
    </form>
  )
}

export default Login