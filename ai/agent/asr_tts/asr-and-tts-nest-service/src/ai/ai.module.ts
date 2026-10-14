import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';

@Module({
  controllers: [AiController],
  // 配置服务，注入环境变量
  providers: [
    AiService,
    {
      provide: 'CHAT_MODEL', // llm 和service 解耦 好维护
      // 工厂模式
      useFactory: (configService: ConfigService) => {
        console.log(configService.get('MODEL_NAME'));
        return new ChatOpenAI({
          modelName: configService.get<string>('MODEL_NAME'),
          apiKey: configService.get<string>('OPENAI_API_KEY'),
          configuration: {
            baseURL: configService.get<string>('OPENAI_BASE_URL'),
          },
        });
      },
      // 依赖.env 注入ConfigService
      inject: [ConfigService],
    },
  ],
})
export class AiModule {}
