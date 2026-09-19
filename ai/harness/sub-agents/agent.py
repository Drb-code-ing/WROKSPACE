#系统模块
from asyncio import Handle
import os
# 写爬虫？爬取到内容，找我们需要的部分，用正则
import re
# 子进程
import subprocess
from pathlib import Path
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv(override=True)
# print(os.getenv("DEEPSEEK_API_KEY"))
# Agent 工作目录 安全的 被授权的
# python 没有常量变量之分，都是变量，用约定大写表示
WORKDIR = Path.cwd()
# print(WORKDIR)

client = OpenAI(
  base_url = os.getenv("DEEPSEEK_API_BASE"),
  api_key = os.getenv("DEEPSEEK_API_KEY"),
)

# resp = client.chat.completions.create(
  # model = "deepseek-v4-flash",
  # messages = [
    # {"role": "user", "content": "你好"}
  # ],
# )
# print(resp.choices[0].message.content)

# print("sub agent, harness 的高级智能体")

# 主Agent 系统提示
# python 隐式字符串拼接，括号内可以有多个字符串
SYSTEM = (
  f"You are coding agent at {WORKDIR}."
  "Use task for focused exploration or a self-contained subtask."
)
SUB_SYSTEM = (
  f"You are coding agent at {WORKDIR}."
  "Complete the given task, then return a concise final answer."
)
# print(SYSTEM, SUB_SYSTEM)

# python 弱类型脚本语言  类型注解
def safe_path(p :str) -> Path:
  path = (WORKDIR / p).resolve() # 解析路径，返回绝对路径，相当于路径拼接
  if not path.is_relative_to(WORKDIR):
    raise ValueError(f"Path escapes workspace: {p}")
  return path
# print(safe_path("agent.py"))

# 跑命令行脚本 sub agent Tool
def run_bash(command :str) -> str:
  dangerous = ["rm -rf /", "sudo", "shutdown", "reboot", "> /dev/"]
  # any 只有一个满足就返回 True
  # 判断任意一个关键词是否出现在 command 中
  if any(cmd in command for cmd in dangerous):
    return "Error: Dangerous command blocked."
  
  try:
    # 调用系统shell跑命令
    r = subprocess.run(command, shell = True, cwd=WORKDIR, capture_output=True,
    text=True, errors="replace", timeout=120)
    # 把标准输出 + 错误输出拼一起 strip 去掉首尾空格
    out = (r.stdout + r.stderr).strip()
    return out[:50000] if out else "No output."
  except subprocess.TimeoutExpired:
    return "Error: Timeout (120s)"
  except (FileNotFoundError, OSError) as e:
    return f"Error: {e}"


# 感知工具 读取文件
# 类型注解 不传默认是 None
def run_read(path :str, limit :int = None) -> str:
  try:
    # 返回一个安全路径
    # read_text 读取文件内容，返回字符串 同步操作
    # splitlines 按行分割字符串，返回列表
    lines = safe_path(path).read_text(encoding="utf-8").splitlines()
    if limit and len(lines) > limit:
      lines = lines[:limit] + [f"....({len(lines) - limit} more)"]
    return "\n".join(lines)[:50000]

  # 捕获所有异常，返回错误信息
  except Exception as e:
    return f"Error: {e}"


# 执行工具 写入文件
def run_write(path: str, content: str) -> str:
    # try：尝试执行写文件逻辑，发生异常直接跳到except
    try:
        # 校验路径安全，得到目标文件的Path对象，防止逃出工作目录
        fp = safe_path(path)
        # 获取文件所在文件夹；parents=True自动创建多级父目录；exist_ok=True目录存在就不报错
        fp.parent.mkdir(parents=True, exist_ok=True)
        # 以utf8编码，把传入的content文本写入文件
        fp.write_text(content, encoding="utf-8")
        # 写入成功，返回提示，告诉AI一共写了多少字节
        return f"Wrote {len(content)} bytes"
    # 捕获所有异常：权限不足、路径非法等各种错误
    except Exception as e:
        # 出错时，返回错误信息给大模型
        return f"Error: {e}"


