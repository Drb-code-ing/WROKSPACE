import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './ai/ai.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    AiModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/ai/*path'],
    }),
    ConfigModule.forRoot({
      isGlobal: true, // 全局配置模块
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
