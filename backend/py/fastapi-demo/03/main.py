from fastapi import FastAPI, Path, Query
from typing import Annotated

app = FastAPI()

@app.get("/")
async def root():
  return {"message": "Hello liaohao"}

# @app.get("/p/{article_id}")
# async def article_detail(article_id: int):
  # return {"article_id": article_id}

@app.get("/p/{article_id}")
async def article_detail(article_id: Annotated[int, Path(ge=2)]):
  return {"article_id": article_id}

# http://0.0.0.0:8000/article/list?page=2&size=5
@app.get("/article/list")
async def article_list(page: Annotated[int, Query(ge=1)]=1, size: Annotated[int, Query(ge=10)]=10):
  return {"page": page, "size": size}

if __name__ == "__main__":
  import uvicorn
  uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)