# Milvus 向量数据库：AI 日记本的三组件部署、集合字段建模与余弦索引

第六十五天（2026-08-28）动手把 Milvus 向量数据库从 Docker 装起来，用最新版 SDK 建了一个"AI 日记本"的集合：日记的增删改查放在 MySQL（非 AI 功能），"最近心情比较好的日记"这类语义检索，则把日记向量化存进 Milvus（AI 功能）。一条数据分两个库存，MySQL 管精确查找、Milvus 管语义匹配，这就是向量数据库在一套应用里的位置。围绕这个动手过程有三个技术核心：**Milvus standalone 不是"一个容器"，而是 etcd + MinIO + Milvus 三个服务的组合**；**集合（collection）的字段类型怎么建模，主键、向量维度、数组标签各按什么规则来**；**从建索引、加载集合到插入一条带向量的日记，每一步为什么是必要的**。这篇按落地顺序讲这三件事。

---

## 一、向量数据库与关系型数据库的分工

先明确 Milvus 解决什么问题。传统数据库（MySQL / SQLite / Postgres）基于对数据的增删改查实现业务功能：按 id 或者关键词 `like` 去关联、查询一些列表数据，是**精确匹配**。而 Agent / AI 应用会把知识、记忆放在向量数据库里，对知识、记忆做**语义检索**、增删改查——查询时把 query 向量化，去数据库做相似度匹配，查出相关文档放到 prompt 里给大模型，大模型再回答。这就是 RAG 的底座。

Milvus 就是这层底座：Zilliz 推出的开源向量数据库，专为处理海量高维向量数据而设计。笔记里对 AI 日记本场景的设计是：

> 日记的增删改查 CRUD MySQL 非 AI 功能；同时将 entity 向量化存储到 milvus 中 AI 功能。

也就是说，一条日记同时落在两个地方：**MySQL 管"按 id 查某天日记、改、删"**，这是精确操作；**Milvus 管"按语义找相似的日记"**，比如"心情比较好的那些天"，这是模糊的、语义的。两者不冲突，是同一份业务数据的两种查询能力。

---

## 二、三组件部署：一次 compose 起三台服务

Milvus 不能像 PostgreSQL 那样一个镜像就够。**Milvus standalone 的 docker-compose 里是三个服务：`etcd`、`minio`、`standalone`**，这是最容易误解、也最该先看明白的一点。

```yaml
version: '3.5'

services:
  etcd:
    container_name: milvus-etcd
    image: quay.io/coreos/etcd:v3.5.25
    environment:
      - ETCD_AUTO_COMPACTION_MODE=revision
      - ETCD_AUTO_COMPACTION_RETENTION=1000
      - ETCD_QUOTA_BACKEND_BYTES=4294967296
      - ETCD_SNAPSHOT_COUNT=50000
    volumes:
      - ${DOCKER_VOLUME_DIRECTORY:-.}/volumes/etcd:/etcd
    command: etcd -advertise-client-urls=http://etcd:2379 -listen-client-urls http://0.0.0.0:2379 --data-dir /etcd
    healthcheck:
      test: ["CMD", "etcdctl", "endpoint", "health"]
      interval: 30s
      timeout: 20s
      retries: 3

  minio:
    container_name: milvus-minio
    image: minio/minio:RELEASE.2024-05-28T17-19-04Z
    environment:
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
    ports:
      - "9001:9001"
      - "9000:9000"
    volumes:
      - ${DOCKER_VOLUME_DIRECTORY:-.}/volumes/minio:/minio_data
    command: minio server /minio_data --console-address ":9001"
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 30s
      timeout: 20s
      retries: 3

  standalone:
    container_name: milvus-standalone
    image: milvusdb/milvus:v3.0.0
    command: ["milvus", "run", "standalone"]
    security_opt:
    - seccomp:unconfined
    environment:
      MINIO_REGION: us-east-1
      ETCD_ENDPOINTS: etcd:2379
      MINIO_ADDRESS: minio:9000
    volumes:
      - ${DOCKER_VOLUME_DIRECTORY:-.}/volumes/milvus:/var/lib/milvus
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9091/healthz"]
      interval: 30s
      start_period: 90s
      timeout: 20s
      retries: 3
    ports:
      - "19530:19530"
      - "9091:9091"
    depends_on:
      - "etcd"
      - "minio"

networks:
  default:
    name: milvus
```

三个服务各司其职：