# 执行工具 编辑文件
def run_edit(path: str, old_text: str, new_text: str) -> str:
    # 尝试执行编辑逻辑，出错就跳到except
    try:
        # 校验路径安全，拿到文件Path对象，防止逃出工作目录
        fp = safe_path(path)
        # 读取文件全部内容，utf-8编码
        content = fp.read_text(encoding="utf-8")
        # 如果待查找的旧文本不在文件里面
        if old_text not in content:
            # 返回错误提示，直接结束函数，不修改文件
            return f"Error: Text not found in {path}"
        # 替换：只替换第1处匹配的旧文本，写回原文件
        fp.write_text(content.replace(old_text, new_text, 1), encoding="utf-8")
        # 修改成功，返回提示信息
        return f"Edited {path}"
    # 捕获所有异常（文件不存在、权限问题等）
    except Exception as e:
        # 出现异常，返回错误详情给大模型
        return f"Error: {e}"


# 工具名字和对应的执行函数映射字典
TOOL_HANDLERS = {
  # lambda表达式 可以用于简洁创建匿名函数
  # () => {}
  # **kw 表示接收任意数量的关键词参数
  "bash": lambda **kw: run_bash(kw["command"]),
  "read-file": lambda **kw: run_read(kw["path"], kw.get("limit")),
  "write-file": lambda **kw: run_write(kw["path"], kw["content"]),
  "edit-file": lambda **kw: run_edit(kw["path"], kw["old_text"], kw["new_text"])
}


# 子Agent 工具
CHLD_TOOLD= [
  {
    "type": "function",
    "function": {
      "name": "bash",
      "description": "Run a shell command.",
      # 函数参数
      "parameters": {
        "type": "object",
        "properties": {
          "command": {
            "type": "string",
          }
        },
        "required": ["command"] # 必须包含 command 参数
      }
    }
  },
  {
  "type": "function",
  "function": {
    "name": "read-file",
    "description": "Read file contents.",
    # 函数参数
    "parameters": {
      "type": "object",
      "properties": {
        "path": {"type": "string"},
        "limit": {"type": "integer"},
      },
      "required": ["path"] # 必须包含 path 参数
    }
  }
 },
 {
  "type": "function",
  "function": {
    "name": "write-file",
    "description": "Write contents to file.",
    # 函数参数
    "parameters": {
      "type": "object",
      "properties": {
        "path": {"type": "string"},
        "content": {"type": "string"},
      },
      "required": ["path", "content"] # 必须包含 path 和 content 参数
    }
  }
 },
 {
  "type": "function",
  "function": {
    "name": "edit-file",
    "description": "Edit file contents.",
    # 函数参数
    "parameters": {
      "type": "object",
      "properties": {
        "path": {"type": "string"},
        "old_text": {"type": "string"},
        "new_text": {"type": "string"},
      },
      "required": ["path", "old_text", "new_text"] # 必须包含 path、old_text 和 new_text 参数
    }
  }
 }
]

# 主Agent 工具 现在是可以自己改，也可以分配给子Agent 执行
PARENT_TOOLS = CHLD_TOOLD + [
  {
    "type": "function",
    "function": {
      "name": "task",
      # 给子Agent 分配完全独立的上下文
      "description": "Spawn a subagent with fresh context. ITshares the filesystem but not conversation history.",
      "parameters": {
        "type": "object",
        "properties": {
          "prompt": {
            "type": "string",
            "description": "Short description of the task.",
          }
        },
        "required": ["prompt"] # 必须包含 prompt 参数
      }
    }
  }
]


