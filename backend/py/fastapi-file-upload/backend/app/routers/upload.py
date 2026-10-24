from fastapi import APIRouter, UploadFile, File, HTTPException
from ..services.file_service import validate_file, save_file

router = APIRouter(prefix="/api", tags=["upload"])

# File(...) 来自MultipartForm 表单数据 必须上传文件
@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
  validate_file(file) # 业务逻辑
  result = save_file(file)
  return {
    "code": 0,
    "message": "上传成功",
    "data": result
  }
