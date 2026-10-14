import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true, // 全局配置，所有模块都可以访问
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      renderPath: '/',
    }),
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
