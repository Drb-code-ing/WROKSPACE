from models import User
from sqlalchemy.orm import Session
from sqlalchemy import select 
from schemas import UserCreate
import bcrypt # 密码加密

def get_user_by_email(db: Session, email: str) -> User | None:
  # orm 操作 映射为 sql 语句
  stmt = select(User).where(User.email == email)
  return db.scalars(stmt).first()

def create_user(db: Session, user_in: UserCreate) -> User:
  """创建用户"""
  hashed = bcrypt.hashpw(
    user_in.password.encode("utf-8"),
    bcrypt.gensalt()
  ).decode("utf-8")

  db_user = User(
    username = user_in.username,
    email = user_in.email,
    hashed_password = hashed
  )
  db.add(db_user); # insert 
  db.commit()
  db.refresh(db_user)
  return db_user

def get_users(db: Session, skip: int = 0, limit: int = 100) -> list[User]:
  """获取用户列表"""
  stmt = select(User).offset(skip).limit(limit)
  return db.scalars(stmt).all()

def get_user(db: Session, user_id: int) -> User | None:
  """获取用户详情"""
  stmt = select(User).where(User.id == user_id)
  return db.scalars(stmt).first()

def update_user(db: Session, user: User, user_in: UserUpdate) -> User:
  """更新用户"""
  if user_in.username:
    user.username = user_in.username
  if user_in.email:
    user.email = user_in.email
  if user_in.password:
    hashed = bcrypt.hashpw(
      user_in.password.encode("utf-8"),
      bcrypt.gensalt()
    ).decode("utf-8")
    user.hashed_password = hashed
  db.commit()
  db.refresh(user)
  return user