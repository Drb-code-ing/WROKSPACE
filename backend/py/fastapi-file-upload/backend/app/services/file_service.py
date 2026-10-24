from enum import unique

from fastapi import HTTPException, status, UploadFile
from pathlib import Path
from ..config import ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, MAX_FILE_SIZE, UPLOAD_DIR
import uuid

def validate_file(file: UploadFile) -> None:
  if not file.filename:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file selected")
  # a.jpg -> .jpg
  # 拿到后缀，统一转换为小写lower
  ext = Path(file.filename).suffix.lower()
  if ext not in ALLOWED_EXTENSIONS:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"不支持的文件类型 {ext}")
  if file.content_type not in ALLOWED_MIME_TYPES:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"不支持的文件类型 {file.content_type}")
  if file.size > MAX_FILE_SIZE:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="文件大小不能超过 10MB")

def save_file(file: UploadFile) -> dict:
  # 保存文件到指定目录 如果目录不存在则自动创建
  UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
  # 只保留原始文件名
  original_name = Path(file.filename).name
  # 生成唯一文件名
  unique_name = f"{Path(original_name).stem}_{uuid.uuid4().hex}{Path(original_name).suffix}"
  target_path = UPLOAD_DIR / unique_name
  # 创建一个写入流
  # with 语句会自动关闭文件
  # as 语句会将文件对象赋值给变量 buffer
  with target_path.open("wb") as buffer:
    # 读取文件内容 每次读取 1MB 数据
    while chunk := file.file.read(1024 * 1024):
      buffer.write(chunk)
      
  # return 必须在 with 块外：块内文件未关闭、缓冲未刷盘，stat() 会拿到 0 字节
  return {
    "original_name": original_name,
    "saved_name": unique_name,
    "size": target_path.stat().st_size,
  }