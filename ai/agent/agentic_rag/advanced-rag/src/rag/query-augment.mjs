import { ChatPromptTemplate } from '@langchain/core/prompts' // 1.x 后统一用 @langchain/* 作用域包，'langchain/core/...' 是 0.x 旧路径
import * as z from 'zod'

export const QueryAugmentSchema = z.object({
  queries: z
    .array(z.string())
    .length(3)
    .describe('恰好3条中文检索语句：不同角度改写或扩写，保留订单号、品牌等字面信息，不要编造事实'),
})

const AUGMENT_PROMPT = ChatPromptTemplate.fromMessages([ // 收消息数组用 fromMessages，fromTemplate 只收字符串模板
  [
    "system",
    `用户会给出一句中文问题。请另外写出恰好3条检索用的问句（与原意一致，角度尽量不同），
    便于搜索引擎或向量库分别召回：
    可改写说法、换提问角度、或略加限定词；专有名词、型号、订单号等必须保留原样。
    请只输出 JSON 对象，格式为：{{"queries": ["检索句1", "检索句2", "检索句3"]}}
    （花括号写两遍 {{}} 是模板转义，渲染后就是单个花括号的 JSON 示例）
    `
  ],
  [
    "human",
    "{query}"
  ],
])

function normalizeThreeQueries(original, list) {
  const out = (list ?? [])
    .map((s) => (typeof s === 'string') ? s.trim() : "")
    .filter(Boolean)
  
    while(out.length < 3) out.push(original)
    
    return out.slice(0, 3)
}

// 对查询进行增强
export async function augmentQuery(chatModel, query) {
  // deepseek-v4-flash 思考模式：jsonSchema/functionCalling 都 400，只能 jsonMode + prompt 写明 JSON 格式
  const structured = chatModel.withStructuredOutput(QueryAugmentSchema, { method: "jsonMode" });
  // pipe 用来组合 prompt template 和 struct output
  const chain = AUGMENT_PROMPT.pipe(structured); 

  try {
    const result = await chain.invoke({ query });
    return { queries: normalizeThreeQueries(query, result.queries) }
  } catch (error) {
    console.error('Error augmenting query:', error);
    throw error;
  }
}

// 从增强后的查询中提取检索语句
export function retrievalQueryString(original, augmentation) {
  return [original, ...augmentation.queries ?? []]
    .map(s => typeof s === 'string' ? s.trim() : '')
    .filter(Boolean)
}