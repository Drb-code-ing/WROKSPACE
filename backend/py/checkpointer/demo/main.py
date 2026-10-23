# Python 的静态类型检测，只在IDE 里生效，运行时不强制效验
# TypedDict 定义一个字典，键值对的类型必须是固定的
# Literal 定义一个枚举类型，只能取指定的值
from tracemalloc import Snapshot
from typing import TypedDict, Literal
from fastapi import FastAPI
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from pydantic import BaseModel
# langgraph 多用途指令对象，能更新状态，动态跳转节点
from langgraph.types import Command

# Annotation.Root
# TypedDict 基类 作用是给字典规定固定的键值对类型
class WorkflowState(TypedDict):
  step: int
  msg: str

def nodel1(state: WorkflowState) -> dict:
  print("执行节点1")
  return { "step": 1, "msg": "节点1完成" }

def nodel2(state: WorkflowState) -> dict:
  print("执行节点2")
  return { "step": 2, "msg": "节点2完成，等待人工审核" }

def human_review(state: WorkflowState) -> dict:
  print("执行节点3, 人工审核")
  return { "step": 3, "msg": "审核完成" }

def nodel4(state: WorkflowState) -> dict:
  print("执行节点4, 流程结束")
  return { "step": 4, "msg": "全部完成" }

builder = StateGraph(WorkflowState)
builder.add_node("nodel1", nodel1)
builder.add_node("nodel2", nodel2)
builder.add_node("human_review", human_review)
builder.add_node("nodel4", nodel4)
builder.add_edge(START, "nodel1")
builder.add_edge("nodel1", "nodel2")
builder.add_edge("nodel2", "human_review")
builder.add_edge("human_review", "nodel4")
builder.add_edge("nodel4", END)

# 内存检查点存储器
# 先保存当前状态，停下来
# 从这个保存状态恢复，继续执行
checkpoint = MemorySaver()

graph = builder.compile(
  # 检查点 标记中断 保存当前状态 便于恢复
  checkpointer=checkpoint,
  interrupt_before=["human_review"] # 在人工审核节点前中断
)

app = FastAPI(title="Langgraph Human-in-the-Loop Demo")

class ResumeRequest(BaseModel):
  approved: bool

def make_config(thread_id: str) -> dict:
  return {
    "configurable": {
      "thread_id": thread_id # 唯一会话标识 用于恢复状态 会话隔离 不同会话状态不干扰
    }
  }

# agent 运行 会话状态
@app.post("/start")
def start_workflow(thread_id: str = "demo-thread=001"):
  config = make_config(thread_id)
  # 暂停后的状态
  result = graph.invoke({"step": 0, "msg": ""}, config)
  print(result)
  # 当前节点和下一个节点等控制信息的完整状态视图
  snapshot = graph.get_state(config)
  print(snapshot)

  return {
    "status": "interrupted",
    "thread_id": thread_id,
    "current_state": result,
    "next_node": list(snapshot.next),
    "message": "流程已暂停, 请人工审核"
  }

@app.post("/resume")
def resume_workflow(req: ResumeRequest, thread_id: str = "demo-thread=001"):
  config = make_config(thread_id)

  if not req.approved:
    return {
      "status": "rejected",
      "thread_id": thread_id,
      "message": "人工审核未通过, 流程已拒绝"
    }
  # 从checkpointer 恢复状态，继续执行
  final_result = graph.invoke(Command(resume=True), config)
  snapshot = graph.get_state(config)
  return {
    "status": "completed" if len(snapshot.next) == 0 else "interrupted",
    "thread_id": thread_id,
    "current_state": final_result,
    "next_node": list(snapshot.next),
    "message": "审核通过，流程已继续执行"
  }

@app.get("/state")
def get_state(thread_id: str = "demo-thread-001"):
  config = make_config(thread_id)
  snapshot = graph.get_state(config)
  return {
    "status": snapshot.status,
    "thread_id": thread_id,
    "current_state": snapshot.current_state,
    "next_nodes": list(snapshot.next),
    "message": f"当前状态: {snapshot.status}"
  }
