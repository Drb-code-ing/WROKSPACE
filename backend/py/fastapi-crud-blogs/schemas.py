# crud 请求体， 查询参数， 路由params 是否符合schema 约束
# 输出的约束
from datetime import datetime
# zod
# BaseModel schema 基础类， 自动获得校验能力
# EmailStr 邮件格式
# Field 字段描述
from pydantic import BaseModel, EmailStr, Field, ConfigDict
# 检验用户创建请求体
class UserCreate(BaseModel):
    # examples swagger api文档 
    username: str = Field(min_length=3, max_length=50, examples=["zhangsan"])
    email: EmailStr = Field(examples=["zhang@example.com"])
    password: str = Field(min_length=8, max_length=100)

class UserUpdate(BaseModel):
    username: str | None = None
    email: EmailStr | None = None
    password: str | None = None

class UserResponse(BaseModel):
    # User 类， 查询 users orm 数据模型
    # ConfigDict 从 orm 模型中获取字段描述, 摒弃其他的字段或方法
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    email: str
    is_active: bool
    created_at: datetime