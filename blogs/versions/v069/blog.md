# NestJS 初探：工厂模式、装饰器与依赖注入，如何驱动一个 MVC 后端

做了这么多天前端，第五十九天终于补上了后端的一块关键拼图——**NestJS**。它是 Node.js 生态里一个**纯后端的企业级开发框架**：默认用 TypeScript、全面模块化，天生为构建可维护的服务而设计。这一天把三件事串了起来：**什么是后端开发、两个最基础的设计模式（工厂模式、装饰器模式）怎么讲 NestJS 组织起来、以及一个完整的 Todos CRUD 模块如何从零落地。**

一句话概括：**NestJS 用「工厂模式」创建应用、用「装饰器模式」给类加能力、用「依赖注入」把 MVC 三层的对象自动装配起来。** 理解了这三条线，就能看懂 NestJS 的骨架。

---

## 一、后端开发到底做些什么

笔记开篇先问了句本质问题：后端开发做些什么？答案分三类：

```text
提供 API 接口        Web 开发
系统集成 / 并发 / AI Infra    底层服务
微服务
```

这一条很重要——**前端是"展示数据"，后端是"生产数据"**。API 接口是后端对前端唯一的交付物；再往上，并发、系统集成、AI Infra（给大模型接后端）这些，是后端更深的价值。清楚了后端是干什么的，再看 NestJS 为什么被叫作"企业级框架"就有落点了。

---

## 二、安装与目录架构：一个 `nest new` 起步

安装和启动非常直白：

```bash
npm install -g @nestjs/cli
nest new hello
npm/pnpm run start
```

`nest new hello` 会创建一个标准的 NestJS 项目，核心就两个文件：

```text
src/
  main.ts          入口文件
  app.module.ts    根模块，负责启动应用
```

`src/main.ts` 是程序的入口，NestJS 应用在这里被"创建"出来：

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // 实例化一个 nestjs 应用
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

`NestFactory.create(AppModule)` 这一行，就是**工厂模式**的第一现场（下面细说）。创建出来的应用监听 3000 端口，把请求交给根模块 `AppModule` 处理。

`src/app.module.ts` 则是**根模块**——NestJS 一切的起点：

```ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  controllers: [AppController], // 控制器 管理、校验简单逻辑
  providers: [AppService],      // data service 复杂业务
})
export class AppModule {}
```

到这里已经能看出框架的脾气：**一个模块，把控制器、服务声明在一起。** 接下来两节，就是理解为什么 NestJS 会这么设计。

---

## 三、工厂模式：23 种设计模式里第一种

设计模式是面向对象编程里的一套抽象经验，共 23 种，**工厂模式是其中最重要的第一种**。

它解决什么问题？一句话：**把"创建对象"和"使用对象"解耦。** 笔记用蜜雪冰城举了个特别贴切的例子 `factory_demo/1.mjs`。先定义几个"产品"类：

```js
class IceCream {
  constructor() {
    this.name = '冰淇淋'
    this.price = 3
  }
  show() {
    console.log(`${this.name} 价格 ${this.price} 元`)
  }
}

class LemonTea {
  constructor() {
    this.name = '柠檬茶'
    this.price = 4
  }
  show() { console.log(`${this.name} 价格 ${this.price} 元`) }
}

class MilkTea {
  constructor() {
    this.name = '珍珠奶茶'
    this.price = 8
  }
  show() { console.log(`${this.name} 价格 ${this.price} 元`) }
}
```

三种产品各自实现**相同的 `show()` 接口**。然后定义一个工厂类，集中负责"根据类型造出对应的产品"：

```js
class MixueFactory {
  static create(type) {
    switch (type) {
      case 'ice':   return new IceCream()
      case 'lemon': return new LemonTea()
      case 'milk':  return new MilkTea()
    }
  }
}

const drink1 = MixueFactory.create('ice')   // 调用方只需要 create('xxx')
drink1.show()                                // 冰淇淋 价格 3 元
const drink2 = MixueFactory.create('lemon')
drink2.show()                                // 柠檬茶 价格 4 元
```

这个 demo 把工厂模式讲透了：

1. **调用方不知道具体类**——只需要 `MixueFactory.create('ice')`，不用自己 `new IceCream()`；
2. **产品之间解耦**——工厂里新增一种产品，不影响外部调用；
3. **因为每个产品实现了相同接口**，工厂生产出来的对象，调用方可以放心地统一调用 `show()`。

