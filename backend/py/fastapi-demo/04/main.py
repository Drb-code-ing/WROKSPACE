from fastapi import FastAPI
# BaseModel 效验能力的基类
# Field 模型字段格外的效验规则，最大值，最小值
from pydantic import BaseModel, Field
from typing import Annotated

app = FastAPI()

class Item(BaseModel):
  name: str
  description: str | None = None
  price: float
  tax: float | None = None

@app.put('/items/{item_id}')
async def update_item(item_id: int, item: Item):
  result = {"item_id": item_id, **item.model_dump()}
  return result

class LoginIn(BaseModel):
  # ... 表示必填项
  email: Annotated[str, Field(..., description="邮箱")]
  password: Annotated[str, Field(..., min_length=6, max_length=20, description="密码")]

@app.post('/login')
async def login(data: LoginIn):
  email = data.email
  password = data.password
  return {"email": email, "password": password}

if __name__ == "__main__":
  import uvicorn
  uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)