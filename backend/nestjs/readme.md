# nestjs

nest.js 全栈，nestjs 是node 的纯后端企业级开发框架
默认使用typescript，全面模块化思想，适合构建企业级服务

## 后端开发做些什么？
- 提供api 接口 web 开发
- 系统集成，并发 底层服务，AI Infra
- 微服务

## 安装
npm install -g @nestjs/cli
nest new hello
npm/pnpm run start

## 目录架构
- src
  main.ts 入口文件
  app.module.ts 根模块，负责启动应用

## 工厂模式

## 高度模块化
   约定
   App -> Module
       -> @nestjs/common Module 类
       -> import 依赖项
       -> controllers 控制器 参数效验，简单逻辑 最后 return response
       -> service 服务 return 数据

## 装饰器模式
装饰器模式: 不改变原对象,动态地给它加功能
@
class

## 开发流程
AppModule import 里面植入我们的Module
Module 是nestjs 的独立业务模块
xx.module.ts 定义 组装
xx.controller.ts 控制器
xx.service.ts providers 数据业务
  @Injectable() 自动依赖注入
  自动注入到controller 或如何用它的地方
  controller 里的一个属性
  MVC 本质
  装饰器模式用到极致

- NotFoundException
  nestjs 内置的错误类
  如何处理后端报错？
  try catch finally  ts独苗 线程挂
  nestjs 提供了各种错误类，标准化错误输出