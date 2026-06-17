import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();
// llm cient 对象
const clint = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL
});
// export const a = 2; // 直接导出
// export const b = 3;
export default clint; // 默认导出 只能有一个
