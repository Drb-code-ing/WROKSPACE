# PostgreSQL: AI 时代**最适合**的数据库

Mysql + Milvus = Pg

关系型数据库是互联网应用的基石

## 消息长时记忆 PG 来做
豆包、Codex 等Agent 都需要长期存储聊天记录
数据表怎么设计
- 用户表
  user_id
- 会话表 title
  一对多
  user_id 关联用户表
  获取所有的会话列表
- 消息表 messages
  点击某个会话，获取所有的消息

## SQL
SELECT * FROM conversations
WHERE user_id = "你的用户ID"

SELECT * FROM messages
WHERE conversation_id = "你的会话ID"
ORDER BY created_at ASC

MYSQL, PG 流行的关系型数据库
AI 时代 PG 优势更大
只需要在原来的消息表上，多加一个向量字段(mysql 不支持)，不需要额外数据库(双写)
不需要双写，维护两套系统

内联 inner join
  交集
外链接
  left join
    左连接，保留左表所有记录，右表没有匹配记录时，用 NULL 填充
  right join
    右连接，保留右表所有记录，左表没有匹配记录时，用 NULL 填充
  full join
    全连接，保留左右表所有记录，匹配记录时，用 NULL 填充
  cross join
  并集

SELECT m.*
FROM messages m
JOIN conversations c
  ON m.conversation_id = c.id
WHERE c.user_id = "你的用户ID"
  AND c.id = "你的会话ID"
ORDER BY m.embedding <=> '[1.2, 0.5, 0.8, ....]'
LIMIT 5

按用户过滤、按会话过滤、按时间排序、按语义过滤
AI 时代最需要的能力
不用拆分架构、不用同步数据、不用写复杂的关联逻辑
一张表、搞定传统关系查询+AI 长期记忆

`<=>`是pgvector里的**向量余弦距离运算符**
向量余弦距离越小 = 1 - 向量余弦

## ORM
开发并不写SQL，ORM 操作数据库
typeorm node orm 库
nestjs 特色 1. MVC模块化 2. 依赖注入

## ORM 操作流程
1. 数据库全局配置
2. nest g res conversations --no-spec
   自动创建资源型的conversations模块
   restful CRUD 基本方法
3. nest mvc 模块化
   - module 声明
   - controller 控制器
     装饰器 路由
4. entities 实体类
   八股文 表的映射
   orm 需要
   在全局注册
5. dto
   data transfer object
   用于前端和后端之间传递数据
   约束提交规则 如果不行直接报错 退出