再回头看 `NestFactory.create(AppModule)`——**NestFactory 正是 NestJS 提供的工厂类**，它负责"根据根模块创建出一个 NestJS 应用"。你不需要关心应用是怎么组装起来的，工厂替你做完了。这就是工厂模式在框架里的真实身份。

---

## 四、高度模块化与 MVC：App → Module → Controller → Service

工厂把应用造出来之后，怎么组织业务？答案是**高度模块化**，而且约定清晰：

```text
App -> Module
       -> @nestjs/common Module 类
       -> import 依赖项
       -> controllers 控制器  参数校验、简单逻辑，最后 return response
       -> service  服务       return 数据
```

套用后端最常见的 **MVC 模式**（笔记里三层的角色写得很明确）：

```text
M  model       数据库抽象
C  controller  检测前端用户输入、一些控制逻辑
V  view        展示数据 html
```

在 NestJS 里这个分工被翻译成：

- **Controller（控制器）**：接收 HTTP 请求、校验参数、组织简单逻辑，最后返回响应；**不直接碰数据库**；
- **Service（服务）**：承载复杂业务（CRUD、SQL），返回数据给 Controller；
- **Module（模块）**：把一组相关的 Controller + Service 组装成一个独立业务单元。

笔记有一句话非常关键：**"Module 是 nestjs 的独立业务模块"**，而 `app.module.ts` 根模块通过 `imports` 把各个业务模块装进来。看 `main.ts` 里的注释也能印证这个分层：

```ts
// / 首页 由 AppModule 来服务
// Module 是一个整体 后端最常见的MVC 模式
// /后端路由 -> AppModule -> 组织控制器controller
// -> service 层 CRUD sql
```

路由进来的请求，先被 AppModule 接手，AppModule 组织 Controller，Controller 调 Service，Service 操作数据——**一条清晰的单向流水线**。

---

## 五、装饰器模式：不改变原对象，动态加功能

NestJS 代码里满屏的 `@Module`、`@Controller`、`@Injectable`，这些都是**装饰器**。理解它，才能读懂 NestJS 的"魔法"。

装饰器模式的定义一句话：**不改变原对象，动态地给它加功能。** 写法上就是一个 `@` 符号加一个名字，放在类（或方法、参数）上面：

```text
@
class
```

`@Module({...})` 给一个类打上标记，NestJS 就知道"这是一个模块"，并读取括号里的配置去装配它；`@Controller('todos')` 告诉框架"这个类负责处理 HTTP 请求，路由前缀是 todos"；`@Injectable()` 声明"这个类可以被自动注入"。类本身的代码一行没改，能力却都"戴"上来了。

笔记里那句 **"装饰器模式用到极致"**，说的正是 NestJS 的写照。上一节看到的分层约定，全是靠装饰器声明出来的：

```ts
@Module({})          // 声明模块
@Controller('todos') // 声明控制器 + 路由前缀
@Injectable()        // 声明可注入的服务
```

理解到这里，NestJS 的骨架已经通了：**工厂模式负责创建应用，装饰器模式负责声明能力，模块化负责组织分层。** 剩下的是把这些用到一份真实代码里。

---

## 六、开发流程落地：一个 Todos 模块的诞生

笔记给的开发流程是：`AppModule` 的 `imports` 里植入业务模块，业务模块再往下拆 `xx.module.ts / xx.controller.ts / xx.service.ts`。第五十九天下午的提交 `29e7caa`，就是把这个流程完整跑了一遍——加了一个 **Todos 模块**。

第一步，根模块 `app.module.ts` 引入 `TodosModule`：

```ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TodosModule } from './todos/todos.module';

@Module({
  imports: [TodosModule],     // 依赖外界，把 Todos 业务模块装进来
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

第二步，`todos/todos.module.ts` 定义这个独立业务模块，**把自己那组的控制器和服务登记进来**：

```ts
import { Module } from '@nestjs/common';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';

@Module({
  controllers: [TodosController],
  providers: [TodosService],
})
export class TodosModule {}
```

模块是组装单位：**`controllers` 管"谁来接请求"，`providers` 管"谁来做业务"。** 一个 CRUD 模块的两层，在这里一次性声明清楚。

---

## 七、控制器层：路由、参数装饰器与依赖注入

`todos.controller.ts` 是当天注释最密、信息量最大的文件，几乎每一行都在解释装饰器。先看整体骨架：

```ts
@Controller('todos')
export class TodosController {
  // 构造函数注入：声明依赖 TodosService，NestJS 自动创建并注入
  constructor(private readonly todosService: TodosService) {}

