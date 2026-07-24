# Benchmark

benchmark 是用标准题目个大模型打分的体系

- MMLU
- GPQA
- HumanEval

benchmark 是llm 在一系列测试中的得分集合(多维，可测)

## 基准测试
给一堆测试标准题目，让AI 模型去打分，模型的高考，考完了会出一个分数
- 为什么需要benchmark?
  大模型太大了，gpt claude gemini deepseek qwen，需要一个客观的标准
  llm 的能力是多维的
  - MMLU 综合知识
    Massive Multitask Language Understanding
    大任务语言理解 57个学科领域选择题 考的是llm 的知识广度
    相当于文理综合卷
  - GPQA Diamond
    顶级推理
    Graduate-Level Google-Proof Q & A
    专门去研究生级别的物理、化学、生物难题
    为什么叫Goole-Proof，因为这些题目就算你上网搜也很难找到答案
    考的是模型是不是真正能推理，而不是去背答案
  - HumanEval 代码能力 SWE-bench
    两套试卷
    HumanEval 164道编程题目，让大模型写出能够跑通的代码
    SWE-bench 让模型直接去修真实的github 项目的bug
  - MATH/AIME 数学推理
    竞赛级数学题
    AIME 是美国数学竞赛的高级别，需要模型有数学推理的能力
  - C-Eavl 中文能力
    专门针对中文语境，覆盖52个学科，4种难度
    训练语料
  
- 厂商怎么用benchmark?
  每次模型发布，会拿出一堆的benchmark 来说自己特别强
  - openai 4.1 benchmark
  - claude
  厂商会挑表现好的几项去重点放大

  模型在xx上说第一，不代表整体最强
  可能只是在某一项考试里面拿了最高分

## benchmark 作用
是一个门槛，不是排名
一个模型连benchmark 都差，大概率能力也差(门槛)
要看多个维度，不是单一分数

要看具体业务，以及实际效果

## 总结
Benchmark 是用标准题给大模型打分的体系，不同测试集考不同的能力，
知识、推理、代码、数学、中文、厂商会选择对自己有利的数据，结合自身需求和体验判断