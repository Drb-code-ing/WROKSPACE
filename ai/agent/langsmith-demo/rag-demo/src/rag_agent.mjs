// langgraph 设计图
// compile Agent
import "dotenv/config"
import { Annotation, END, START, StateGraph } from '@langchain/langgraph'
import { ChatPromptTemplate } from '@langchain/core/prompts'
// 把模型输出解析成纯字符串
import { StringOutputParser } from '@langchain/core/output_parsers'
// 链式编排：把 prompt → LLM → parser 像管道一样串起来，上一步输出自动作为下一步输入
import { RunnableSequence } from '@langchain/core/runnables'
import { Milvus } from '@langchain/community/vectorstores/milvus'
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai' // ChatOpenAI 是 Runnable，能直接进链

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL ?? 'text-embedding-v3',
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  }
})

const LLM = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL ?? 'qwen-plus',
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
  temperature: 0,
})

const vectorStore = await Milvus.fromExistingCollection(embeddings, {
  collectionName: process.env.MILVUS_COLLECTION ?? 'rag_docs',
  url: process.env.MILVUS_URL ?? 'http://localhost:19530',
})
// 从向量数据库中检索
// k: 检索的文档数量
const retriever = vectorStore.asRetriever({k: 4})

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是客服助手。仅根据下面[上下文]回答用户问题：上下文没有的信息请明确说明不知道，不要编造。\n\n
    上下文：{context}`
  ],
  [
    "human",
    "{question}"
  ]
])
// 线性的
const chain = RunnableSequence.from([prompt, LLM, new StringOutputParser()])

const GraphState = Annotation.Root({
  question: Annotation,
  context: Annotation,
  answer: Annotation,
})

async function retrieve(state) {
  const docs = await retriever.invoke(state.question)
  return { context: docs }
}

async function generate(state) {
  const contextText = state.context.map(doc => doc.pageContent).join('\n\n')
  const answer = await chain.invoke({
    question: state.question,
    context: contextText,
  })
  return { answer }
}

const workflow = new StateGraph(GraphState)
 .addNode('retrieve', retrieve)
 .addNode('generate', generate)
 .addEdge(START, 'retrieve')
 .addEdge('retrieve', 'generate')
 .addEdge('generate', END)

export const ragApp = workflow.compile()

export async function ask(question) {
  const result = await ragApp.invoke({ question })
  return {
    answer: result.answer,
    context: result.context ?? [],
  }
}