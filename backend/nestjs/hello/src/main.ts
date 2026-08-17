// nestjs 按需加载
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // 实例化一个nestjs 应用
  // 面向对象思想
  // nest 可以开发的后端服务太大了
  // / 首页 由 AppModule 来服务
  // Module 是一个整体 后端最常见的MVC 模式
  // M model 数据库抽象
  // C controller 控制器 检测前端用户输入 一些控制逻辑
  // V view 视图 展示数据 html
  // localhost:3000/  /后端路由 -> AppModule -> 组织控制器controller
  // -> service 层 CRUD sql
  const app = await NestFactory.create(AppModule);
  // 启动web http 服务 3000 端口
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
