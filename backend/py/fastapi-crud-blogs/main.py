from fastapi import FastAPI
# 引入database 模块 
from database import engine, Base
from routers import users, posts

import models
# python 实例化不用new 
# 自动地将 __init__ 方法调用 
# 便捷
# 建表 orm 自动根据模型类创建表
Base.metadata.create_all(bind=engine)

app = FastAPI(
  title="Blog API",
  description="FastAPI + SQLAlchemy 博客系统",
  version="1.0.0",
)
# 装饰器模式
@app.get("/")
def root():
    return {"message": "Blog API", "docs": "/docs"}

# 模块路由
# 用户路由模块
app.include_router(users.router)
# 文章路由模块
app.include_router(posts.router)