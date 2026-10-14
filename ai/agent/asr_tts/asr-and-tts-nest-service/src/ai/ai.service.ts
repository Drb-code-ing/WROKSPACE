import { Injectable, Inject } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
// Runnable 是 LangChain 所有可调用组件的统一接口基类（模型/Prompt/Chain 都实现了它）
// 用它作类型而不是具体类，换模型时这里零改动
import type { Runnable } from '@langchain/core/runnables';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

@Injectable()
export class AiService {
  private readonly chain: Runnable;
  // 注入工厂造好的模型实例，仅在构造时用于组装 chain
  constructor(@Inject('CHAT_MODEL') model: ChatOpenAI) {
    const prompt = PromptTemplate.fromTemplate(`
    请回答以下问题： \n\n {query}
    `);
    this.chain = prompt.pipe(model).pipe(new StringOutputParser());
  }
  // Es6 提供的生成器函数 Generator Function
  // async 函数只会返回一次
  // 这个多次返回，不断地返回，支持sse，不用一次返回所有结果
  async *streamChain(query: string) {
    // 流式输出
    const stream = await this.chain.stream({ query });
    for await (const chunk of stream) {
      yield chunk;
    }
  }
}
