import {
  Annotation, // 注释 工作流的状态值的描述
  END, // 结束节点
  START, // 开始节点
  StateGraph, // 状态图 流程编排 节点的组织
} from '@langchain/langgraph'

const StateAnnotation = Annotation.Root({
  query: Annotation({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
  route: Annotation({
    reducer: (_prev, next) => next,
    default: () => 'chat',
  }),
  answer: Annotation({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
})
// 节点声明
const router = (state) => {
  const isMath = /[+\-*/]/.test(state.query)
  return {
    route: isMath ? 'math' : 'chat',
  }
}

const mathNode = (state) => {
  try {
    return { answer: String(eval(state.query)) }
  } catch (error) {
    return { answer: '数学表达式有误' }
  }
}

const chatNode = (state) => {
  return { answer: `你说的是：${state.query}` }
}

const graph = new StateGraph(StateAnnotation)
  .addNode('router', router)
  .addNode('math', mathNode)
  .addNode('chat', chatNode)
  .addEdge(START, 'router')
  .addConditionalEdges('router', (state) => state.route, {
    math: 'math',
    chat: 'chat',
  })
  .addEdge('math', END)
  .addEdge('chat', END)
  .compile()
 
const drawable = await graph.getGraphAsync()
const mermaid = drawable.drawMermaid({ withStyle: true })
// console.log(mermaid)

const result = await graph.invoke({ query: '1+2' })
console.log(result)