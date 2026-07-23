import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  function addCount() {
    setCount(count + 1)
    // setCount 只提交下一次渲染要使用的新状态；当前事件函数仍持有本次渲染的 count（初始为 0），因此这里打印 0。
    // React 完成这次事件后会重新执行 App，届时页面中的 count 才会变为 1。
    console.log(count)
    // setCount(count + 1)
    // setCount(count + 1)
    setCount(prevCount => prevCount + 1)
    setCount(prevCount => prevCount + 1)
  }
  
  return (
    <>
    <p>当前计数: {count}</p>
    <button onClick={addCount}>+</button>
    </>
  )
}

export default App
