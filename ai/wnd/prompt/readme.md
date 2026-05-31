# 吴恩达AI 应用中的Prompt

## Prompt Principles
 - 清晰且详细的指令
 - llm的相应约束返回结构 JSON
 - 五个构建块

## get_response 函数
 - 参数的默认值是函数代码的重要语法特性
 - 好复用，灵活简便
 - llm api
   - completions 完成接口
     prompt
   - chat.completions 聊天完成接口
     messages: [
       {
         "role": "system",
         "content": "你是一个专业的助手"
       },
       {
         "role": "user",
         "content": "你好"
       },
       {
         "role": "assistant",
         "content": "你好，有什么我可以帮助你的吗？"
       }
     ]

## 吴恩达 prompt 规则
 - 清晰且具体的表答
    清晰 让大模型理解我们的目的，不偏离主题或少犯错误
    具体 提供上下文
    - 总结的案例里面，使用清晰的格式区间，告诉大模型我们在处理的文本在哪里
      {text} {} 是字符串模版的占位符