import { 
  // useState,
  useEffect
} from "react"
import './App.css'

function App() {
  // 请求控制器实例， 配给fetch请求
  const controller = new AbortController();
  useEffect(() => {
    fetch('/api/banners', {
      // 配置请求控制器
      // signal: controller.signal
      signal: AbortSignal.timeout(3000) // 自动取消请求
    })
      .then(data => data.json())
      .then(res => console.log(res))
  }, [])

  // 取消请求
  const stop = () => {
    controller.abort("用户暂停")
  }
  return (
    <>
      <button onClick={stop}>暂停</button>
    </>
  )
}

export default App