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
  chunkOverlap: 80,
})