## 混合检索RAG: 多路召回 + 重排模型

混合检索RAG = Milvus 向量检索(语义) + ES 文本检索(关键词，缺点语义不够丰富)

Agentic RAG
- 然后提高RAG 召回率，召回质量 [...m, ...es] -> 去重 + 重排(排序) 上下文大小限制 开销 -> Auguments(高质量、精简)

## ES 的 CRUD
和Mysql 差不多  原始数据
ES CRUD
milvus

## ReRank 模型
机器学习
打分
混合检索给到大模型特别多document，我们需要筛选一下
混合召回的文档先做一次ReRank，把最相关、最有用、最能支撑回答的文档筛选出来，再增强Prompt
为什么？
- 混合召回(向量+关键词) 会带来大量冗余信息
- 大模型上下文有限，不能把所有文档都塞进去
- 先过滤，再精简，才能回答准确

### 创建配料
流程：
- 用户输入query
- 拆分不同角度，三个子问题
- 多路召回
  - 向量检索
  - 关键词检索
- 结果合并 去重
- 重排序、相关性打分(Rerank)
  - 最相关的排前面
  - 取N条
- 把高质量文档送入大模型
- 大模型基于上下文生成最终回答

## 模型
- AIGC 模型
- embedding 模型
- ReRank 模型
  - elastic search
  - 全文检索
    排序 BM25 给查询出来的文档打分
    重排模型就是输入用户问题 + 一段文档，输出一个相关度分数专门用来给RAG 去噪，筛选，重新排序
    体积小，推理快，成本极低
- jev m模型
  100 倍的速度
  1/100 的价格

## 全新Agentic RAG 流程 检索逻辑
- ES 关键词检索召回一批
- Milvus 向量检索召回一批
- 合并去重
- 丢给Rerank 模型排序
- 只取前几条

### 类似的内容存入es 和 milvus
- ES 存原文 + 倒排索引（分词后建 index），Milvus 存原文 + 向量（embedding 后建 collection）
- 同一份 chunk 两次写入，靠同一个 doc_id / book_id+chapter 字段对齐两边，混合检索时各自召回再融合
- volumes 数据挂载
  - 为什么：容器里的数据默认随容器生灭，`docker compose down` 再 `up` 数据就没了；数据必须落到宿主机
  - 做法：docker-compose.yml 里把容器内数据目录映射到宿主机目录（容器内路径 : 宿主机路径）
  - ES：`/usr/share/elasticsearch/data` → 宿主机 `./volumes/es`
  - Milvus：三个组件各挂一个——etcd(元数据)、minio(对象存储/实际数据)、milvus(运行数据) → `./volumes/etcd|minio|milvus`
  - Kibana：挂 `kibana.yml` 配置即可，数据在 ES 里
  - 效果：`docker compose down/up` 数据还在；`down -v`（删命名卷）或手动删挂载目录才会清空
  - 坑：挂载目录里全是二进制数据文件（rdb_data/*.log、xl.meta 等），不要 git add 进仓库，用 .gitignore 挡掉

## 混合检索
用户问题 -> 大模型改写 -> 生成3-5个不同角度问题 -> 每个问题都去ES + Milvus 检索 -> 合并去重 -> 丢给Rerank 模型排序 -> 只取前几条 -> 送入大模型生成最终回答

rag 中怎么提升召回质量
改写3-5个不同角度的问题，更多的文档
rag 中怎么提升召回质量
es + milvus
ReRank