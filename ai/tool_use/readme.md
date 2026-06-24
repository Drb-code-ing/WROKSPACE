# Tool Use
  工具调用，背后真正的技术逻辑，不只是API

  - 豆包可以自动的搜索网页
    两个工具 日期获取工具、网络搜索工具
  - claude 可以分析excel 表格
    读取文件、excel 分析工具
  - AI Agent 操作电脑

  LLM + tools = Agent

  难度AI 有自我意识吗？作为开发者，这是一个精心设计的错觉(用户认为是LLM完成的，其实不是)

  那个在显卡里疯狂跑的LLM，本质上还是一个词语接龙游戏。它是被困在服务器里的缸中之脑，它看不见屏幕，摸不到键盘

  一个只能去预测下一个词的概率模型，Next Token Prediction怎么突破物理限制 怎么去调API 怎么去读数据库 怎么操作物理世界的工具

## Tool Use
  工具是函数
  - 认知植入
    工具降维为语言，llm 只能做自然语言处理
    在执行任务之前，
    在system prompt 里**配置工具**的时候，就在做一件非常精妙的事，
    就是**认知植入**，Tool 成为语言？说
    大模型不懂什么是天气API，也不懂数据库查询，但他听得懂语言。
    JSON schema 去讲复杂的软件接口函数，翻译成大模型可以理解的使用**说明书**
    JSON tools 格式，schema? 约束
    uses name string not null unique

    llm 概率随机性
    在这个阶段，一个复杂的软件工具(get_closing_price) 被降维成了一个纯粹的文本描述(JSON schema)
    用户提问 青岛啤酒的收盘价
    llm 回答不了
    - 意图识别
    llm 告知调用工具 content "", tool_calls 要调用的工具
    并中断执行 id function name, arguments

    - 情景
    用户问：上海的天气怎么样？
    llm推理引擎开始工作，它会进行一系列的快速评估
    首先，在原始训练语料中，问，不能回答
    绕回来看有没有工具
    发现真有工具，ai会停止和你的对话，转而开始自言自语(思考)，它严格按照我们定义的一套说明书，去生成一段自然语言的调用代码
     tool_calls:[{
    type: 'function',
    function: {
      name: 'get_weather',
      arguments: JSON.stringify({
        city: '上海'
      })
    }
  }]

  llm不能执行， 开发者可以！
  它依赖的是强大的模式识别和逻辑推理能力。
  它赌这段代码发出后， 会有人响应。

  
- runtime 的介入
    传统软件runtime 调用工具，执行任务 node/python/java
    人/AI都可以调用，只管一件事，执行，拿到结果
    不是直接返回给用户，而是返回给大模型(用户交互接口)
    大模型再根据结果继续执行
    最开始用户问什么，llm怎么决策 runtime 给了什么，根据上下文生成最后的返回