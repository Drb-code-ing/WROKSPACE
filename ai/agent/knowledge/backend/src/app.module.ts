import { Module, ValidationPipe } from '@nestjs/common';
// 全局 DTO 校验：通过 APP_PIPE 注册，等效于 app.useGlobalPipes()
import { APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AppController],
  providers: [
    AppService,
    // 全局 DTO 校验：通过 APP_PIPE 注册，等效于 app.useGlobalPipes()
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true, // 按 DTO 类型自动转换（如字符串转数字）
        whitelist: true, // 剔除 DTO 中未声明的字段
        forbidNonWhitelisted: true, // 出现多余字段直接报 400
        transformOptions: { enableImplicitConversion: true },
      }),
    },
  ],
})
export class AppModule {}
