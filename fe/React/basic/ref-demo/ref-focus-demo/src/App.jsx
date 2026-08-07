import { 
  useRef, 
  useEffect, 
  useState
} from 'react'

// function App() {
//   const [count, setCount] = useState(0)
//
//   // ref 对象引用
//   const inputRef = useRef(null)
//   useEffect(() => {
//     // 组件挂载完成后，自动聚焦到输入框
//     console.log(inputRef.current)
//     inputRef.current.focus()
//   }, [])
//
//   return (
//     <>
//       {/* 自动聚焦, autoFocus 属性 */}
//       {/* <input type="text" placeholder="请输入用户名" autoFocus /> */}
//       {/* dom 节点对象 */}
//       <input type="text" placeholder="请输入用户名" ref={inputRef} />
//       {count}
//       <button onClick={() => setCount(count + 1)}>增加</button>
//     </>
//   )
// }

// function App() {
  // const numRef = useRef(0)// 引用一个值
  // const [, forceRender] = useState(0)// 响应式
// 
  // return (
    // <>
    {/* <div onClick={() => {numRef.current++; forceRender()}}>{numRef.current}</div> */}
    {/* </> */}
  // )
// }

function App() {
  // 主线程 单线程 web worker
  // 离开主线程，进入 worker 线程，进行复杂计算
  // console.time('主线程')
  // for (let i = 0; i < 100000000; i++) {
    // console.log(i)
  // }
  // console.timeEnd('主线程')
  // 阻塞页面渲染

  const workerRef = useRef(null)// 可持久化的可变对象
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    // 组件挂载完成后，创建 worker 线程，开销比较大的操作
    // ref 引用了 worker 线程，避免了主线程阻塞
    const worker = new Worker(
      new URL('./worker.js', import.meta.url)
    )
    // 监听worker 线程，有没有消息到达
    worker.onmessage = (e) => {
      console.log('主线程收到 worker 线程返回的数据', e.data)
      setResult(e.data.result)   // 把计算结果存到 state，触发渲染显示
      setLoading(false)          // 计算结束，恢复按钮可点
    }
    workerRef.current = worker
    // 组件卸载时，销毁 worker 线程
    return () => {
      workerRef.current.terminate()
      workerRef.current = null
    }
  }, [])

  const startHeavyCalc = () => {
    setLoading(true)
    // 消息机制
    // 给worker 线程发送一条工作指令  带上参数
    workerRef.current.postMessage({
      num: 88
    })
  }

  return (
    <>
      <div style={{padding: "30px"}}>
        <h2>useRef + WebWorker 耗时计算</h2>
        <p>开启web worker 线程，执行5亿次循环，结束后通知主线程</p>
        <button
         onClick={startHeavyCalc}
         disabled={loading}
        >{loading ? "正在后台计算..." : "启动繁重计算任务"}</button>
        {result && <h3>计算结果: {result}</h3>}
      </div>
    </>
  )
}

export default App
