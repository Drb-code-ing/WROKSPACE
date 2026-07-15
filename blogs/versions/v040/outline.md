# v040 大纲

## 标题
从入门到生产：RAG 检索增强生成的完整工程链路与面试通关指南

## 主题
第三十六天学习（上）——在 v038 RAG 入门基础上，基于完整的 LangChain RAG 代码实践（MemoryVectorStore + Retriever + similaritySearchWithScore + 上下文组装 + LLM 生成），深入 RAG 的检索器机制、相似度评分体系、metadata 工程设计、上下文窗口管理、生产级架构选型与高级 RAG 模式，构建可应对面试深挖的完整知识体系。

## 核心线索
v038 回答了"RAG 是什么"——概念、向量化、基本文档构建。v040 回答"RAG 怎么做好"——从一段能跑的 Demo 到一套可上线、可调优、可解释的生产级检索增强系统。核心递进：检索器不止查向量（去重过滤重排序）、相似度分数不是数字是有决策信号、metadata 不是备注是检索质量的第二引擎。

## 章节结构

1. **引言** — 从 v038 的"知道 RAG 是什么"到 v040 的"能把 RAG 讲透"，从一次运行成功的完整 RAG 链路说起
2. **一、RAG 全链路解剖：从文本到回答的 7 个工程步骤** — 文档构建→向量化→存储→检索器→相似度计算→上下文组装→LLM生成，每一步的输入输出和关键决策
3. **二、检索器的工程真相：Retriever 不只是查向量** — retriever.invoke() vs similaritySearchWithScore() 的本质区别，去重、过滤、rerank 的工作机制，为什么面试官关心这个区别
4. **三、相似度评分体系：从数字到决策** — 余弦距离、欧氏距离的原理与选择，score 阈值如何决定检索质量，低分结果的工程处理策略
5. **四、Metadata 工程：检索质量的第二引擎** — metadata 不参与向量化但决定检索效果，过滤、排序、溯源三大用途，真实业务的 metadata schema 设计方法
6. **五、上下文窗口管理：增强（Augmented）阶段的工程权衡** — top_k 的选择逻辑、片段去重与排序、token 预算分配（检索 vs 生成）、Prompt 模板设计模式
7. **六、生产级 RAG 架构选型** — 内存向量存储 vs 持久化向量数据库，嵌入模型选型（性能/成本/维度），向量数据库横向对比
8. **七、高级 RAG 模式概览** — HyDE、Multi-hop Retrieval、Self-Querying、Parent Document Retrieval、RAG-Fusion，面试中展示视野广度
9. **八、RAG 面试题库与答题框架** — 从基础概念到架构决策，每个问题的面试官意图拆解与答题思路
10. **结语** — RAG 不是"查一下然后问模型"，而是一套以检索质量为核心的工程系统

## 核心代码

- rag-demo/src/index.mjs：完整的 LangChain RAG 链路——ChatOpenAI + OpenAIEmbeddings + MemoryVectorStore + Retriever + similaritySearchWithScore + Prompt 组装 + LLM 调用
- readme.md：RAG 强化概念笔记，涵盖检索器机制、向量存储、相似度评分

## 面试要点

- RAG 完整链路的 7 个步骤及其工程要点
- retriever.invoke() 与 vectorStore.similaritySearchWithScore() 的区别
- 余弦相似度 vs 欧氏距离的适用场景
- 相似度分数的阈值设置与低分处理策略
- metadata 设计与检索质量的关系
- top_k 的选择逻辑与 token 预算管理
- 内存向量存储 vs 持久化向量数据库的选型依据
- HyDE、Multi-hop、Self-Querying 等高级 RAG 模式的核心思想
- 生产环境 RAG 的常见问题与优化方向

## 情感线
从"能跑就行"的 Demo 心态，到"每一个 score 都要有解释，每一个 metadata 字段都要有用途"的工程思维。RAG 不是调一个 API 就完事，而是一个检索系统的设计——检索质量决定了生成质量的上限。
