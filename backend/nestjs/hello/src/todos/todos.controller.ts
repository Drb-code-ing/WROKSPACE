// Controller 控制器：处理 HTTP 请求，负责接收参数、校验、调用 Service、返回响应
// 不直接操作数据库，业务逻辑交给 Service
import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Delete,
  // Put,
  Patch,
} from '@nestjs/common';
import { TodosService } from './todos.service';
import type { Todo } from './todos.service';

// @Controller('todos') 的参数 'todos' 是路由前缀
// 该控制器下所有接口的完整 URL = 'todos' + 方法装饰器上的路径
// 例如 @Get() → GET /todos，@Get(':id') → GET /todos/:id
@Controller('todos')
export class TodosController {
  // 构造函数注入：声明依赖 TodosService，NestJS 自动创建并注入
  // private readonly 直接声明并赋值给 this.todosService，不用手动 new
  // readonly 表示实例属性只读，防止在类内部被误改
  constructor(private readonly todosService: TodosService) {}

  // @Get() 映射 GET 请求，路径为空 → 完整路径 GET /todos
  // 返回值会被 NestJS 自动序列化成 JSON 响应给前端
  @Get()
  findAll(): Todo[] {
    console.log('/todos controller');
    // 不自己 new Service，通过注入的实例调用业务方法
    // 这就是依赖注入：Controller 只声明「我要 TodosService」，NestJS 负责造好塞进来
    return this.todosService.findAll();
  }

  // @Get(':id') 映射 GET 请求，路径 ':id' 是路由参数占位符
  // 完整路径 = 前缀 'todos' + '/:id' → GET /todos/:id
  // 请求示例：GET /todos/42，此时 :id 匹配到 '42'
  @Get(':id')
  // @Param('id') 是参数装饰器，从 URL 路径里取名为 'id' 的路由参数
  // 'id' 这个名字要和 @Get(':id') 里的 :id 对应上
  // 取到的值赋给形参 id，类型是 string（URL 里都是字符串）
  // 如果想要数字，后续用 Number(id) 转换，或用 ParseIntPipe 自动转
  findOne(@Param('id') id: string): Todo {
    console.log(id); // 前端请求 /todos/42 时，这里打印 '42'
    return this.todosService.findOne(Number(id));
  }

  @Post()
  create(@Body('title') title: string): Todo {
    return this.todosService.create(title);
  }

  @Delete(':id')
  remove(@Param('id') id: string): { message: string } {
    this.todosService.remove(Number(id));
    return { message: '删除成功' };
  }
  // PATCH 和 PUT 都是更新资源，但语义不同：
  //
  // PUT —— 全量替换（整体更新）
  //   请求体里要带上资源的所有字段，没带的字段会被清空/设为默认值
  //   语义：用请求体整个替换掉服务端的那条资源
  //   例子：原数据 { id:1, title:'吃饭', completed:false }
  //         PUT /todos/1 body:{ title:'睡觉', completed:true }
  //         结果：整条被替换成 { id:1, title:'睡觉', completed:true }
  //   幂等：是。同一个 PUT 请求发多次，结果都一样
  //
  // PATCH —— 部分更新（局部更新）
  //   请求体里只带要改的字段，没带的字段保持原值不动
  //   语义：只修改请求体里提供的字段
  //   例子：原数据 { id:1, title:'吃饭', completed:false }
  //         PATCH /todos/1 body:{ completed:true }
  //         结果：只改 completed，title 不动 → { id:1, title:'吃饭', completed:true }
  //   幂等：严格来说不一定，但单字段 PATCH 一般幂等
  //
  // 实际项目里「只改 completed 这一个字段」用 PATCH 更符合语义
  // 这里用 @Put 是简化处理，真实场景建议拆成 @Patch
  @Patch(':id')
  update(@Param('id') id: string, @Body() patch: Partial<Todo>): Todo {
    return this.todosService.update(Number(id), patch);
  }
}
