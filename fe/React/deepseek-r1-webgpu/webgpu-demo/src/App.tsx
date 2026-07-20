import { useState } from 'react'

// 现代前端开发框架
// 组件化、响应式、数据绑定
// 封装特性 组件的html, css, js封装成一个组件
function App() {
  const [count, setCount] = useState(0)
  // 返回html jsx
  return (
    <div className="flex">
      Hello World!{count}
      <h1 className="text-3xl font-bold underline">你好，世界!</h1>
      <button onClick={() => setCount(count + 1)}>增加</button>
    </div>
  )
}

export default App
