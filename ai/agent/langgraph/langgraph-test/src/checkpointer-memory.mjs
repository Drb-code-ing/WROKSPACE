import {
  Annotation, // 注释 工作流的状态值的描述 数据 state
  END, // 结束节点
  MemorySaver, // 内存保存器
  START,  // 开始节点
  StateGraph // 状态图 流程编排器 节点的组织
} from '@langchain/langgraph';

const StateAnnotation = Annotation.Root({
  visitCount: Annotation({
    reducer: (_prev, next) => next,
    default: () => 0
  }),
  message: Annotation({
    reducer: (_prev, next) => next,
    default: () => ""
  }),
});
// 计数的 
function recordVisited(state) {
  const visitCount = state.visitCount + 1;
  const message= visitCount===1 ?"这是你在本会话里第一次进入":`这是你在本会话里第${visitCount}次进入`
  return { visitCount, message }
}

const graph = new StateGraph(StateAnnotation)
  .addNode("recordVisited", recordVisited)
  .addEdge(START, "recordVisited")
  .addEdge("recordVisited", END)


const checkpointer = new MemorySaver(); // 内存保存器
const app = graph.compile({
  checkpointer,
});

const user1= {configurable: {thread_id: "用户-小张"}}
const user2= {configurable: {thread_id: "用户-小李"}}
const user3= {configurable: {thread_id: "用户-小胡"}}
const res1 = await app.invoke({},user1);
console.log(res1);
const res2 = await app.invoke({},user2);
console.log(res2);
const res3 = await app.invoke({},user3);
console.log(res3);