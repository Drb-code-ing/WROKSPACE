from dotenv import load_dotenv
import os
from fastapi import FastAPI
# 基类 类型检测功能
from pydantic import BaseModel
from langchain_openai import ChatOpenAI

load_dotenv()

app = FastAPI(title="LangChain & FastAPI")

llm = ChatOpenAI(
  api_key=os.getenv("DEEPSEEK_API_KEY"),
  base_url=os.getenv("DEEPSEEK_API_BASE"),
   model="deepseek-v4-flash",
   temperature=0.7,
)

# 定义请求体模型
class ChatReq(BaseModel):
  prompt: str

# 效验请求体类型
@app.post("/chat")
async def chat(req :ChatReq):
  resp = llm.invoke(req.prompt)
  return {
    "input": req.prompt,
    "replay": resp.content,
  }
  # print("")
  

if __name__ == "__main__":
  import uvicorn
  uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
