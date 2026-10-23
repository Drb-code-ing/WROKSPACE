# FastAPI 博客系统（CRUD 实战）

搬自对照仓库 2026-10-20 提交的学习项目，FastAPI + SQLAlchemy 2.0 + SQLite 的完整用户 CRUD。

已修复对方代码 bug：routers/users.py 缺失 UserUpdate 的 import（模块加载即 NameError）。

## 技术选型
- http 服务：fastapi（端口 8000，对标 nestjs 3000）——python 生态 ai 转 web backend 的主流选择
- 数据库：sqlite 轻量级关系型数据库，.db 文本文件随程序发布，无需独立部署（不像 mysql/psql）
- ORM：SQLAlchemy 对象关系映射（对标 TypeORM），本项目用 2.0 新风格（Mapped 注解声明列 + select() 函数式查询，与 1.x 的 Column()/query() 老写法不同，查资料注意版本）
- 密码加密：bcrypt 加盐哈希

## 分层结构（对标 NestJS）
- main.py      入口 + 路由注册（app.include_router 挂载 routers）
- database.py  引擎、会话、Base、get_db（yield 生成器做请求级依赖注入，finally 关闭会话）
- models.py    表 -> 对象（entity），User/Post 一对多 relationship(back_populates)
- schemas.py   pydantic 入参/出参校验（DTO），UserCreate/UserUpdate/UserResponse
- crud.py      service 层数据库操作
- routers/     控制器层按资源拆分（users.py：注册/列表/详情/全量更新/部分更新/删除）

## 启动
pip install fastapi uvicorn sqlalchemy bcrypt "pydantic[email]"
uvicorn main:app --reload

uvicorn 是 ASGI 服务器，负责把 FastAPI 应用跑起来。

## 验证
访问 http://127.0.0.1:8000/docs 查看 fastapi 自动生成的交互式 api 文档，可直接测试各接口。