# 启动子agent，传入用户认为文本，返回执行结果
def run_subagent(prompt: str) -> str:
  sub_messages = [{"role": "user", "content": prompt}]
  # 子Agent 循环上限30次  _ 表示不使用循环变量，占位
  for _ in range(30):
    response = client.chat.completions.create(
      model = "deepseek-v4-flash", # 修复：Model 变量不存在，直接用模型名字符串
      messages = [{"role": "system", "content": SUB_SYSTEM}] + sub_messages,
      tools = CHLD_TOOLD,
      max_tokens = 8000,
    )
    # 取出模型第一条返回对象
    msg = response.choices[0].message
    # 把子Agent 回复添加到上下文 model_dump() 把消息转换为字典
    sub_messages.append(msg.model_dump())

    if response.choices[0].finish_reason != "tool_calls":
      break

    results = []
    for tool_call in msg.tool_calls:
      func_name = tool_call.function.name
      # 解析参数为 Python 字典
      args = json.loads(tool_call.function.arguments)
      handler = TOOL_HANDLERS.get(func_name) # get拿不到返回 None，而不是报错
      # 调用工具函数  ** 相当于 ... 展开运算符
      output = handler(**args) if handler else f"Unknown tool: {func_name}"
      results.append({
        "role": "tool",
        "tool_call_id": tool_call.id,
        "content": str(output)[:50000],
      })
    # 工具执行结果批量回填子Agent 上下文（放在 for 循环外，避免重复追加）
    sub_messages.extend(results)

  # 循环结束（模型不再要求调工具），返回子Agent 的最终回答
  return msg.content or "(no summary)"



def agent_loop(messages: list):
  # Agent 主循环：问模型 → 模型要调工具就执行 → 结果回传 → 再问模型，直到不用调工具
  while True:
    response = client.chat.completions.create(
      model = "deepseek-v4-flash",
      messages = [{"role": "system", "content": SYSTEM}] + messages,
      tools = PARENT_TOOLS, # 告诉模型有哪些工具可调
      max_tokens = 8000,
    )
    msg = response.choices[0].message
    # 把Agent 回复添加到上下文
    messages.append(msg.model_dump())
    # finish_reason == "tool_calls" 表示模型想调工具；否则就是最终回答，循环结束
    if response.choices[0].finish_reason != "tool_calls":
      return msg.content # 把最终回答返回给调用方
    results = []
    # Tool Calls（tool_calls 可能是 None，先判空）
    msg = response.choices[0].message
    if msg.tool_calls:
      # 遍历模型这次要调用的每一个工具
      for tool_call in msg.tool_calls:
        # 拿到工具调用信息：func.name 工具名 / func.arguments 参数（JSON 字符串）
        func = tool_call.function
        # 参数是文本 '{"command": "ls"}'，解析成 Python 字典才能用
        args = json.loads(func.arguments)
        # 主Agent 分配任务给子Agent
        if func.name == "task":
          # 拿到description字段，没有就默认是"subtask"
          desc = args.get("description", "subtask")
          prompt = args.get("prompt", "")
          print(f"> task({desc}): {prompt[:80]}")
          # 调用子Agent 执行任务
          output = run_subagent(prompt)
        else:
          # 主Agent 也可以自己做任务
          handler = TOOL_HANDLERS.get(func.name)
          output = handler(**args) if handler else f"Unknown tool: {func.name}"

        
        results.append({
          "role": "tool",
          "tool_call_id": tool_call.id,
          "content": str(output),
        })
    
    # 把子Agent 回复添加到上下文
    messages.extend(results)



# 主Agent 主循环  处理用户输入
if __name__ == "__main__":
  print("Subagent - fresh messages, final text returns")
  print("Enter a question, press Enter to send. Type q to quit.\n")
  history = [] # 创建一个空列表，模拟上下文
  while True:
    try:
      query = input("\001\033[36m\002s06 >> \001\033[0m\002")
    # 中断
    # ctrl + d  ctrl + c  触发 EOFError、KeyboardInterrupt
    except (EOFError, KeyboardInterrupt):
      break
    if query.strip().lower() in ("q", "exit", ""):
      break
    history.append({"role": "user", "content": query})
    # 接住 agent_loop 返回的最终回答并打印
    answer = agent_loop(history)
    print(f"\n[final] {answer}\n")

