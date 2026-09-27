# LangSmith 全链路观测：从Agent 调试到RAG 量化评估

## trace 追踪
langchain\langgraph 开发Agent，强烈的”盲盒感“

调用了哪个工具？每一步耗时多少？流式的Token，消耗了多少token？

如果你无法度量它，你就无法管理它。

给Agent 加上全生命周期的可观测性，LangSmith 是不可或缺的仪表盘

## 核心功能
- Trace 追踪bug，调试agent
  每次agent 的执行
- Monitoring
  Agent 后台实时监控
  llm token开销、时间、工具
- Datasets
  数据集，问题-回答对
- Evaluators
  评估器 评估Agent 的回答

langsmith trace graph 的运行，考到了整体统计的monitor数据，
Agent 运行情况一目了然，非常方便接入全链路的观测
对业务相关做标准化评估
Dataset，测试样本，统一存放用户提问和标准答案(搭建数据集)
再通过Evaluators 设定打分，批量完成自动化评测，精准衡量回答质量，优化Agent和RAG相关业务逻辑