# GraphRAG

Milvus/PgVector 向量检索，检索出语义相近的文档
Elasticsearch 倒排索引 + bm25 检索出包含关键词的文档

ReRank

无法捕捉数据之间的关联关系，只能实现“单点式”检索，难以应对需要挖掘数据内在逻辑，关联链路的场景

多跳 因果

奶茶推荐  奶茶做法  奶茶品牌  原材料

Milvus 和 ES 更像是精准找货的工具，如果需要搞清楚 货与货之间的关系 货的来龙去脉，
Agent 开发的RAG 场景中，需要基于文档关联推导答案、梳理知识体系

## Neo4j
Neo4j 是一款原生图数据库，以节点、关系存储数据，擅长高效查询实体间的复杂关联关系
用它实现知识图谱
不关注单个数据本身(psql, mysql, es) 而是专注于存储和挖掘数据之间的关联关系
分散的文档、实体、关键词，像蜘蛛网一样串联起来 形成清晰的知识图谱
完美解决milvus 和 es 无法捕捉关联关系的痛点

MySQL SQL 查询记录
Neo4j cypher 查询节点之间的关系

奶茶  配料  制作工艺  适合人群   存入Neo4j
能轻松实现  检索珍珠奶茶 -> 关联到珍珠配料表 -> 串联到制作工艺 -> 延伸到适合的消费场景
多跳检索的全链路检索

RAG 优化为Agentic RAG + Graph RAG
Graph RAG 基于图数据库实现的关联检索

图谱关联 + 语义匹配 + 关键词匹配 的多从检索，让RAG 生成答案更精准，更具解释性

传统RAG 拿到的是碎片化信息，没有结构，没有关联，像一个个信息孤岛

而想要真正实现能推理、能关联、能解释的下一代RAG，必须用上知识图谱 + Graph RAG

# Neo4j Cypher 语句实战：奶茶知识图谱

## 一、创建实体(节点)
### 1. 创建奶茶品类
CREATE (product: Product {name: '珍珠奶茶'})
CREATE (type1: Type {name: '台湾奶茶'})
CREATE (type2: Type {name: '港式奶茶'})
CREATE (brand1: Brand {name: '蜜雪冰城'})
CREATE (brand2: Brand {name: '古茗'})

### 2. 创建配料
CREATE (ing1: Ingredient {name: '珍珠'})
CREATE (ing2: Ingredient {name: '芋圆'})
CREATE (ing3: Ingredient {name: '果糖'})
CREATE (ing4: Ingredient {name: '红茶'})
CREATE (ing5: Ingredient {name: '牛奶'})

### 3. 创建制作工艺
CREATE (method1: Method {name: '煮制'})
CREATE (method2: Method {name: '冲泡'})

### 4. 创建适合人群
CREATE (people1: People {name: '年轻人'})
CREATE (people2: People {name: '学生'})
CREATE (people3: People {name: '美食爱好者'})

## 二、建立关系(知识图谱的核心)
MATCH (p: Product {name: '珍珠奶茶'}), (t: Type {name: '台湾奶茶'})
CREATE (p)-[:属于]->(t)

MATCH (p: Product {name: '珍珠奶茶'}), (i: Ingredient {name: '珍珠'})
CREATE (p)-[:包含]->(i)

MATCH (p: Product {name: '珍珠奶茶'}), (i: Ingredient {name: '芋圆'})
CREATE (p)-[:包含]->(i)

MATCH (p: Product {name: '珍珠奶茶'}), (i: Ingredient {name: '果糖'})
CREATE (p)-[:包含]->(i)

MATCH (p: Product {name: '珍珠奶茶'}), (i: Ingredient {name: '红茶'})
CREATE (p)-[:包含]->(i)

MATCH (p: Product {name: '珍珠奶茶'}), (i: Ingredient {name: '牛奶'})
CREATE (p)-[:包含]->(i)


MATCH (p: Product {name: '珍珠奶茶'}), (peo: People {name: '年轻人'})
CREATE (p)-[:适合]->(peo)

MATCH (p: Product {name: '珍珠奶茶'}), (peo: People {name: '学生'})
CREATE (p)-[:适合]->(peo)

MATCH (p: Product {name: '珍珠奶茶'}), (peo: People {name: '美食爱好者'})
CREATE (p)-[:适合]->(peo)

MATCH (i: Ingredient {name: "珍珠"}), (m: Method {name: "煮制"})
CREATE (i)-[:使用]->(m)

MATCH (i: Ingredient {name: "珍珠"}), (m: Method {name: "冲泡"})
CREATE (i)-[:使用]->(m)

## 三、查询验证
### 1. 查询全部节点与关系
MATCH (n)-[r]->(m)
RETURN n, r, m

### 2. 多跳关联查询(Graph RAG 能力)
查询：珍珠奶茶 -> 配料 -> 制作工艺
MATCH (p: Product {name: '珍珠奶茶'})-[:包含]->(i)-[:使用]->(m)
RETURN p.name, i.name, m.name

珍珠奶茶适合哪些人
MATCH (p: Product {name: '珍珠奶茶'})-[:适合]->(peo)
RETURN p.name, peo.name

## 更新
MATCH (p: Product {name: '珍珠奶茶'})
SET p.calorie = "中高热量", p.taste = "甜香"

MATCH (i: Ingredient {name: "珍珠"})
SET i.origin = "台湾", i.hard = "Q弹"

## 删除关系
MATCH (p: Product {name: '珍珠奶茶'})-[r: 适合]->(s: People {name: '学生'})
DELETE r

MATCH (t: Type {name: '港式奶茶'}) // 删除这个节点
DELETE t

MATCH (i: Ingredient {name: "芋圆"})-[r]-() // 删除所有关系
DELETE r, i

MATCH (n) // 删除所有节点
DELETE n
