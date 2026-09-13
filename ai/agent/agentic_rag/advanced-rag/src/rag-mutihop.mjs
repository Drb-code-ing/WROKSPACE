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
  subQuestions: Annotation,
  nextSubIdx: Annotation, // 下一个子问题的索引 用于跳出循环
  currentQuery: Annotation, // 当前子问题
  retrieveCount: Annotation, // 检索次数
  maxRetrievals: Annotation, // 最大检索次数
  plannedNext: Annotation, // 计划下一个子问题
  documents: Annotation,
  generation: Annotation
})

const RouteSchema = z.object({
  // 枚举
  strategy: z.enum(["simple", "complex"]),
  reason: z.string()
})

const DecomposeSchema = z.object({
  sub_questions: z.array(z.string()).min(1).max(8), // max 加在数组上：最多 8 条（原写法限的是每条 8 个字）
  reason: z.string()
})
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
    routeReason: route.reason,
    retrieveCount: 0, // 检索次数
    maxRetrievals: state.maxRetrievals ?? 8, // 最大检索次数
    documents: [],
    subQuestions: [],
    nextSubIdx: 0, // 下一个子问题的索引 用于跳出循环
    currentQuery: '',
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

// plan llm + prompt
const decomposeQuestionNode = async (state) => {
  console.log('___DECOMPOSE-QUESTION___')
  const decomposer = model.withStructuredOutput(DecomposeSchema, { method: "jsonMode" })
  const out = await decomposer.invoke(`
   你是《天龙八部》对多跳回答的【子问题拆解器】
   用户原始问题：
   ${state.question}

   任务：将问题拆成**有序**子问题列表 sub_questions，用于**依次向量检索**。要求：
   1. 链式推理、多层关系、应果先后的问题，必须拆成多条；单跳即可答的也可只输出1条。
   2. 每条子问题必须是**可独立检索**的完整中文问句，**禁止**使用「他/她/此人/上文」等指代；可写全人物名与事件名。
   3. 顺序必须符合推理链：先搞清前置实体/事实，再查后续结论。
   4. **不要**把整句原题原样复制成唯一一条（除非确实无法拆分）；不要拆成过碎的关键词列表。
   5. 输出 1～8 条即可。

   请只输出 JSON 对象，格式为：
   {"sub_questions": ["子问题1", "子问题2", ...], "reason": "拆解理由"}
  `)
  // 去除空格，排除不需要的question
  const subQuestions = out.sub_questions.map((s) => s.trim()).filter(Boolean)
  if(subQuestions.length === 0) {
    throw new Error("decompose_question: sub_questions 为空")
  }

  console.log(`拆解${subQuestions.length}条子问题(${out.reason || "无理由"})`)
  subQuestions.forEach((q, i) => {
    console.log(`[${i+1}] ${q}`)
  })
  return {
    subQuestions,
    nextSubIdx: 0,
    currentQuery: subQuestions[0],
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

// 合并去重
function mergeUnique(existingDocs, newDocs) {
  const map = new Map()
  for(const d of [...existingDocs, ...newDocs]) {
    const key = String(d.id)
    const prev = map.get(key)
    if(!prev || +d.score > +prev.score) {
      map.set(key, d)
    }
  }
  return [...map.values()].sort((a, b) => +b.score - +a.score)
}

const retrieveNode = async (state) => {
  const subs = state.subQuestions ?? []
  const idx = state.nextSubIdx ?? 0
  const q = subs[idx]?.trim() // 当前子问题

  if(!q) {
    throw new Error(`retrieve: 子问题下标${idx} 无有效文本，共${subs.length}条`)
  }
  const round = (state.retrieveCount ?? 0) + 1
  console.log(`------第${round}轮 子问题：${idx+1}/${subs.length}------`)
  console.log(`------查询：${q}------`)
  const newDocs = await retrieveRelevantContent(q, state.k)
  // 多轮检索可能有重复，浪费资源
  // 重复可能让llm 认为我们在强调，错觉
  const merged = mergeUnique(state.documents ?? [], newDocs)
  if(newDocs.length === 0) {
    console.log(`第${round}轮 无新文档`)
  } else {
    console.log(`第${round}轮 新文档${newDocs.length}条, 合并去重后${merged.length}条`)
    newDocs.forEach((item, i) => {
      const preview = item.content.length > 120
      ? `${item.content.substring(0, 120)}...`
      : item.content
      console.log(`[R${i+1}] score=${+item.score.toFixed(4)} chapter=${item.chapter_num} index=${item.index}`)
      console.log(`${preview}`)
    })
  }

  return {
    documents: merged,
    retrieveCount: round,
    nextSubIdx: idx + 1,
    currentQuery: q,
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

const afterRoute = (state) => {
  return state.strategy === "simple" ? "direct_answer" : "decompose_question"
}

// 多跳循环的判断：还有子问题 且 未超检索上限 → 继续 retrieve；否则 → 生成
const planNextStepNode = (state) => {
  const subs = state.subQuestions ?? []
  const idx = state.nextSubIdx ?? 0
  const count = state.retrieveCount ?? 0
  const max = state.maxRetrievals ?? subs.length
  if (idx < subs.length && count < max) return "retrieve"
  return "rag_generate"
}

const graph = new StateGraph(GraphState)
  .addNode("route_question", routeQuestionNode)
  .addNode("direct_answer", directAnswerNode)
  .addNode("decompose_question", decomposeQuestionNode)
  .addNode("retrieve", retrieveNode)
  .addNode("rag_generate", generateNode)
  .addEdge(START, "route_question")
  .addConditionalEdges("route_question", afterRoute, {
    direct_answer: "direct_answer",
    decompose_question: "decompose_question"
  })
  .addEdge("decompose_question", "retrieve")
  .addConditionalEdges("retrieve", planNextStepNode, {
    retrieve: "retrieve",          // 还有子问题 → 自循环回到 retrieve
    rag_generate: "rag_generate"   // 子问题查完 → 去生成
  })
  .addEdge("rag_generate", END)
  .addEdge("direct_answer", END)
  .compile()

const drawable = await graph.getGraphAsync()
const mermaid = drawable.drawMermaid({ withStyle: true })
console.log(mermaid)

async function main() {
  const question = "《天龙八部》中【四大恶人】排行第二的是谁呢？此人之子在身世揭晓前，在江湖上的身份是什么" // complex：需要检索小说情节
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
      subQuestions: [],
      nextSubIdx: 0,
      retrieveCount: 0,
      maxRetrievals: 8, // 安全上限：防止拆解异常导致无限循环
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