import {
  Annotation, // 注释 工作流的状态值的描述 数据 state
  END, // 结束节点
  START,  // 开始节点
  StateGraph // 状态图 流程编排器 节点的组织
} from '@langchain/langgraph';

const StateAnnotation = Annotation.Root({
  tries:Annotation({
    reducer: (_prev, next) => next,
    defaultValue: 0,
  }),
  ok: Annotation({
    reducer: (_prev, next) => next,
    default: () => false
  }),
  message: Annotation({
    reducer: (_prev, next) => next,
    default: () => ''
  })
});

const attempt = (state) => {
  const tries = state.tries + 1;
  const ok = tries >= 3;
  return {
    tries,
    ok,
    message: ok ? `第${tries}次成功` : `第${tries}次失败`
  }
}

const graph = new StateGraph(StateAnnotation)
  .addNode("attempt", attempt)
  .addEdge(START, "attempt")
  .addConditionalEdges("attempt", (state) => state.ok ? "done": "retry", {
    retry : "attempt",
    done: END
  })
  .compile();

const drawable = await graph.getGraphAsync();
const mermaid = drawable.drawMermaid({ withStyles: true });
console.log(mermaid);
// langchain langgraph 共享底层想同基础设施 llm 
console.log("result:", await graph.invoke({tries: 0}))