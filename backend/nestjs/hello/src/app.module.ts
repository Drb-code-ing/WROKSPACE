import { Module } from '@nestjs/common';
// 控制器 检测前端用户输入 一些控制逻辑
import { AppController } from './app.controller';
// 数据库业务 一些复杂业务 CRUD service 层
import { AppService } from './app.service';
import { TodosModule } from './todos/todos.module';

// 装饰器模式
// 快速的给类添加一些行为或方法
// ts 支持
@Module({
  imports: [TodosModule], // 依赖外界？
  controllers: [AppController], // 控制器 管理、效验简单逻辑
  providers: [AppService], // data service 复杂业务
})
export class AppModule {}
