// Record<K, V> 是TS 内置工具类型，表示建为K，值为V的类型
type PromptVars = Record<string, string | number>

const promptTemplate = "你是一个{role}，请用{language}回答用户问题: {question}"
// 告诉ts 这个函数支持接收一个自定义类型T，要求T 必须是PromptVars 的子类型
function parsePrompt<T extends PromptVars>(
  template: string,
  vars: T,
  defaults: Partial<T> = {},
): string {
  const values = {
    ...defaults,
    ...vars,
  }
  return template.replace(
    /\{(\w+)\}/g,
    (_, key: string) => {
      if(!(key in values)) {
        throw new Error(`缺少变量: ${key}`)
      }
      return String(values[key])
    },
  )
}

const result = parsePrompt<PromptVars>(
  promptTemplate,
  {
    role: "AI 助手",
    language: "中文",
    question: "什么是TypeScript",
  },
  {
    language: "中文",
  }
)

console.log(result)

try {
  const result2 = parsePrompt<PromptVars>(
  promptTemplate,
  {
    role: "AI 助手",
    language: "中文",
    // question: "什么是TypeScript",
  },
  {
    language: "中文",
  }
)

console.log(result2)

} catch (error) {
  console.error(error)
}