  @Get()
  findAll(): Todo[] {
    return this.todosService.findAll();
  }
}
```

**`@Controller('todos')` 的 `'todos'` 是路由前缀**，这个控制器下所有接口的完整 URL = `'todos'` + 方法装饰器上的路径。例如 `@Get()` 对应 `GET /todos`，`@Get(':id')` 对应 `GET /todos/:id`。

**`constructor(private readonly todosService: TodosService)` 是依赖注入**——Controller 只声明"我要 `TodosService`"，NestJS 负责造好对象塞进来，自己不用 `new`。这就是笔记说的 **`@Injectable()` 自动依赖注入、自动注入到 controller 或任何用到它的地方**。`private readonly` 更是妙：直接声明并赋值给 `this.todosService`，且属性只读防止误改。

再看每个 HTTP 方法的映射，装饰器分组很清晰：

```ts
@Get(':id')
findOne(@Param('id') id: string): Todo {
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

@Patch(':id')
update(@Param('id') id: string, @Body() patch: Partial<Todo>): Todo {
  return this.todosService.update(Number(id), patch);
}
```

**`@Param('id')` 从 URL 路径里取路由参数**，名字要和 `@Get(':id')` 里的 `:id` 对上；**`@Body('title')` 从请求体里取字段**。取到的 id 是字符串，要 `Number(id)` 转成数字再传给 Service。控制器只做"取参数、调服务、返回结果"三件事，业务全在 Service——**这就是 MVC 的 C 层该有的样子。**

文件末尾还有一段对 **PUT vs PATCH** 的辨析，值得单独拎出来：

- **PUT —— 全量替换**：请求体要带资源的所有字段，没带的会被清空/重置；幂等；
- **PATCH —— 部分更新**：请求体只带要改的字段，没带的保持原值；单字段 PATCH 一般也幂等。

所以"只改 `completed` 一个字段"这种需求，用 PATCH 更符合语义。笔记里专门写了注释提醒：**"实际项目里「只改 completed 这一个字段」用 PATCH 更符合语义"**。这是接口设计里很实际的取舍。

---

## 八、服务层与错误处理：`@Injectable()` 与 `NotFoundException`

`todos.service.ts` 是业务数据的家。先看数据模型和服务声明：

```ts
export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

const todos: Todo[] = [
  { id: 1, title: '学习nestjs', completed: false },
  { id: 2, title: '学习CRUD', completed: true },
];
let nextId = 3;

@Injectable()
export class TodosService {
  // ...
}
```

**`@Injectable()` 是依赖注入的前提**——标记这个类可以被 NestJS 自动创建并注入到需要它的地方。数据先放内存数组里，`nextId` 自增作为新 id。

四个 CRUD 方法里，有两处错误处理特别典型：

```ts
findOne(id: number): Todo {
  const todo = todos.find((todo) => todo.id === id);
  if (!todo) throw new NotFoundException(`Todo not found ${id}`);
  return todo;
}

remove(id: number): void {
  const index = todos.findIndex((todo) => todo.id === id);
  if (index === -1) throw new NotFoundException(`Todo not found ${id}`);
  todos.splice(index, 1);
}
```

笔记专门讨论了"后端怎么报错"：**try/catch/finally 是 JS 的独苗，一个未捕获异常就能让线程挂掉。** 而 NestJS 提供了各种内置错误类，`NotFoundException` 就是其中之一，用来**标准化错误输出**——找不到资源就抛它，框架会自动转成规范的 404 响应，而不是裸崩。

`update` 方法还用了 `Object.assign` 做部分更新，注释同样写得很清楚：

```ts
update(id: number, patch: Partial<Todo>): Todo {
  const todo = this.findOne(id);
  // Object.assign(目标对象, ...源对象)：把源对象的属性合并到目标对象上
  // 同名属性会被源对象的值覆盖，目标对象独有的属性保留
  // 等价于 { ...todo, ...patch }，但 Object.assign 是原地修改 todo
  Object.assign(todo, patch);
  return todo;
}
```

`Partial<Todo>` 让 `patch` 的每个字段都可选，正好匹配 PATCH 的"只改一部分"语义；`Object.assign` 把传来的字段原地合并进 `todo`，没传的字段原封不动。**类型系统（`Partial`）+ 原地合并（`Object.assign`），两端配合才把 PATCH 落到实处。**

到这里，一条完整的链路就闭合了：

```text
GET /todos
  -> TodosController.findAll()     控制器取参数
  -> TodosService.findAll()        服务查数据
  -> 自动序列化成 JSON 返回前端
```

---

## 九、面试问答

**问：工厂模式解决什么问题？`NestFactory` 在里面扮演什么角色？**

> 工厂模式把"创建对象"和"使用对象"解耦：调用方不需要知道具体类，只需 `Factory.create(type)`。因为工厂里每个类都实现了相同的接口，生产出来的对象可以放心统一调用。NestJS 里的 `NestFactory.create(AppModule)` 就是工厂类——开发者不用关心应用怎么组装，工厂替我们创建出一个完整的 NestJS 应用。

**问：装饰器模式是什么？为什么说 NestJS 把装饰器用到极致？**

> 装饰器模式是"不改变原对象，动态地给它加功能"。写法上是一个 `@` 符号加名字放在类上。NestJS 的 `@Module`、`@Controller`、`@Injectable` 都是装饰器——类的代码一行没改，能力就声明上来了。整个框架的分层约定全靠装饰器表达，所以说是用到极致。

**问：NestJS 的 MVC 分层是什么？Controller 和 Service 各做什么？**

> M（model）是数据库抽象，C（controller）是控制器——接收请求、校验参数、组织简单逻辑，最后返回响应，不直接碰数据库；V（view）是展示层。在 NestJS 里，Controller 负责"取参数、调 Service、返回结果"，Service 承载复杂业务（CRUD、SQL）并返回数据。Module 则把一组相关的 Controller + Service 组装成一个独立业务模块，由根模块 `AppModule` 通过 `imports` 引入。

**问：`@Injectable()` 和依赖注入是什么关系？**

> `@Injectable()` 标记一个类可以被自动注入。控制器里用 `constructor(private readonly todosService: TodosService)` 声明"我要 TodosService"，NestJS 会自动创建实例并注入进来，开发者不用手动 `new`。这就是依赖注入——控制器只声明依赖，框架负责装配。

**问：NestJS 里后端错误怎么处理？**

> JS 的 try/catch/finally 是异常处理的独苗，一旦有未捕获异常线程就会挂。NestJS 提供了各种内置错误类来标准化错误输出——比如资源找不到时抛 `NotFoundException`，框架会自动转成规范的 404 响应，而不是裸崩。

**问：PUT 和 PATCH 有什么区别？什么时候用哪个？**

> PUT 是全量替换：请求体要带所有字段，没带的会被清空或重置，且幂等；PATCH 是部分更新：只改请求体里提供的字段，没传的保持原值。实际项目里"只改 completed 一个字段"这种需求用 PATCH 更符合语义。配合类型系统，PATCH 用 `Partial<Todo>` 表示字段可选，用 `Object.assign` 原地合并。

---

## 结语：三层约定，一整个后端骨架

第五十九天没有写多少新算法，却把一个企业级后端框架的骨架搭清楚了。回看整条线，其实是三层约定层层嵌套：

```text
工厂模式     NestFactory.create(AppModule)    负责"创建应用"，与具体类解耦
装饰器模式   @Module / @Controller / @Injectable  负责"声明能力"，类代码不动
模块化 MVC   App -> Module -> Controller -> Service  负责"组织业务"，单向流水线
```

再落一层，一个 Todos 模块就把这套约定跑通了：`app.module.ts` 导入业务模块 → `todos.module.ts` 组装控制器和服务 → `todos.controller.ts` 用路由装饰器接 HTTP → `todos.service.ts` 用 `@Injectable()` + `NotFoundException` 承载业务和错误。

动手前，拿这份清单自检：

- [ ] 能否说清后端开发的三类职责（API、系统集成/并发/AI Infra、微服务）？
- [ ] 能否讲清工厂模式"创建与使用解耦"，以及 `NestFactory.create` 的角色？
- [ ] 能否解释装饰器模式"不改变原对象动态加功能"？
- [ ] 能否画出 `App → Module → Controller → Service` 的分层流水线？
- [ ] 能否说出 `@Controller('todos')`、`@Get(':id')`、`@Param('id')`、`@Body()` 各自的作用？
- [ ] 能否解释 `@Injectable()` 与构造函数依赖注入的关系？
- [ ] 能否说清 `NotFoundException` 解决了"后端裸崩"什么问题？
- [ ] 能否讲出 PUT 全量替换与 PATCH 部分更新的区别？

理解这三层约定，就拿到了打开任何 NestJS 项目的钥匙——**工厂创建、装饰器声明、模块组织，企业级后端的骨架不过如此。**
