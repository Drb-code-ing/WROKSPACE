# RabbitMQ Agent 中异步处理的标配方案

RAG 流程里，pdf、docx、pptx 各类文档输出会解析为Markdown 格式。
然后会分片存入向量数据库(milvus)，也会存入Elasticsearch 做全文检索...
那解析的接口做向量化、ES存储，需要同步等他们完成吗？

没有必要，可以异步做
后端如果要做异步处理，一般都是用**消息队列 MQ**

## RabbitMQ 核心概念

### Producer 生产者

### Consumer 消费者

### Connection 连接 tcp
Exchange 有4种
- fanout: 广播模式，将消息发送到交换机的所有Queue
- direct: 直连模式，根据路由键将消息发送到指定的Queue
- headers: 根据消息的headers将消息发送到指定的Queue的队列，支持模糊匹配
- topic