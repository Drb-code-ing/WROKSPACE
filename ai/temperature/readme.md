# 大模型是怎么随机说话的?
控制大模型随机性的关键参数
temperature 温度 随机性 0 - 1  文艺创作 | 写代码
Top K  随机样本 得分排序

上一个词 预测下一个词 prediction next word
概率分布 1
“你好”
啊 0.15  吗 0.6  呀 0.1  美 0.05  坏 0.01 ...

- 大概率是生成“吗”？
  用temperature 0 - 1 之间
  0.2 低 严谨 “吗”
  0.8 高 随机 “坏”

- Top k ?
  概率分布 按得分去排序

- 幻觉问题
- 开发者有效、靠谱的去使用、控制AI 应用的随机性

- 把temperature 拉高 随机性增加 生成会不太靠谱
- 有些创作类的 随机性 去增加创意，但想保证质量
分两步做
- 先用Top K 把高概率的词选出来
  3 | 2 默认值8
  AI 应用效果观测
- 再用temperature 控制随机性
  0.2 代码 法律 合同
  0.8 创作创意 多模态模型 AI漫剧

- temperature 和 Top K 不能都太大或太小
  temperature 小 Top K 大 比较准确又有创意
  temperature 大 Top K 小 靠谱的创意性

## langchain
lang(uage) + chain(llm 工作链|流编排)
## 核心模块 @langchain/core
- messages 对话列表
- output_parsers 输出解析器
  帮我们自动解析出相应的格式
- tools 工具函数
- prompts 提示词模版

为什么需要 langchain？
开发更快，业务类
AI Agent 应用 生成式、概率分布 有点黑盒
要被觉得干的活不太智能，要不太智能，不知道他怎么干出来
chain 就是把AI 工作链条上的每个节点链起来

## AI 工作流
- llm 两个创意和严谨的 适合不同的业务
- PromptTemplate
- StringOutputParser

start -> llm -> PromptTemplate -> StringOutputParser -> end