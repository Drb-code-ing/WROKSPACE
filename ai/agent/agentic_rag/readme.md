# Agentic RAG
AI Agent 全栈开发岗
- 你用什么向量数据库
milvus  ts
qdrant  py
pipecone
pgvector
...
## RAG 是什么
公司内部的Agent 基本都要用到RAG
llm能思考，但不知道公司内部的文档，我们需要基于内部文档来回答
这个流程太固定了，有些缺点
- 所有都走RAG 检索？简单问题不需要检索，浪费资源(token、时间、成本)
  1 + 1 = ？
  两个分支
- 没有纠错和评估机制，无法判断检索内容是否精确，是否足够
  llm 评估函数
- 处理不了需要多步检索的复杂问题，比如先查A，再查B，最后回答问题
  天龙八部中四大恶人排行第二是谁？此人之子在身份揭晓之前，其生父在武林中的公开身份是什么？
  llm 规划 拆分 分步骤
- 专业术语、精确实体更适合关键词检索，纯语义检索容易匹配不准
  mysql like 查询 正则 文字匹配
  高血糖、低血糖  自然语义相似度 相近
  关键词检索
- 本地知识库没有的内容  去网络搜索补充？
  llm 胡说

死板的检索生成流程，升级为可思考、判断、纠错的智能RAG架构

## Agentic
自主规划，更智能，评估
langgraph 设计一个graph表示 Agentic RAG 流程

## RAG graph
- 简单问题 仍然会走retrieve，浪费token和时间
  重新设计graph

## 继续优化现在RAG 的问题
- 处理不了需要多步检索的复杂问题，比如先查A，再查B，最后回答问题
  llm 规划 拆分 分步骤

## 网络搜索来兜底
本地知识库没有的内容，不会主动去网络搜索补充，容易编造答案

网络搜索结果，增强prompt
混合检索 = 向量数据库 + 网络搜索 + elastic search

## 倒排索引
ES 相比于MySql 最大的核心优势，基于**倒排索引**底层机制

普通MySql 使用的是基于正向索引：
以一行为单位存储完整数据，检索文本内容时，需要逐行遍历，逐字匹配内容。
数据量越大，文本越长，模糊/文本搜索就越慢，性能越差，不适合打范围关键词检索。
ES 使用倒排索引机制：
正向索引：文档 -> 关键词
会自动对text 类型字段进行分词处理，才结尾一个个独立词条，再以词条为核心，反向关联所有包含该词条的文档
倒排索引：关键词 -> 文档

用户输入关键词检索，ES 只需通过词条快速匹配相关的文档，无需遍历全表，实现**海量**文本下**毫秒**级的全文检索

- 基于请求
  GET 查询 /_cat/indices
  输出所有索引  table 组织并显示
- 创建索引 PUT /article
  建表一样 mappings  schema
  properties 和搜索相关各个字段
  title, content 分词  type: text
  author  不分词  type: keyword
- 自动去分词建索引 将ID放入列表
  keyword 类型字段 不分词，整值精确匹配
  type = "text"  type = "keyword"
  **全文检索** 加 **精确过滤**

- 检索API
  GET /article/_search
  {
    "query": {
      "match": {
        "title": "高血糖"
      }
    }
  }

- DSL
  MySql SQL
  Milvus embedding
  DSL 全称 Domain-Specific Language 领域特定语言
  Elastic Search   http 查询

- ik_max_word + ik_smart 中文友好的两种分词器
  存的时候 ik_max_word 尽量多存索引，粒度更细
  检索的时候 ik_smart