import {
   useState,
  //  useEffect // 生命周期钩子函数 组件挂载时执行
  } from 'react'
import './App.css'
import Progress from './components/Progress'

// 现代前端开发框架
// 组件化、响应式、数据绑定
// 封装特性 组件的html, css, js封装成一个组件
function App() {
  // use 用，status 状态 hooks函数
  // 数据状态驱动页面状态  设计
  // 变/常量 -> 数据(数据绑定 data binding & data driving)
  // 不需要 dom 编程 -> 数据状态(响应式，修改状态， 界面会跟着变)
  // 数据有不同的状态，界面有不同的状态
  // null 初始值 loading 加载中 ready llm准备好了
  const [status, setStatus] = useState(null)
  // 错误对象数据状态
  const [error, setError] = useState(null)
  // 加载信息
  const [loadingMessage, setLoadingMessage] = useState("开始加载")
  // 输入框内容
  const [input, setInput] = useState("")
  // const [progressItems, setProgressItems] = useState([
  // {
    // text: 'model.onnx',
    // percentage: 0,
    // total: 37521985789
  // },
  // {
    // text: 'model2.onnx',
    // percentage: 10,
    // total: 35521985782
  // }
// ])
  // js 脚本 数据逻辑交互
  // const [count, setCount] = useState(0)
  // 组件生命周期 副作用
  // 组件挂载后,附带做什么
  // useEffect(() => {
    // console.log('组件挂载完成')
    // setTimeout(() => {
      // setStatus('ready')
    // }, 2000)
  // }, [])
  // console.log('组件函数执行')
  // 返回html jsx
  // return (
    // <div className="flex">
      {/* Hello World!{count}{status} */}
      {/* <h1 className="text-3xl font-bold underline">你好，世界!</h1> */}
      {/* <button onClick={() => setCount(count + 1)}>增加</button> */}
    {/* </div> */}
  // )
  
  // 检查浏览器, 导航栏是否支持 WebGPU
  // 现代浏览器的重要特性
  // !表示取反，navigator.gpu 不支持的时候 undefined
  // !! 取反两次，一定可以转换成true | false
  // 双重否定表肯定
  // @ts-expect-error 忽略类型检查
  const IS_WEBGPU_AVALABLE = !!navigator.gpu

  const onEnter = () => {
    setStatus('loading')
  }

  return (
    // flex-direction 主轴 100vh margin x 水平居中对齐
    // 原子类，组合一下
    IS_WEBGPU_AVALABLE ? (<div className="flex flex-col min-h-screen text-gray-800">
      {/* 内容区：flex-1 占满剩余空间，内部居中 */}
      <div className="flex-1 flex flex-col mx-auto items-center justify-center">
        <div className="flex flex-col items-center mb-1 max-w-[400px] text-center">
          <h1 className="text-4xl font-bold mb-1">Deepseek R1 WebGPU</h1>
          <h2 className="font-semibold">
            A next generation reasoning model that runs locally in your browser with WebGPU acceleration.
          </h2>
        </div>
        <div className="flex flex-col items-center px-4">
          <p className="max-w-[510px] mb-4 text-center">
            You are about to load the model.
            <a
              href="https://huggingface.co/onnx-community/DeepSeek-R1-Distill-Qwen-1.5B-ONNX"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline"
            >
              DeepSeek-R1-Distill-Qwen-1.5B
            </a>
            , a 1.5B parameter reasoning LLM optimized for in-browser
              inference. Everything runs entirely in your browser with
              <a
              href="https://huggingface.co/docs/transformers.js"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              🤗&nbsp;Transformers.js
            </a>{" "}
            and ONNX Runtime Web, meaning no data is sent to a server. Once
            loaded, it can even be used offline. The source code for the demo
            is available on{" "}
          </p>
          {
            error && (
              <div className="text-red-500 text-center mb-2">
                <p className="mb-1">
                  Unable to load model due to the following error:
                </p>
                <p className="text-sm">{`${error}`}</p>
              </div>
            )
          }
          <button 
            className="border px-4 py-2 rounded-lg bg-blue-400 text-white hover:bg-blue-500 disabled:cursor-not-allowed select-none"
            disabled={status !== null || error !== null}
            onClick={() => {
              setStatus('loading')
            }}>
            Load Model
          </button>
        </div>
      </div>

      {/* 底部区：始终贴在底部 */}
      {
        status === 'loading' && (
          <div className="w-full max-w-[500px] mx-auto p-4">
            <p className="text-center mb-1">{loadingMessage}</p>
            {/* 循环输出v-for vue  react 绝对不去发明
                map 一个数组返回一个新数组
                原来的json数组 -> 渲染的进度条jsx
            */}
            {
              progressItems.map(({text, percentage, total}, i) => {
                console.log(text, percentage, total)
                return (
                  // 组件函数可以以自定义标签的方式，类html插入
                  // 开关标签的 xml 语法
                  // 自闭合标签
                  // App 的子组件
                  <Progress key={i} text={text} percentage={percentage} total={total} />
                )
              })
            }
          </div>
        )
      }

      {/* 聊天输入框 */}
      <div className="mt-2 border border-gray-300 rounded-lg w-[600px] max-w-[80%] max-h-[200px] mx-auto relative mb-3 flex">
        <textarea className="w-[550px] dark: text-gray-700 px-3 py-4 rounded-lg bg-transparent border-none 
        outline-hidden resize-none disabled:placeholder-gray-200"
        placeholder="Type your message here..."
        rows={1}
        disabled={status !== 'ready'}
        title={status==='ready' ? 'Model is ready' : 'Model not loaded yet'}
        // react 不支持双向绑定，性能不太好
        value={input}
        onInput={(e) => {
          // HTMLTextAreaElement 是 textarea 元素的类型，包含 value 属性
          // 类型断言，将 e.target 转换为 HTMLTextAreaElement 类型
          // e是通用的事件对象，所有的事件对象都有 target 属性，指向触发事件的元素
          // 但是并发任何事件的target上都有value属性，比如点击事件
          // 像表单元素则一定有value属性
          // 因此不能全部笼统的使用 e.target.value ，需要类型断言为 HTMLTextAreaElement 类型
          setInput((e.target as HTMLTextAreaElement).value)
        }}
        onKeyDown={(e) => {
          // Enter 发送消息；Shift + Enter 保留 textarea 的默认换行行为
          if (input.length > 0 && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault() // 阻止 Enter 默认插入换行
            onEnter()
          }
        }}
        >

        </textarea>
      </div>
    </div>) : (
      <div>
        <h1>你使用的浏览器不支持 WebGPU</h1>
      </div>
    )
  )
}

export default App
