from fastapi import FastAPI
# 初始化 FastAPI 应用
app = FastAPI()

# 定义根路由
@app.get("/")
async def root():
    return {"message": "你好 廖昊"}
  
@app.get("/hello/{name}")
async def say_hello(name :str):
    return {"message": f"你好 {name}"}