# v069 博客大纲

**标题**：NestJS 初探：工厂模式、装饰器与依赖注入，如何驱动一个 MVC 后端
**日期**：2026-08-17
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源 |
| --- | --- | --- |
| 引言 | 开门见山：NestJS 是什么、三件事（工厂/装饰器/模块化）、Todos CRUD 落地 | 综合 |
| 一、后端开发做什么 | API 接口 / 系统集成·并发·AI Infra / 微服务 | readme.md |
| 二、安装与目录架构 | `nest new hello`、main.ts 入口、app.module.ts 根模块 | readme.md + main.ts + app.module.ts |
| 三、工厂模式 | 23 种设计模式第一种；MixueFactory demo（创建/使用解耦、同接口）；NestFactory.create | factory_demo/readme.md + 1.mjs |
| 四、高度模块化与 MVC | App→Module→controllers→service；MVC 三层角色；main.ts 注释印证 | readme.md + main.ts |
| 五、装饰器模式 | @ 不改变原对象动态加功能；@Module/@Controller/@Injectable | readme.md + app.module.ts |
| 六、开发流程落地：Todos 模块 | AppModule imports 植入；todos.module.ts 组装 controllers+providers | readme.md + app.module.ts + todos.module.ts |
| 七、控制器层 | 路由前缀、构造函数依赖注入、@Param/@Body、PUT vs PATCH | todos.controller.ts |
| 八、服务层与错误处理 | @Injectable、NotFoundException 标准化错误、Object.assign 部分更新 | todos.service.ts |
| 九、面试问答 | 工厂/装饰器/MVC/依赖注入/错误处理/PUT-PATCH | 综合 |
| 结语 | 三层约定（工厂创建/装饰器声明/模块组织）；检查清单 | 综合 |

## 核心结论

- NestJS 是 Node.js 生态里**纯后端的企业级开发框架**：默认 TypeScript、全面模块化，适合构建企业级服务；后端职责 = API 接口 + 系统集成/并发/AI Infra + 微服务；
- **工厂模式**是 23 种设计模式第一种：把"创建对象"与"使用对象"解耦，调用方只需 `Factory.create(type)`，且因每个产品实现相同接口可放心统一调用；`NestFactory.create(AppModule)` 是它在框架里的身份；
- **装饰器模式**：不改变原对象动态加功能，`@` 写在类上；NestJS 的 `@Module` / `@Controller` / `@Injectable` 把分层约定全用装饰器表达，"用到极致"；
- **高度模块化 + MVC**：`App -> Module -> controllers -> service`；Controller 取参数校验返回响应不碰数据库，Service 承载 CRUD 复杂业务；根模块 `imports` 植入业务模块；
- **依赖注入**：`@Injectable()` 声明可注入，`constructor(private readonly todosService: TodosService)` 声明依赖，NestJS 自动创建注入，不手动 `new`；
- **路由装饰器**：`@Controller('todos')` 是前缀，`@Get(':id')`/`@Param('id')`/`@Body('title')` 映射方法与参数；URL 参数是字符串需 `Number()` 转换；
- **PUT 全量替换（幂等）vs PATCH 部分更新**：只改单字段用 PATCH 更符合语义；`Partial<Todo>` 表达字段可选 + `Object.assign` 原地合并才把 PATCH 落到实处；
- **错误处理**：JS 未捕获异常线程挂，NestJS 用内置错误类（如 `NotFoundException`）标准化错误输出，自动转规范 404。

## 引用说明

- 全部基于第五十九天两个提交 `ab07c39`（"第五十九天学习 nestjs初步"）与 `29e7caa`（"第五十九天 nestjs 设计模式、装饰器"）：
  - `backend/nestjs/readme.md`（NestJS 定位、后端职责、安装、目录、工厂/模块化/装饰器、开发流程、错误处理）；
  - `backend/nestjs/factory_demo/readme.md`（工厂模式原理、NestFactory）；
  - `backend/nestjs/factory_demo/1.mjs`（蜜雪冰城工厂模式 Demo：IceCream/LemonTea/MilkTea + MixueFactory）；
  - `backend/nestjs/hello/src/main.ts`（入口、NestFactory.create、MVC 注释）；
  - `backend/nestjs/hello/src/app.module.ts`（根模块、imports 植入 TodosModule、装饰器模式）；
  - `backend/nestjs/hello/src/todos/todos.module.ts`（独立业务模块、controllers+providers 组装）；
  - `backend/nestjs/hello/src/todos/todos.controller.ts`（路由前缀、依赖注入、@Get/@Post/@Delete/@Patch、@Param/@Body、PUT/PATCH 辨析）；
  - `backend/nestjs/hello/src/todos/todos.service.ts`（@Injectable、CRUD、NotFoundException、Object.assign 部分更新）。
