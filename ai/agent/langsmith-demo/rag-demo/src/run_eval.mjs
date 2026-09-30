// RAG 量化评估
import 'dotenv/config'
import { Client } from 'langsmith'
import { evaluate } from 'langsmith/evaluation'
import { ask } from './rag_agent.mjs'
import { ragEvaluators } from './evaluators.mjs'

const DATASET_NAME = 'rag_eval_v1'
const client = new Client({
  apiKey: process.env.LANGSMITH_API_KEY,
})

async function runRagAgent(inputs) {
  const { answer, context } = await ask(inputs.question)
  return {
    answer,
    context: context.map(d => d.pageContent)
  }
}

async function main() {
  // 注意签名：evaluate(target, config) 两个参数，不是一个大对象
  const result = await evaluate(runRagAgent, {
    data: DATASET_NAME,
    evaluators: ragEvaluators,
    client,
    experimentPrefix: `rag-openevals-${process.env.MODEL_NAME ?? 'qwen'}`,
    maxConcurrency: 2 // 最大并发数
  })
}

main()
 .catch(err => {
  console.error(err)
  process.exit(1)
 })