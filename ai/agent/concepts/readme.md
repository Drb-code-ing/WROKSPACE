# 入手AI 需要搞懂哪几个概念

## Agent(智能体)
  现在最值钱的就是Agent Agent 工程师已经取代了传统的软件工程师，刷新了工资上限
  FDE  通过开发各种Agent 帮助企业AI 落地，降本增效
  现在用的很多AI 产品，本质已经是Agent 了 Cursor/Claude Code/Codex/openclaw/豆包/悟空/workbuddy/飞书cli
  核心都一样，帮助我们干活
  不只是回答问题，还能读文件，搜网络，写代码，操作浏览器，电脑，但是Agent 在做
  - 一个Agent 有多强？取决于用了什么大脑(llm) 装了什么工具 拿到了什么信息

## LLM
  大模型是Agent 的大脑
  llm 只负责 **推理** 和生成 真正行动能力来自工具(Tools)调用

## 工具 (Tools)
  llm 只有 推理和生成 能力，无法对接外部世界，tool 可以补齐操作短板
  没有 tool，AI 只能空推理，无法自动化任务

  - reasoning 推理
    给出llm 推理的规划和思维 方便我们了解，介入
  - messages 多轮对话列表
  - reasoning_effort 推理过程
  - reasoning_content 推理过程
  指导生成，流式输出
  - content 

  - 青岛啤酒股价多少
    llm 推理 要调用工具
    getPrice 函数 结果
    结果返回给llm
    llm 就可以根据结果 生成回答
    llm with tools ?
    openai 提供了接口 tools
    tool 函数 (llm 理解 需要的参数)
    结果再交给llm 再completion 一次