# token

## 怎么学习llm ?
### 先搞懂AI 是什么
 - 吴恩达
   AI or Everyone
   Generative for Everyone
   AI Prompt Engineering
 - karpathy
   tesla 总监 OpenAI gpt3的作者
   3 小时 大模型入门课程 讲透大模型原理
  
Transformer 架构(google) Attention机制，微调等
理论高级篇

## 动手用起来
  把日常重复性工作交给AI
  - cc、codex
  - notebookllm google出品的RAG
    google 账号 注册
    梯子
    超级学习AI 工具
  - Obsidian 第二大脑

## 做个人作品
 - vibe coding 一个完整的项目
   网站、小程序、客户管理工具
   Agent开发
  
## 关注
 - 晓辉博士 专业深度
 - 42章经
 - 宝玉AI

## 分词 Tokenization
 - llm 计价和工作的最小单位
   一个英文字符 大约0.3个token
   一个中文字符 大约0.6个token
   计价 百万token 多少钱
   输入的是Prompt文本
   根据上一个词，预测下一个词 词与词之间语义相关性数学计算
   神经网络只能处理数字(向量，矩阵)，看不懂中文、英文等素材(主要是由计算机的底层运行机制和模型训练的效率决定的)
   必须把文字转成一串数字离散符号ID, token

## token demo
 - js-tiktoken
   解码tokens为文本
   输入的tokens + 输出的tokens = 总token数

## Embedding 向量化
  大模型不能直接处理文本，先tokenize，再embedding
  文本 切割为 token(大的文本理解任务切割为小的文本理解任务)
  token 可以想成一个单词的向量表示，但也不完全是单词，cl100k_base来提供
  文本 -> cl100k_base 映射规则 (不一定是word，而一定是token)
  token ID 215 100k

  理解语义，神经网络计算，相似度

  embedding 文本嵌入 (向量化) llm embedding 接口
  1024 -1->1