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
    username: str | None = Field(default=None, min_length=3, max_length=50)
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=8, max_length=100)
    is_active: bool | None = None

class UserResponse(BaseModel):
    # User 类， 查询 users orm 数据模型
    # ConfigDict 从 orm 模型中获取字段描述, 摒弃其他的字段或方法
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    email: str
    is_active: bool
    created_at: datetime

# 文章模块 schema
class PostCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    content: str = Field(min_length=3, max_length=5000)
    published: bool = Field(default=False)

class PostResponse(BaseModel):
    """返回的文章数据"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    content: str
    published: bool
    created_at: datetime
    updated_at: datetime
    user_id: int

    author: UserResponse

class PostWithAuthor(BaseModel):
    """文章 + 作者信息（用于列表展示）"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    published: bool
    created_at: datetime
    author: UserResponse  # 嵌套另一个 Pydantic 模型

class PostUpdate(BaseModel):
    """更新文章时的请求体（所有字段可选）"""
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = Field(default=None, min_length=1, max_length=5000)
    published: bool | None = None