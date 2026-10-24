from pathlib import Path
# __file__ 是当前文件的路径 resolve() 解析为绝对路径 parent 父目录
# 项目根目录
BASE_DIR = Path(__file__).resolve().parent
# /根目录/uploads 上传目录
UPLOAD_DIR = BASE_DIR / "uploads"

# SET 集合 不重复
ALLOWED_EXTENSIONS={".jpg", ".jpeg", ".png", ".pdf", ".docx"}

ALLOWED_MIME_TYPES={
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}

MAX_FILE_SIZE=1024*1024*10 # 10MB
