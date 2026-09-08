import {
  Annotation, // 注释 工作流的状态值的描述 数据 state
  END, // 结束节点
  START,  // 开始节点
  StateGraph, // 状态图 流程编排器 节点的组织
  Command, // 命令节点
  interrupt // 中断节点
} from '@langchain/langgraph';

// graph 设计图
const StateAnnotation = Annotation.Root({
  actionSummary: Annotation({
    reducer: (_prev, next) => next,
    default: () => ""
  }),
  userInput: Annotation({
    reducer: (_prev, next) => next,
    default: () => ""
  })
})

const showTransfer = () => ({
  actionSummary: "向张三转账 $100"
})

const waitConfirm = (state) => {
  const text = interrupt({ // 中断
    hint: "终端里输入[确认]或者备注后回车，图才会继续",
    actionSummary: state.actionSummary
  });
  return { userInput: String(text) }
}

const graph = new StateGraph(StateAnnotation)
  .addNode("showTransfer", showTransfer)
  .addNode("waitConfirm", waitConfirm)
  .addEdge(START, "showTransfer")
  .addEdge("showTransfer", "waitConfirm")
  .addEdge("waitConfirm", END)
  .compile({ checkpointer: new MemorySaver()})


  const drawable = await graph.getGraphAsync();
  const mermaid = drawable.drawMermaid({ withStyles: true });
  console.log(mermaid);