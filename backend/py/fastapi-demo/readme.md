# FastAPI + Vue3 + LangChain 实战

## FastAPI
是pythom 高性能的web接口空间，上手简单快速，性能堪比Go\Node
自动生成交互接口文档(前后端api 约定，swagger，自动生成)
写少量代码，自带类型提示
专门用于后端API，写接口不用折腾繁琐配置，开发效率很高
特别适合结合langchain/langgraph 开发后端服务
对异步(node) 异步无阻塞 高并发

FastAPI = Pydantic(zod 类型检测 用户输出 params, 类) +
Starlette(负责Web 底层，接受http服务，路由匹配，返回响应，处理网络，自带异步能力，是高性能的Web 基座)
路由参数
/user/123 pydantic 约束一定是整数

async
 - 数据库查询
 - 文件读写

## 环境安装
日常开发的全套工具
pip install "fastapi[standard]"
uvicorn 是异步web服务器，用来运行FastAPI 应用
pip install "uvicorn[standard]"
pip show fastapi uvicorn 查看安装信息

# Annotated
丰富类型注解 Annotated[类型, ...]
Annotated[int, Path(ge=2)]
自动做类型转换

## ORM 全栈开发流程（SQLAlchemy + SQLite，对标 NestJS 分层）

python 生态， ai -> web backend fastapi 有市场
快速地用于api 服务的 web 转化（简单）；nestjs 企业级开发服务（复杂）

- http 服务：nestjs 跑 3000， fastapi 跑 8000
- 数据库：sqlite 关系型数据库（轻量级，文本型）
  .db 文件可以随着程序发布， 不像 mysql/psql 需要独立部署
- ORM：对象关系映射 SQLAlchemy（对标 TypeORM）

### 目录文件职责（对应 Nest 的分层）
- main.py      单点入口 + 路由注册（对标 app.module）
- database.py  引擎(驱动)、会话、Base、get_db（对标 TypeORM 的 dataSource 配置）
- models.py    表 -> 对象（对标 entity）
- schemas.py   pydantic 约束 入参/出参（对标 DTO）
- crud.py      service 层，操作数据库的函数
- routers/     控制器层，按资源拆分路由（restful api）

### 启动
uvicorn main:app --reload
uvicorn 是 ASGI(Asynchronous Server Gateway Interface) 服务器，
负责把 FastAPI 应用跑起来（对标 nest 的 main.ts bootstrap）

### 开发流程
1. 创建的模型类 models.py
2. 根据restful 定义路由
3. api 文档 fastapi 自动生成（/docs 可交互测试）