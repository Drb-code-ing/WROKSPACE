from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Annotated, List, Optional

app = FastAPI(title="Todo增删改查")

todos = []
next_id = 1

class Todo(BaseModel):
  title: Annotated[str, Field(min_length=1, max_length=100, description="待办事项标题, 1-100个字符")]
  done: Annotated[bool, Field(default=False, description="是否完成")]

@app.get('/todos', summary="查询所有待办", response_model=List[Todo])
async def get_all_todos():
  return todos

@app.get(f"/todos/{todo_id}", summary="查询单个待办", response_model=Todo)
def get_todo(todo_id: Annotated[int, Field(..., gt=0, description="Todo ID 必须大于0")]):
  for item in todos:
    if item.id == todo_id:
      return item
  return {"error": "Todo ID 不存在"}


if __name__ == "__main__":
  import uvicorn
  uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)