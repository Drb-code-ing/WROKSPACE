import { 
  useRef, 
  useEffect, 
  // useState
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

  const workerRef = useRef(null)
  useEffect(() => {
    // 组件挂载完成后，创建 worker 线程，开销比较大的操作
    // ref 引用了 worker 线程，避免了主线程阻塞
    workerRef.current = new Worker(
      new URL('./worker.js', import.meta.url)
    )
  }, [])

  return (
    <>
    </>
  )
}

export default App
