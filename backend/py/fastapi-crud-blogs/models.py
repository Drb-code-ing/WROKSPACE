# python 内置模块
from datetime import datetime
# 定义数据库字段
from sqlalchemy import String, Integer, DateTime, ForeignKey, func
# 定义数据库模型和关联关系映射
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base
# 用户表
class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(200))
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
    posts: Mapped[list["Post"]] = relationship(
      # 双向绑定的配对暗号
        back_populates="author", cascade="all, delete-orphan"
    )
# 文章表
class Post(Base):
    __tablename__ = "posts"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str] = mapped_column(String(5000))
    published: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    author: Mapped["User"] = relationship(back_populates="posts")