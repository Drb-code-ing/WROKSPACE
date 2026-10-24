from fastapi import FastAPI
# cors 跨域
# from fastapi.middleware.cors import CORSMiddleware
from .routers import upload

app = FastAPI(title="File Upload API")
app.include_router(upload.router)


@app.get("/")
def root():
  return {"message": "Hello World", "docs": "/docs"}