- **`etcd`（元数据）**：保存 Milvus 的元数据——集合、分区、段的 schema 信息，以及各组件之间的协调状态。Milvus 把"数据长什么样"交给 etcd 管，数据本身不在这。所以它有自己的调参：`ETCD_AUTO_COMPACTION` 控制历史 revision 的自动压缩、`ETCD_QUOTA_BACKEND_BYTES` 限制后端存储配额；
- **`minio`（对象存储）**：S3 兼容的对象存储，**向量数据和索引文件真正落盘的地方**。暴露 9000（对象存储 API）和 9001（Web 控制台）两个端口，默认账号密码都是 `minioadmin`；
- **`standalone`（Milvus 引擎）**：对外提供向量检索的引擎本体。它的环境变量把三个服务串起来——`ETCD_ENDPOINTS: etcd:2379` 告诉引擎元数据在哪、`MINIO_ADDRESS: minio:9000` 告诉引擎数据落哪。对外只暴露两个端口：**19530 是 gRPC 端口，SDK 就连这个**；9091 是健康检查与指标端口。

为什么拆成"元数据 + 对象存储 + 引擎"三层？因为海量高维向量不可能都堆在内存或单块磁盘上，数据最终要落在可水平扩展的对象存储里，元数据要单独维护。standalone 模式就是把这套分布式架构用三个容器"压"到一台机器上——**先用最小代价跑通架构，后面数据大了再横向扩展**。

还有两个工程细节值得记：`seccomp:unconfined` 是 Milvus 官方推荐的 seccomp 配置；`standalone` 的 healthcheck 用 `curl http://localhost:9091/healthz`，并带了 `start_period: 90s`——因为 Milvus 引擎启动很慢，要给足"等待期"再开始判健康。三个容器都用 `${DOCKER_VOLUME_DIRECTORY:-.}/volumes/...` 把数据挂到宿主机，**容器销毁重启，向量数据不丢**。

---

## 三、集合建模：一张"日记表"的字段类型

Milvus 里一张"表"叫 **collection（集合）**。SDK 连接之后，用 `createCollection` 建集合。第六十五天建的 `ai_diary` 集合，字段定义是：

```js
await client.createCollection({
  collection_name: COLLECTION_NAME, // 'ai_diary'
  fields: [
    { name: 'id', data_type: DataType.VarChar, max_length: 50, is_primary_key: true },
    { name: 'vector', data_type: DataType.FloatVector, dim: VECTOR_DIM },
    { name: 'content', data_type: DataType.VarChar, max_length: 5000 },
    { name: 'date', data_type: DataType.VarChar, max_length: 50 },
    { name: 'mood', data_type: DataType.VarChar, max_length: 50 },
    { name: 'tags', data_type: DataType.Array, element_type: DataType.VarChar, max_capacity:10, max_length: 50 }
  ]
});
```

六个字段，四种类型，每个选择背后都是一个决策：

**1. 主键 `id` 用 VarChar 字符串，而不是自增数字。** 日记有天然的业务 id（`diary_001`），直接拿它当主键。字符串主键的代价是排序/范围查询不如数字快，但换来的是"业务 id 直接可查、按 id 插入可去重覆盖"，对日记这种自带编号的数据很自然。

**2. `vector` 是 `FloatVector`，`dim: 1024`，维度由 embedding 模型说了算。** 集合里向量列的维度，必须和生成它的 embedding 模型的输出维度严格一致。代码里 `VECTOR_DIM = 1024`，同时 embeddings 配置里也写死了 `dimensions: VECTOR_DIM`（1024）——这是 1024 维嵌入（如 text-embedding-3 系列可截断的维度），两边不一致，插入时维数不匹配会直接报错。

**3. 标量字段 `content / date / mood` 随向量一起存。** 向量数据库不只是"存向量"，它同样存标量字段。检索命中的记录能直接把 `content` 正文、`date`、`mood` 一起带出来——**一次查询拿到原文，不用再回 MySQL 查一遍**。`content` 是日记正文，`max_length: 5000`；`date` 和 `mood` 各 50。

**4. `tags` 用 `Array` 数组字段装多个标签。** 一条日记有多个标签（`['生活', '散步']`），Milvus 支持数组类型：`element_type: VarChar` 声明元素是字符串，`max_capacity: 10` 限制最多 10 个元素，`max_length: 50` 限制每个标签长度。**"多个值"这种形态交给数组字段，而不是拼成逗号字符串**——查询时按标签过滤、按单个标签匹配都干净得多。

---

## 四、建索引、加载集合：查询前必经的两步

集合建好之后，代码按"建索引 → 加载集合 → 插入"的顺序推进。

