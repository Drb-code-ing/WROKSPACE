import 'dotenv/config';
// 被截断的数组 -> 字符串拼接 -> ai summarization
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';
import { 
  SystemMessage,
  HumanMessage,
  AIMessage, 
  getBufferString,
  trimMessages
  // langchain 自带的history 裁剪工具， 留下最近的
  // 被裁剪的老消息 （总结）， 留下来的来（history clear, 新的messages ）
} from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { getEncoding } from 'js-tiktoken';

const model = new ChatOpenAI({
  modelName:process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  }
});

function countTokens(messages, encoder) {
  let total = 0;
  for (const msg of messages) {
    const content = typeof msg.content === 'string'? msg.content : 
    JSON.stringify(msg.content)
    total += encoder.encode(content).length;
  }
  return total;
}

async function summarizationMemoryDemo() {
  const history = new InMemoryChatMessageHistory();
  const encoder = getEncoding('cl100k_base');
  // 超过maxTokens 时触发总结
  const maxTokens = 200;
  // 保留最近消息的token 数量
  const keepRecentTokens = 80;
  const messages = [
    { type: 'human', content: '我叫李四' },
    { type: 'ai', content: '你好李四，很高兴认识你！' },
    { type: 'human', content: '我是一名设计师' },
    { type: 'ai', content: '设计师是个很有创造力的职业！你主要做什么类型的设计？' },
    { type: 'human', content: '我喜欢艺术和音乐' },
    { type: 'ai', content: '艺术和音乐都是很好的爱好，它们能激发创作灵感。' },
    { type: 'human', content: '我擅长 UI/UX 设计' },
    { type: 'ai', content: 'UI/UX 设计非常重要，好的用户体验能让产品更成功！' },
  ];

  for (const msg of messages) {
    if (msg.type === 'human') {
      await history.addMessage(new HumanMessage(msg.content));
    } else {
      await history.addMessage(new AIMessage(msg.content));
    }
  }
  let allMessages = await history.getMessages();
  const totalTokens = countTokens(allMessages, encoder);
  console.log(totalTokens);
  if (totalTokens >= maxTokens) {
    const recentMessages = [];
    let recentTokens = 0;
    for (let i = allMessages.length - 1; i >= 0; i--) {
      const msg = allMessages[i];

      const content = typeof msg.content === 'string'? msg.content: 
      JSON.stringify(msg.content);
      const msgTokens = enc.encode(content).length;

      if (recentTokens + msgTokens <= keepRecentTokens ) {
        recentMessages.unshift(msg);
        recentTokens += msgTokens;
      } else {
        break;
      }
    }

    const messagesToSummarize = allMessages.slice(0, 
      allMessages.length-recentMessages.length);
    
    const summarizeTokens = countTokens(messagesToSummarize, enc);
    const summary = await summarizeHistory(messagesToSummarize);
    // /clear /compact 
    await history.clear();
    for (const msg of recentMessages) {
      await history.addMessage(msg);
    }
    await history.addMessage(new AIMessage(summary));
  }
}

summarizationMemoryDemo()
  .catch(console.error);