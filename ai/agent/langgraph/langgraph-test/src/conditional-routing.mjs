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
    
  }
}