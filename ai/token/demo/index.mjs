import { getEncoding } from 'js-tiktoken'
// decode 解码
// gpt 官方的token编码器 cl100k_base
const enc = getEncoding('cl100k_base')
const text = "Hello tiktoken! 你好, 世界"
// llm 编码器
const tokens = enc.encode(text)
// console.log("Token IDs:", tokens, tokens.length)
const decodeText = enc.decode(tokens)// 解码tokens为文本
console.log("Decoded Text:", decodeText)