**1. 建索引：`IVF_FLAT` + `COSINE` + `nlist: 1024`。**

```js
await client.createIndex({
  collection_name: COLLECTION_NAME,
  field_name: 'vector',
  index_type: IndexType.IVF_FLAT,
  metric_type: MetricType.COSINE,
  params: { nlist: 1024 }
});
```

三个参数分别是三个独立的决策：

- **`IVF_FLAT`（倒排文件索引）**：把向量空间分成 `nlist` 个簇（聚类中心），查询时只在这部分簇里做暴力比对，而不是全库扫一遍。IVF_FLAT 是**入门最稳的选择**——索引构建快、召回相对可靠，"够用就好"，之后再根据召回率往 HNSW 等更优结构换；
- **`MetricType.COSINE`（余弦相似度）**：衡量两个向量方向上的接近程度，而不是欧氏距离。文本 embedding 普遍用余弦——两段文本"说得像不像"看方向比看距离更符合直觉；
- **`nlist: 1024`**：聚类中心的数量，也就是把向量空间切成多少份。它是索引的"粗粒度"，配合查询时的 `nprobe`（搜索多少个簇）控制精度与耗时的平衡：`nprobe` 越大越准也越慢。

**2. 加载集合：`loadCollection` 之后才能查。**

```js
await client.loadCollection({ collection_name: COLLECTION_NAME });
```

这是 Milvus 与传统数据库最不同的一点：**数据落在对象存储（MinIO）上，写完不等于能查。`loadCollection` 把数据和索引加载进内存，之后才能被检索。** 这是 Milvus 的查询模型——搜索是针对"已加载到内存的集合"进行的。

顺带说清一个顺序问题：代码里是"建索引 → 加载 → 插入"，也就是**先 load 再 insert**。这在 Milvus 里是合法的——它支持增量加载，load 之后新插入的数据会继续被索引、可以被检索到。更常见的生产顺序是"插入 → 建索引 → 加载"，两种都能跑通；这篇代码以先 load 后 insert 的方式展示了每一步的 API，顺序不是唯一的正确答案，`loadCollection` 在查询前必须执行才是。

---

## 五、生成嵌入并插入：一条日记的向量化

集合就绪后，把日记向量化写进去。嵌入用 langchain 的 `OpenAIEmbeddings`，密钥、模型、网关地址都从 `.env` 读：

```js
const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.EMBEDDINGS_MODEL_NAME,
    configuration: {
        baseURL: process.env.OPENAI_BASE_URL
    },
    dimensions: VECTOR_DIM
});
```

`dimensions: VECTOR_DIM` 就是第三节说的"维度对齐"——模型输出 1024 维，集合的 `vector` 字段也是 1024 维。`embedQuery(text)` 把单条文本变成向量：

```js
async function getEmbedding(text) {
    const result = await embeddings.embedQuery(text);
    return result;
}
```

然后给 5 条日记逐条生成向量，组装成"标量字段 + vector"的记录，`Promise.all` 并行插入：

```js
const diaryData = await Promise.all(
    diaryContents.map(async (diary) => ({
        ...diary,
        vector: await getEmbedding(diary.content)
    }))
);

const insertResult = await client.insert({
    collection_name: COLLECTION_NAME,
    data: diaryData
});
console.log(`✓ Inserted ${insertResult.insert_cnt} records\n`);
```

注意插入的数据结构：**每条记录是 `{ ...diary, vector }`**——原来的 `id / content / date / mood / tags` 原样保留，再补一个 `vector` 字段。`insert` 返回 `insert_cnt`，明确告诉你实际写入了多少条，比"没报错就当成功"可靠。

到这里，"AI 日记本"的地基打完了：环境跑起来、集合建好、5 条日记带向量入库。下一步自然是**拿一句 query 向量化，去集合里做语义检索**——检索代码不在本次提交里，留给后续（v054 / v055 的博客已讲过检索链路与指标，本篇专注从 0 部署到数据入库这一段）。

---

## 面试问答

**问：一条日记为什么既要存 MySQL 又要存 Milvus？**

> 两种存储回答两种问题。MySQL 管精确操作：按 id 查某天日记、修改、删除（CRUD）。Milvus 管语义检索：把 query 向量化后做相似度匹配，"心情比较好的日记"这类问题靠语义而不是关键词。传统数据库是精确匹配（id / like），向量数据库是语义匹配，同一份业务数据按查询类型拆到两个库，互不替代。

**问：Milvus standalone 为什么是三个容器，而不是一个？**

