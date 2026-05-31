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
   llm 智能高级，靠谱的为我们工作？
   通过一系列规则，减少智能的随机性。
 - 清晰且具体的表答
    清晰 让大模型理解我们的目的，不偏离主题或少犯错误
    具体 提供上下文
    - 总结的案例里面，使用清晰的格式区间，告诉大模型我们在处理的文本在哪里
      {text} {} 是字符串模版的占位符
      使用特殊的符号```来清晰的指出要处理的文本
      总结，summarize nlp 机器学习的常见任务
  
 - 对相应的结果格式做约束，一般为JSON，继续丰富JSON的key，还加点注释(自然语义的加持)

 - 分布式提示

 - Few-shot是提示工程技巧，在给大模型的提示中提供少量示例（通常2-5个），
   引导模型理解任务格式和期望输出，无需微调即可提升特定任务的表现。

 - llm 有幻觉