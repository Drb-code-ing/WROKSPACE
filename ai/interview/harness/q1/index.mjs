import OpenAI from 'openai'
import 'dotenv/config'


const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KE,
  baseURL: process.env.BASE_URL,
})

const askLLM = async (prompt) => {
  const res = await client.chat.completions.create({
    model: process.env.MODEL_NAME,
    messages: [
      {role: 'user', content: prompt}
    ]
  })
  return res.choices[0].message.content
}

// 代码打分
async function judge(code) {
  const prompt = `
  你是一个严格的代码评审，请判断下面的代码是否正确实现“数组去重函数”

  要求：
  - 只返回一个数字评分(0-10)
  - 不要解释

  代码：${code}
  `
  const res = await askLLM(prompt)
  const score = parseFloat(res)// string -> number
  return isNaN(score) ? 0 : score
}

// 评估方法
async function evaluateAll(candidates) {
  const results = []
  for(const code of candidates) {
    const score = await judge(code)
    // 存储代码和评分
    results.push({code, score})
  }
  return results
}

const generateCandidates = (prompt, n) => {
  // 创建 n 个 Promise（每个是一次独立的 LLM 调用）
  const tasks = Array.from({length: n}, () => askLLM(prompt))
  // 并发执行所有任务，等全部完成
  return Promise.all(tasks)
}

// 选择最佳代码
function pickBest(results) {
  return results.sort((a, b) => b.score - a.score)[0]
}


async function harness(prompt) {
  console.log('生成多个候选者...\n')
  // 生成多个候选者
  const candidates = await generateCandidates(prompt, 3)
  console.log('候选结果:')
  candidates.forEach((c, i) => {
    console.log(`\n---- Candidate ${i + 1}----\n ${c}`)
  })
  // 打分
  console.log(`\n Evaluate Candidates...\n`)
  const evaluated = await evaluateAll(candidates)
  evaluated.forEach((e, i) => {
    console.log(`\n---- Candidate ${i + 1}---- 评分: ${e.score}`)
  })

  const best = pickBest(evaluated)

  return best.code
}

const bestCode = await harness("请使用javascript 实现数组去重")
console.log(bestCode)