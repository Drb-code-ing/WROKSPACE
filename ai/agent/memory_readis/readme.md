# Redis: 实现Agent 短期记忆存储的最佳方案

## 你了解Agent Memory 吗？你是怎么设计的？

Agent Memory 本质是就是解决一个问题：大模型（无状态）本身没有可靠的、跨请求的持久记忆能力，但是业务
又希望他能记住之前发生的事情，并且在后续对话中利用这些信息。

内存messages(本轮会话记忆) -> redis(短期记忆 内存数据库 快) -> psql(存储 + 向量化 长期记忆)

- 短期记忆主要解决当前会话问题，比如用户之前说了什么、当前任务进行到了哪一步。这部分我倾向于用redis 存储，
  方便快速读取，也比较适合设置过期时间。
- 长期记忆主要解决**跨会话**问题，比如用户个人偏好、长期目标、以及历史交互中值得保留的信息。
  会使用psql (vector)，更方便的Memo0 记忆管理方案。负责记忆提取、更新和检索，底层再根据具体架构使用向量数据库
- 另外还有一个非常重要的问题，就是上下文窗口有限

如果我们每次都把完整的聊天记录塞给大模型，随着对话变长，不仅容易超出token 限制，还会增加推理成本和响应延迟。
所以，我会结合上下文截断、总结和相关记忆检索

简单来说，就是Redis 管当前会话短期记忆，Mem0（psql）管跨会话长期记忆，把当前真正需要的信息组装成Prompt，交给大模型

- 什么是负载均衡？
负载均衡就是把用户请求分给多台服务器，不让某一台扛太多压力，避免卡死，提升整体速度。
一台挂了还能让别的顶上
nginx 可以实现负载均衡配置
```json
http {
  upstream backend {
    server 192.168.1.100:6379;
    server 192.168.1.101:6379;
    ....
  }
}
```
- 负载均衡算法
  - 轮巡：请求挨个分给服务器
  - 加权轮巡：强的服务器多接点
  - 最少链接：挑现在链接最少的服务器
  - IP 哈希：同一个用户，一直分到同一台服务器

## Redis 用于短期记忆存储
Redis 是一个高性能的键值型内存数据库，也是后端开发中最常用的**缓存**中间件之一

它的数据默认存在内存里，读写延迟通常在亚毫秒级，天生适合处理像对话上下文这样的高频读写场景

redis 几个特性，完美匹配Agent 短期记忆需求

- 支持TTL（过期时间）Time To Live
  会话闲置一段时间后，数据会自动过期清理，不用我们写格外的定时清理逻辑，非常省心
- 多实例共享数据
  所有Agent 服务实例都能连接同一个Redis，用户的会话上下文在任何实例上都能被读取，完美解决了负载均衡下的会话共享问题
- 丰富的数据结构
  String 存放对话简要
  Hash 存会话原信息
  List 直接存对话列表

## 使用Redis
- 连接
- CRUD
  - key 索引
  - 数据结构
    - String
    适用场景：倒计时验证码、Token、登录会话、计数器、配置项、文本类短期记忆（总结）、文章阅读数、分布式锁
    - 核心命令
    set key value 存
    get key 取
    setex key 秒数 value 存过期时间
    incr key 自增
    decr key 自减
    incrby key 步长 自增指定步长
  - TTL

## 二、Hash 哈希数据结构
适用场景：用户信息、商品资料、购物车、结构化对话上下文

hset key field value 存
hmset key field1 value1 field2 value2 ... 批量存
hget key field 取
hgetall key 取所有字段
hkeys key 取所有字段名
hvals key 取所有字段值
hincrby key field 增量

## 三、List 列表数据结构
适用场景：消息队列、任务队列、操作日志、聊天历史、有序记录
双向的链表

lpush key value1 value2 ... 从左端入队
rpush key value1 value2 ... 从右端入队
lrange key 0 -1 取所有元素
lpop key 从左端出队
rpop key 从右端出队
llen key 取列表长度
ltrim key 0 -1 截断列表

## 四、Set 集合数据结构
适用场景：数组去重、每日签到 IP 黑名单、共同好友、权限标签

sadd key value1 value2 ... 存
smembers key 取所有元素
sismember key value 是否存在
sinter key key2 ... 取交集
sunion key key2 ... 取并集
sdiff key key2 ... 取差集

## 五、ZSet 有序集合数据结构
适用场景：各类排行榜、内容热度排序、用户积分排名、权重队列
zadd key score member 存
zrange key 0 -1 取所有元素
zrevrange key 0 -1 取所有元素（倒序）
zscore key member 取元素分数
zrank key member 取元素排名

## 六、位图
二进制

## 七、Geo 地理位置数据结构
适用场景：地图定位、距离计算、区域分析、附近门店、附近用户
geoadd key 精度 维度 名称 ... 批量存
geodist key member1 member2 取两个元素之间的距离

## 基于redis 实现agent 短期记忆的存储
基于redis 实现agent 短期记忆的存储，具体的摘要+截断的压缩逻辑是用deepagents 的
summarizationMiddleware 中间件

Agent 基本都是基于Redis 做短期记忆的存储，用postgreSQL 做历史消息、长期记忆的存储
我们学了Redis 的七种数据类型
String
Hash
List
Set
ZSet
Bitmap
Geo
redis + deepagents 实现agent 短期记忆的存储

一般把每轮消息插入PSQL 做历史消息，还能用于基于向量做长期记忆检索