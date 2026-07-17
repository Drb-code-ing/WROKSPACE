import 'dotenv/config'
import "cheerio"
// 从url 加载文档
import {
  // loader 按url 加载
  CheerioWebBaseLoader
} from '@langchain/community/document_loaders/web/cheerio'
// 文本分割器
import {
  // 递归字符分割器
  RecursiveCharacterTextSplitter
} from '@langchain/textsplitters'
import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory'
import {
  ChatOpenAI,
  OpenAIEmbeddings
} from '@langchain/openai'


const model = new ChatOpenAI(
  {
    temperature: 0,
    model: 'deepseek-v4-pro',
    apiKey: process.env.DEEPSEEK_API_KEY,
    configuration: {
      baseURL: process.env.DEEPSEEK_BASE_URL,
    }
  }
)

const embedding = new OpenAIEmbeddings(
  {
    apiKey: process.env.QENWEN_API_KEY,
    model: 'text-embedding-v4',
    batchSize: 10,// 每次处理 10 个文档
    configuration: {
      baseURL: process.env.QENWEN_BASE_URL,
    }
  }
)

// 访问网址，提取文档内容
// cheerio 可以传递css 选择器 来提取文档的内容
// 爬取 + Document 标准
const cheerioLoader = new CheerioWebBaseLoader(
  'https://juejin.cn/post/7662627075258449946',
  {
    selector: '.main-area p',
  }
)
// 大的document 分成小的document 更加精细的去处理语义
// 按段落划分？语义分段，段落太长，段落太短？
// 目的是语义精确 重点
// 句子 。！？适合  ，不适合
// chunk 大小  400字符
const documents = await cheerioLoader.load()// 加载文档
// console.log(documents)

// 切片
// 语义排第一位
// 按大小来切割，chunkSize 就够了
// 为了语义的完整。少一点
// 递归 尝试不同的分割符，找到最优的分割符，使每个chunk 都有语义
// 切接近chunkSize
// 不完美的地方，直接硬切chunkOverlap 来补救，重叠
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 400,// 每个chunk 大小
  separators: ['。', '！', '？'],// 分隔符，分割器按顺序递归尝试
  // 文字会被中间切断语义？通篇没有标点  菜单 佛经 古文等
  // 如果切断了，就会overlap 空间来补救
  chunkOverlap: 80,
})

const splitDocuments = await textSplitter.splitDocuments(documents)
console.log(splitDocuments)
console.log(`文档切割完成，共切割${splitDocuments.length}个chunk`)
console.log('创建向量存储')

const vectorStore = await MemoryVectorStore.fromDocuments(
  splitDocuments,
  embedding
)
console.log('向量存储创建完成')
// 检索器
const retriever = vectorStore.asRetriever()
console.log('检索器创建完成')


const question = "retrieve和similaritySearchWithScore 有什么区别？";
console.log('='.repeat(80));
console.log(question);
console.log('='.repeat(80));
// 检索 相关文档
// invoke 执行 
// 内部逻辑， 将question 转为向量 
// 在向量数据库中计算距离 返回K 个Document对象
// 工作流编排
const docs = await retriever.invoke(question);
console.log(docs);
// 还想要打分 本来没有必要
// 向量的距离 越小就越相似
const scoredResults = 
  await vectorStore.similaritySearchWithScore(question, 3);
console.log(scoredResults);

console.log("\n [检索到的文档及相似度评分]");
docs.forEach((doc, i) => {
  const scoredResult = scoredResults.find(([scoredDoc]) => 
    scoredDoc.pageContent === doc.pageContent
  )
  // retriever 过滤， rerank 
  // 1- 值越大越相似，cosine 
  const score = scoredResult? scoredResult[1]: null;
  const similarity = score != null ? (1 - score).toFixed(4):
  "N/A"

  console.log(`\n[文档 ${i + 1}] 相似度指标: ${similarity} (原始分: ${score})`);
  console.log(`内容: ${doc.pageContent.substring(0, 50)}...`); // 只打印前50字避免刷屏
  console.log(`元数据：章节=${doc.metadata.chapter}, 角色=${doc.metadata.character}, 类型=${doc.metadata.type}`);
});

// Augmented
const context = docs
  .map((doc, i) => `[片段${i}]\n ${doc.pageContent}`)
  .join("\n\n-----\n\n");

const prompt = `你是一个文章辅助阅读助手，根据文章内容回答问题。

文章内容:
${context}

问题：${question}

你的回答:`;

const response = await model.invoke(prompt);
console.log(response.content);