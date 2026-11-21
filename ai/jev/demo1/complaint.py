import json # 解析json字符串
import os # 环境变量
import re # 正则表达式
from openai import OpenAI
from dotenv import load_dotenv # 加载环境变量
load_dotenv()

client = OpenAI(
  api_key= os.getenv("DEEPSEEK_API_KEY"),
  base_url= os.getenv("DEEPSEEK_BASE_URL"),
)

def call_llm(prompt: str) -> str:
  resp = client.chat.completions.create(
    model=os.getenv("DEEPSEEK_MODEL", "deepseek-flash"),
    messages=[{"role": "user", "content": prompt}],
    temperature=0,
    response_format={"type": "json_object"},
  )
  return resp.choices[0].message.content

# 判断是否是投诉
def is_complaint(review_text: str, max_retries: int = 3) -> bool:
  # 文本生成类模型的缺点，一定生成文本，会导致小概率格式错误 循环
  prompt = f"判断以下评论是否是投诉，只输出JSON：{{\"is_complain\": true/false}}\n 评论：{review_text}。？"
  for _ in range(max_retries):
    raw = call_llm(prompt)
    print(raw)
    # .* 默认不匹配换行符
    # re.S 让 .* 可以跨行匹配
    match = re.search(r"\{.*\}", raw, re.S)
    if not match:
      continue
    try:
      data = json.loads(match.group(0)) # 解析json字符串为对象
    except json.JSONDecodeError:
      continue

    value = data.get("is_complain")
    if isinstance(value, bool):
      print("是在抱怨" if value else "不是抱怨")
      return value
    
  print("判断失败，超出最大重试次数")
  return False


is_complaint("物流本来说两天，但是四天，女朋友生日都过了，烦死了")