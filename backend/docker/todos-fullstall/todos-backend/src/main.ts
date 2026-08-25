import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 启用 CORS：允许跨域请求（前端和 Nginx 在不同端口/域名时可访问本后端）
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
