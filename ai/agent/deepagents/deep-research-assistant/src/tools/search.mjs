import { tool } from "langchain"
import { z } from "zod"
import 'dotenv/config'

const BOCHA_API_URL = "https://api.bochaai.com/v1/web-search"

// 格式化网页内容的方法
function formatWebpages(webpages) {
  return webpages
    .map(
      (page, idx) =>
        `引用: ${idx + 1}
         标题: ${page.name ?? ""}
         URL: ${page.url ?? ""}
         摘要: ${page.summary ?? ""}
         网站名称: ${page.siteName ?? ""}
         网站图标: ${page.siteIcon ?? ""}
         发布时间: ${page.dateLastCrawled ?? ""}`,
    )
    .join("\n\n");
}


async function bochaWebSearch(query, count) {
  const apiKey = process.env.BOCHA_API_KEY?.trim()
  if (!apiKey) {
    throw new Error("Bocha API Key 未配置")
  }
  const response = await fetch(BOCHA_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query,
      count,
      freshness: "nolimit", // 时效性限制
      summary: true // 是否返回摘要
    })
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Bocha API 调用失败，状态码：${response.status}，错误信息：${errorText}`)
  }

  let json
  try {
    json = await response.json()
  } catch (error) {
    throw new Error(`Bocha API 响应解析失败，错误信息：${error.message}`)
  }
  
  try {
    if(json.code !== 200 || !json.data) {
      return `搜索API 请求失败，错误信息：${json.msg || "未知错误"}`
    }
    const webpages = json.data.webpages?.value ?? []
    if(!webpages) {
      return `未找到与[${query}]相关的网页内容`
    }
    return formatWebpages(webpages) // 格式化网页内容
  } catch (error) {
    throw new Error(`Bocha API 响应处理失败，错误信息：${error.message}`)
  }
}

export const webSearch = tool(
  async (input) => {
    const count = input.count || 10
    console.log(`搜索关键词：${input.query}，返回${count}条结果`)
    return bochaWebSearch(input.query, count)
  },
  {
    name: "web-search",
    description: `
    使用Bocha 联网搜索API 检索互联网网页。输入中文或中英结合的搜索关键词，
    可选count指定结果数量。
    `,
    schema: z.object({
      query: z
      .string()
      .min(1)
      .describe("搜索关键词，优先使用中文，例如：2026年AI Agent 框架对比、LangGraph 最新动态")
    }),
    count: z.number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .describe( "返回结果数量，默认10条")
  }
)