import "dotenv/config";
import {
  ChatOpenAI, 
  OpenAIEmbeddings
} from "@langchain/openai";
import {
  Annotation,
  END,
  START,
  StateGraph
} from '@langchain/langgraph';
import { Milvus } from '@langchain/community/vectorstores/milvus';
import { z } from 'zod';

const model = new ChatOpenAI({
  model: "deepseek-v4-flash", // 注意：MODEL_NAME 是 text-embedding-v4（嵌入模型），不能做对话
  temperature: 0,
  configuration: {
    baseURL: process.env.DEEPSEEK_BASE_URL
  },
  apiKey: process.env.DEEPSEEK_API_KEY
})
const embeddings = new OpenAIEmbeddings({
  model: process.env.MODEL_NAME, // text-embedding-v4，必须与灌库时一致
  dimensions: 1024,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL
  },
  apiKey: process.env.OPENAI_API_KEY
})

const GraphState = Annotation.Root({
  question: Annotation,
  k: Annotation,
  strategy: Annotation,
  routeReason: Annotation,
  documents: Annotation,
  generation: Annotation
})

const RouteSchema = z.object({
  // 枚举
  strategy: z.enum(["simple", "complex"]),
  reason: z.string()
});
// llm 完成问题的分辨
// RouteSchema 结构化输出约束
const routeQuestionNode = async (state) => {
  console.log('___ROUTE-QUESTION___');
  // method 选择（deepseek-v4-flash 是思考模式模型，实测三个都试过）：
  // - jsonSchema（新版默认）→ 400 This response_format type is unavailable now
  // - functionCalling → 400 Thinking mode does not support this tool_choice
  // - jsonMode（json_object）→ 可用，但需在 prompt 里明确 JSON 结构
  const router = model.withStructuredOutput(RouteSchema, { method: "jsonMode" });
  const route = await router.invoke(`
  你是问答路由器，请判断用户问题是否需要外部检索。
  规则：
  - simple 常识问答、简短定义、无需特定小说细节即可回答。
  - complex: 需要《天龙八部》具体情节、人物关系、章节事实、原文细节或证据支持。

  请只输出 JSON 对象，格式为：
  {"strategy": "simple 或 complex", "reason": "判断理由"}

  用户问题： ${state.question}
  `);
  
  console.log(`路由策略：${route.strategy} ${route.reason}`)
  return {
    question: state.question,
    k: state.k,
    strategy: route.strategy,
    routeReason: route.reason
  }
}

const directAnswerNode = async (state) => {
  console.log('___DIRECT-ANSWER___')
  process.stdout.write("\n[AI 回答 (流式)]\n")
  let generation = ""
  const stream = await model.stream(`你是一个中文回答助手，请直接回答问题。
    问题：${state.question}
  `)
  for await (const chunk of stream) {
    const text = typeof chunk.content === 'string' ? chunk.content : ""
    if(!text) continue
    generation += text
    process.stdout.write(text)
  }
  process.stdout.write("\n")
  return {
    question: state.question,
    k: state.k,
    strategy: state.strategy,
    routeReason: state.routeReason,
    documents: [],
    generation
  }
}

let vectorStore
async function retrieveRelevantContent(question, k=5) {
  try {
    const docsWithScores = await vectorStore.similaritySearchWithScore(question, k)
    return docsWithScores.map(([doc, score]) => ({
      score,
      content: doc.pageContent,
      id: doc.metadata?.id ?? "unknown",
      book_id: doc.metadata?.book_id ?? "未知",
      chapter_num: doc.metadata?.chapter_num ?? "未知",
      index: doc.metadata?.index ?? "未知",
      // doc.pageContent
      // doc.metadata 元数据
    }))
  } catch (error) {
    console.error("Error retrieving relevant content:", error)
    return []
  }
}


const retrieveNode = async (state) => {
  const documents = await retrieveRelevantContent(state.question, state.k)
  return {
    question: state.question,
    k: state.k,
    documents
  }
}

const generateNode = async (state) => {
  const context = state.documents.map((item, i) => `
    [片段 ${i+1}]
    章节: 第${item.chapter_num}章
    内容: ${item.content}
  `).join("\n\n---------\n\n")
  const prompt = `
  你是一个专业的《天龙八部》小说助手。基于小说内容回答问题，用准确，详细的语言。
  请根据以下《天龙八部》小说片段内容回答问题：
  ${context}
  用户问题：${state.question}

  回答要求：
  1. 如果片段中有相关信息，请结合小说内容给出详细、准确的回答
  2. 可以综合多个片段的内容，提供完整的答案
  3. 如果片段中没有相关信息，请如实告知用户
  4. 回答要准确，符合小说的情节和人物设定
  5. 可以引用原文内容来支持你的回答
  
  AI 助手的回答：
  `
  process.stdout.write("\n[AI回答（流式）]\n")
  let generation = ""  
  const stream = await model.stream(prompt)
  for await (const chunk of stream) {
    const text = typeof chunk.content === "string" ? chunk.content : ""
    if(!text) continue
    generation += text
    process.stdout.write(text)
  }
  return { generation }
}

const decideNext = (state) => {
  return state.strategy === "simple" ? "direct_answer" : "retrieve"
}

const graph = new StateGraph(GraphState)
  .addNode("route_question", routeQuestionNode)
  .addNode("direct_answer", directAnswerNode)
  .addNode("retrieve", retrieveNode)
  .addNode("rag_generate", generateNode)
  .addEdge(START, "route_question")
  .addConditionalEdges("route_question", decideNext, {
    direct_answer: "direct_answer",
    retrieve: "retrieve"
  })
  .addEdge("retrieve", "rag_generate")
  .addEdge("rag_generate", END)
  .addEdge("direct_answer", END)
  .compile()

const drawable = await graph.getGraphAsync()
const mermaid = drawable.drawMermaid({ withStyle: true })
console.log(mermaid)

async function main() {
  const question = "阿朱和乔峰是怎么认识的？"; // complex：需要检索小说情节
  const k = 5
  vectorStore = await Milvus.fromExistingCollection(embeddings, {
    collectionName: "ebook_collection",
    url: "localhost:19530",
    textField: "content",
    primaryField: "id",
    vectorField: "vector",
    indexCreateOptions: {
      metric_type: "COSINE",        // 必须与建索引时一致，搜索时会自动带上
      // 实际索引是 ebook-writter 建的 IVF_FLAT（nlist 1024），
      // fromExistingCollection 不会重建索引，这里声明只决定默认搜索参数的形状
      index_type: "IVF_FLAT",
      // IVF_FLAT 的搜索参数：查 16 个桶（默认 10，调大召回更准、更慢）
      search_params: { nprobe: 16 }
    }
  })

  try {
    await vectorStore.client.loadCollection({collection_name: "ebook_collection"})
    console.log("集合已加载")
    const result = await graph.invoke({
      question,
      k, // 检索数量
      routeReason: "",
      documents: [],
      generation: ""
    })
    console.log(result)
  } catch (error) {
    if (!error.message.includes("already loaded")) {
      throw error
    }
    console.log('集合已经处于加载状态')
  }
}

main()
 .catch(err => console.error(err))