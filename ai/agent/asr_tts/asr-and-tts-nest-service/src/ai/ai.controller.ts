import { Controller, Sse, Query } from '@nestjs/common';
import { AiService } from './ai.service';
import { from, map } from 'rxjs';

@Controller('ai')
export class AiController {
  // 自动注入 AiService 实例，方便调用服务方法
  constructor(private readonly aiService: AiService) {}

  @Sse('chat/stream') // 支持sse 流式输出的路由，nestjs 提供的装饰器
  // 支持查询参数 query
  chatStream(@Query('query') query: string) {
    // 持续输出
    console.log(query);
    return from(this.aiService.streamChain(query)).pipe(
      map((chunk) => ({ data: chunk })),
    );
  }
}
