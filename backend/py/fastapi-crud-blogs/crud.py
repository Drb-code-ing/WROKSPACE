from models import User, Post
from sqlalchemy.orm import Session
from sqlalchemy import select 
from schemas import UserCreate, UserUpdate, PostCreate, PostUpdate
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

def delete_user(db: Session, user: User) -> None:
    """删除用户"""
    db.delete(user)
    db.commit()

def create_post(db: Session, post_in: PostCreate, user_id: int) -> Post:
    """为指定用户创建文章"""
    db_post = Post(
        title=post_in.title,
        content=post_in.content,
        published=post_in.published,
        user_id=user_id,
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

def get_posts(db: Session, skip: int = 0, limit: int = 100) -> list[Post]:
    """获取文章列表（分页）"""
    stmt = select(Post).offset(skip).limit(limit)
    return list(db.scalars(stmt).all())

def get_post(db: Session, post_id: int) -> Post | None:
    """按 ID 获取文章"""
    return db.get(Post, post_id)

def get_user_posts(db: Session, user_id: int) -> list[Post]:
    """获取指定用户的所有文章"""
    stmt = select(Post).where(Post.user_id == user_id)
    return list(db.scalars(stmt).all())

def update_post(db: Session, post: Post, post_in: PostUpdate) -> Post:
    """更新文章（只更新传了的字段）"""
    update_data = post_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        # setattr 动态属性赋值
        setattr(post, field, value)
    db.commit()
    db.refresh(post)
    return post

def delete_post(db: Session, post: Post) -> None:
    """删除文章"""
    db.delete(post)
    db.commit()