> Milvus 的架构天然是"元数据 + 对象存储 + 引擎"三层：etcd 保存集合/分段的元数据与协调状态，MinIO（S3 兼容对象存储）真正存向量数据和索引文件，standalone 是检索引擎本体。海量高维向量需要对象存储做水平扩展、元数据单独维护，standalone 模式就是把这套分布式架构用三个容器跑到一台机器上。三个容器通过环境变量串起来：standalone 的 `ETCD_ENDPOINTS` 指 etcd、`MINIO_ADDRESS` 指 MinIO。

**问：集合里 `vector` 字段的 `dim: 1024` 是怎么定的？**

> 不是拍脑袋，是**由 embedding 模型的输出维度决定**。代码里 `VECTOR_DIM = 1024` 同时用于两处：`OpenAIEmbeddings` 配置的 `dimensions` 和集合字段的 `dim`，两边必须严格一致。模型输出多少维，集合就建多少维，不一致时插入会因维度不匹配报错。

**问：`IVF_FLAT`、`COSINE`、`nlist` 分别是什么意思？**

> `IVF_FLAT` 是倒排文件索引：把向量空间按 `nlist` 个聚类中心切分，查询只在部分簇里暴力比对，是入门最稳的索引，之后可按需升级到 HNSW 等。`COSINE` 是度量方式（余弦相似度），衡量向量方向上的接近程度，文本 embedding 常用。`nlist` 是聚类中心数量，配查询参数 `nprobe`（搜多少个簇）控制精度与耗时的平衡。

**问：为什么插入数据之后还要 `loadCollection` 才能查询？**

> Milvus 的数据落在对象存储（MinIO）上，不在内存里。`loadCollection` 把数据和索引加载进内存，之后集合才可被检索。这是 Milvus 的查询模型：搜索针对"已加载的集合"进行。写完不等于能查，`load` 是查询前的必经步骤。

**问：集合里 `tags` 为什么用 `Array` 数组字段，而不是逗号分隔的字符串？**

> 一条日记有多个标签，数组字段直接表达"多个值"这种形态：`element_type` 声明元素类型、`max_capacity` 限制数量、`max_length` 限制单元素长度。相比拼逗号字符串，按标签过滤、按单个标签匹配都更干净，是"列类型跟着数据形态走"的又一个例子。

**问：插入日记时，记录的数据结构为什么是 `{ ...diary, vector }`？**

> 每条记录 = 标量字段（`id / content / date / mood / tags`）+ 一个 `vector` 向量字段。标量字段随向量一起存，检索命中时能直接把正文和属性带出来，不用回原库回表；`vector` 由 `embedQuery` 把文本转成 1024 维向量。`insert` 返回的 `insert_cnt` 用来确认实际写入条数。

---

## 结语：从 docker compose 到第一条带向量的日记

第六十五天的产出，是把"语义检索"从概念落成可运行的本地环境加一份结构化数据：

```text
部署      docker compose 起 etcd（元数据）+ MinIO（对象存储）+ Milvus（引擎），19530 端口对外
建模      ai_diary 集合：VarChar 业务主键 + FloatVector(1024) 向量列 + 标量字段 + Array 标签字段
索引      IVF_FLAT + COSINE + nlist=1024，检索前 loadCollection 加载进内存
入库      5 条日记经 OpenAIEmbeddings 向量化，Promise.all 并行插入，insert_cnt 确认
```

动手前，拿这份清单自检：

- [ ] 能否讲清向量数据库与关系型数据库的分工：精确匹配（CRUD / id / like）vs 语义匹配（向量相似度），以及一条日记为什么两个库都存？
- [ ] 能否说清 Milvus standalone 三个容器各自管什么（etcd 元数据、MinIO 落盘、引擎检索），以及环境变量怎么把它们串起来？
- [ ] 能否解释集合里 `dim` 必须与 embedding 模型输出维度一致，主键为什么用 VarChar 业务 id、tags 为什么用 Array 数组字段？
- [ ] 能否讲出 `IVF_FLAT`、`COSINE`、`nlist` 各自的含义，以及查询前 `loadCollection` 的必要性？
- [ ] 能否说明插入记录 `{ ...diary, vector }` 的结构，以及"先 load 后 insert"为什么也合法？

**这一天的本质，是把"语义检索"这条能力线跑通第一公里**：三容器部署解决"环境从哪来"，集合建模解决"数据长什么样"，索引与加载解决"怎么才能查"，嵌入与插入解决"数据怎么进"。四个问题都答清楚了，一个能跑的本地位移库就立在眼前——后面接查询、接 RAG 对话，都是在这块地基上再加一层。
