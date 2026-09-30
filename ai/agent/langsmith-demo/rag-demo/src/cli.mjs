// command line
import 'dotenv/config'
import { ask } from './rag_agent.mjs'

const DEEFAULT_QUESTIONS = [
  "无理由退货要在几天内？"
]

const args = process.argv.slice(2)
console.log(args)
const question = args.length > 0 ? [args.join("")] : DEEFAULT_QUESTIONS
console.log(question)

for(let i = 0; i < DEEFAULT_QUESTIONS.length; i++) {
  const q = question[i]
  console.log(`问题 ${i + 1}: ${q}`)

  const { answer, context } = await ask(q)
  console.log(`回答: ${answer}`)
  console.log('-------------------')
  console.log(context)
}