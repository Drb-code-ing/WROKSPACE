import {
  createLLMAsJudge, // 创建一个LLM作为判断器
  RAG_GROUNDEDNESS_PROMPT, // RAG 幻觉检测提示词
  RAG_HELPFULNESS_PROMPT, // RAG 帮助性检测提示词（helpfulness 只有一个 L）
  RAG_RETRIEVAL_RELEVANCE_PROMPT, // RAG 检索相关性检测提示词
} from "openevals"
import { ChatOpenAI } from "@langchain/openai";

const judge = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
  model: process.env.MODEL_NAME ?? "qwen-plus",
  temperature: 0,
});

// ============ 三个"评审员"的工厂 ============
// createLLMAsJudge：把一段评审提示词 + 一个 LLM 包装成可调用的评估函数
// feedbackKey：打分结果在 LangSmith 里显示的字段名（一条 run 可以挂多个分数）
// continuous: true → 输出 0~1 的连续分数；false → 只有 0/1 二值判定
// judge：充当"评委"的模型（temperature 0，保证同一答案打分稳定）

// ① 忠实度/幻觉评估器：只看"检索到的文档 + 生成的答案"
//    判定答案是否真的基于上下文写的，有没有模型自己编的内容
const ragGroundnessJudge = createLLMAsJudge({
  prompt: RAG_GROUNDEDNESS_PROMPT,
  feedbackKey: "rag_groundness",
  judge,
  continuous: true,
});

// ② 帮助性评估器：只看"用户问题 + 生成的答案"
//    判定答案是否真的回答了问题（答非所问检测），不关心内容出处
const ragHelpfulnessJudge = createLLMAsJudge({
  prompt: RAG_HELPFULNESS_PROMPT,
  feedbackKey: "rag_helpfulness",
  judge,
  continuous: true,
});

// ③ 检索相关性评估器：只看"用户问题 + 检索到的文档"
//    判定检索阶段召回的文档是否和问题相关——分数低说明检索环节先出了问题
const ragRetrievalRelevanceJudge = createLLMAsJudge({
  prompt: RAG_RETRIEVAL_RELEVANCE_PROMPT,
  feedbackKey: "rag_retrieval_relevance",
  judge,
  continuous: true,
});

// ============ 适配层：从一条 run 里取字段喂给对应评审员 ============
// evaluate() 跑批量实验时，每条数据会带着 inputs（问题）和 outputs（你应用的返回）
// 调用约定：evaluate({ data, evaluators: ragEvaluators, target: 你的RAG应用 })

// 幻觉评估器：只取检索文档 + 答案（问题无关，所以不收 inputs）
export async function ragGroundnessEvaluator({ outputs }) {
  return ragGroundnessJudge({
    context: { documents: outputs.context},
    outputs: { answer: outputs.answer}
  })
}

// 帮助性评估器：问题 + 答案（不看出处，只看是否切题）
export async function ragHelpfulnessEvaluator({ inputs, outputs }) {
  return ragHelpfulnessJudge({
    inputs,
    outputs: {
      answer: outputs.answer,
    }
  })
}

// 检索相关性评估器：问题 + 检索文档（不看生成的答案，纯评检索环节）
export async function ragRetrievalRelevanceEvaluator({ inputs, outputs }) {
  return ragRetrievalRelevanceJudge({
    inputs,
    context: { documents: outputs.context }
  })
}

// 三个评估器一起注册，跑 evaluate() 时每条数据会各得一个分数：
// rag_retrieval_relevance（检索准不准）→ rag_groundness（答案忠实吗）→ rag_helpfulness（回答有用吗）
// 正好对应 RAG 流水线的三个环节：召回 → 生成 → 最终质量
export const ragEvaluators = [
  ragGroundnessEvaluator,
  ragHelpfulnessEvaluator,
  ragRetrievalRelevanceEvaluator,
]