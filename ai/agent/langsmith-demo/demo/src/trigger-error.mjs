import 'dotenv/config'
// 自动的根据.env langsmith 配置去 trace
import {
  Annotation,
  END,
  START,
  StateGraph
} from '@langchain/langgraph'

const StateAnnotation = Annotation.Root({
  text: Annotation({
    reducer: (_prev, next) => next,
    default: () => ""
  })
})

const stepOk = (state) => ({ text: `${state.text}[ok]` })
const stepThrow = () => {
  throw new Error("DemoError: 节点内故意报错: (trigger-error.mjs)")
}

const graph = new StateGraph(StateAnnotation)
  .addNode("step_ok", stepOk)
  .addNode("step_throw", stepThrow)
  .addEdge(START, "step_ok")
  .addEdge("step_ok", "step_throw") // 走到故意抛错的节点
  .addEdge("step_throw", END)
  .compile()

  try {
    await graph.invoke({ text: "start" })
    console.log("不应执行")
  } catch (error) {
    console.error("已捕获", error?.message ?? error)
    process.exitCode = 1
  }
