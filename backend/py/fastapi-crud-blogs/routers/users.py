# Depends 依赖注入 
# HTTPException 异常处理
# status 状态码
from fastapi import APIRouter, Depends, HTTPException, status
from schemas import UserCreate, UserResponse, UserUpdate
from database import get_db
from sqlalchemy.orm import Session
from models import User
import crud
# fastapi 自带 api 文档 swagger 
router = APIRouter(prefix="/users", tags=["用户管理"])
#  路由装饰器 + restful 资源 
# 约定
# Schema 就是用来规范校验入参、约束返回字段，同时自动生成接口文档的数据模型。
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
  # controller 
  # 分层 controller -> service
  existing = crud.get_user_by_email(db, user_in.email)
  if existing:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="该邮箱已经注册"
    )
  return crud.create_user(db, user_in)

# 用户列表
@router.get("/", response_model=list[UserResponse])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
  return crud.get_users(db, skip=skip, limit=limit)

# 用户详情
@router.get("/{user_id}", response_model=UserResponse)
def read_user(user_id: int, db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在",
        )
    return user

@router.patch("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_in: UserUpdate, db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")
    return crud.update_user(db, user, user_in)