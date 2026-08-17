// Todos Module 定义文件
import { Module } from '@nestjs/common';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';
// 大后端框架，MVC  试图层 不可以直接去数据库查数据
// View Controller Model
@Module({
  controllers: [TodosController],
  providers: [TodosService],
})
export class TodosModule {}
