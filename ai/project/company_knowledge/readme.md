# 企业级知识库项目  多模态 RAG

江西知名的装修公司，企业的AI 落地FDE
全省有300多人的销售团队，要学习装修案例、公司项目守则、客户权益、售后等
更好的为客户服务。为期15天的岗前培训，巨大开销，反复去做这件事

AI时代，知识库非常普遍的内部**基建**项目。

员工日常工作积累的大量业务资料，操作经验、问题解决方案和规范流程。

这些知识资产，零散保存、分散在各处，没有统一归档，电子化、信息化，云端化解决了一部分问题

传统的资料查询效率太低，手动查找文档 或者 关键词检索有局限，遇到问题只能反复问人、反复试错

搭建AI 能力的知识库，支持语义检索、AI一键问答，看懂需求就能匹配对应资料，直接给出解决方案。

极大的缩短查询和答疑时间，彻底解决传统资料繁琐低效问题，全方位提升工作效率

搭建统一的企业知识库，是非常有必要的基础建设

需求不太清晰？产品思维

## 产品原型图 prd
产品原型图是产品的简易可视化模型，用线条、模块展示页面布局、功能与交互逻辑。它提前验证想法，方便团队沟通，及早发现设计缺陷，减少后期开发返工成本。

- Figma
  mcp
  产品原型图 -> 转成前端页面
- 蓝湖
- 墨刀

产品经理职责
图一
1. 企业共享的知识库后台管理系统
2. 登录页
3. 顶部七个导航直达文档、问答、知识图谱

图二
这是首页大盘，用可视化一眼看懂全局。折线图盯访问趋势、环形图看文档分类占比，配上五大指标涨跌箭头
底部操作记录最终谁干了啥，管理员不用翻数据，开会张口就有数据

核心是文档、AI 问答、知识图谱这些
文档会做权限管理，只有有权限的文档可以检索出来用来生成回答

图三
这是文档管理核心模块，左侧按我的、公共、部门、归档分类，右侧列表可搜索、批量上传、新建文件夹、每行标注类型、
上传人、解析状态、权限范围，提供了列表和卡片式两种显示

图四
这是智能搜索页面，输入关键词，非常快的速度智能检索出搜索结果，关键词高亮显示 按相关度排序，每条标出来源、更新时间和可见权限，只让搜到有权限的文档，又快又安全

图五
这是AI 问答页，左侧存着历史会话，随时回顾；右侧直接提问，AI 从库里找出答案流式输出并附带文档引用。
提供 你可能想要问的 主动引导，答得快、有出处还能最问

图六
知识图谱

## 攻克的难点
- 知识图谱
  图状数据库
  es/milvus 语义/关键词 检索  query -> 单条document 匹配，有些不足
  GraphRAG

## 功能模块

### 知识库核心功能
文档管理 + 问答助手 + 知识图谱

1. 文本类文件
   支持格式 PDF、DOCX、DOC、XLSX、XLS、PPTX、PPT、TXT、MD、CSV、JSON
   langchain/community/document_loaders 支持以上格式
   支持输入网页URL，系统自动抓取页面正文并导入知识库归档检索
2. 图片文件(JPG、PNG等)
   上传后通过视觉嵌入模型提取图片特征，同时调用大模型 OCR/图片理解生成图片描述文本
   文字搜图片 以图搜图
3. 音频文件(MP3、WAV、M4A等)
   上传自动执行 ASR (Automatic Speech Recognition) 语音转文字，
   将完整转录文本归档，依托文本内容参与检索
4. 视频文件
   用视频理解模型做全维度内容解析，同步提取音频文字与画面视觉信息，整合成完整文本内容用于检索，
   并输出多模态向量，实现图文视频跨模态检索

#### 权限管理
部门、权限等 在检索前筛选  psql 实现

### 问答助手
- 混合Elasticsearch 全文检索、Milvus 向量语义检索、知识图谱
- 流式输出以及源文件引用
- 主动引导用户追问
- 语音输入

## 简历中的表述

项目描述：

企业内部知识库碎片化严重，跨部门资料无统一归集渠道，传统文档检索效率低下。
为盘活企业各类知识资产，集中管理高效复用，因此主导开发了企业级知识库管理平台。
包括文档管理、AI 问答、全文检索、知识图谱、用户权限控制、数据统计等功能。

技术栈：
LangChain, LangGraph, DeepAgents, Vercel AI SDK, Nest, Redis, PostgreSQL,
Elasticsearch, Neo4j, MinIO, Docker Compose, Mem0, LangSmith, LangFuse

项目亮点：
1. 向量 + 关键词(PGVetor + Elasticsearch) 实现混合检索，用Reranker 模型重排，实现多路召回，
   提高检索准确率
2. 利用Neo4j 构建知识图谱，通过LLM 抽取文档实体，关系自动存入数据库。用户问题会利用LLM 抽取实体，
   执行多跳检索，把推理链路和RAG 的结果融合送入Prompt 上下文，提升复杂业务问题回答的完整性与逻辑性
3. 支持PDF、Word、TxT 等图文格式文档，支持图片，音频等多模态文件，统一解析成Markdown 文档，
   会自动提取文档中的图片上传到Minio，并替换文档中的图片为url，图片基于OCR 实现解析、音频基于ASR、
   视频基于分片 + 视频理解模型解析成文档
4. Redis 实现短期记忆存储，Mem0 实现长期记忆分层存储，包括用户级，会话级记忆
5. 搭建分层权限管理体系，落地页面、菜单、按钮三级细粒度权限拦截
   同时联动检索逻辑做数据权限隔离，依旧当前用户角色过滤文档池，不同人员仅查询自身权限范围内的知识资料，
   实现功能权限与数据权限双重隔离，满足多部门资料的分级保密需求
6. 基于LangGraph 实现Agentic RAG 架构，Agent 自动判别问题复杂度，动态决策调用混合检索、图谱推理等工具，
   灵活适配多维度复杂业务提问，规避固定检索流程带来的回答局限性。
7. 基于ASR + 流式TTS 实现语音交互，SSE 实现文字流式输出，WebSocket + 流式TTS 实现同步流式播放
8. 本地开发用LangSmith 调试，线上用LangFuse 搜索数据，实现全链路观测，记录检索耗时，LLM 调用成本、
   回答召回来源、模型报错日志等。搭建RAG和Agent 效果量化评估机制，自动跑实验了评估检索效果。

比较能打的Agent 项目

Vercel AI SDK, MinIO, Mem0, LangFuse, Memory, PostgreSQL 关系型数据库建表 分层,
GraphRAG, WebSocket, ASR, TTS, RFF 融合

## 数据库设计

项目会涉及到一些数据库(PSQL)、中间件(es, redis, neo4j 图数据库....)，用于存储数据

PSQL 带PGVector 扩展
存储结构化业务数据 + 文档分片向量

### User 表
1. 登录，身份注册
   username  unique
2. 权限管理
3. 日常管理
status 0 禁用 1 启用
delete false true
id,
role,
username,
password,

CREATE TABLE IF NOT EXISTS kh_user {
   id BIGINT PRIMARY KEY,  -- 用户ID(雪花算法)
   username VARCHAR(50) NOT NULL,  -- 登录用户名
   password VARCHAR(255) NOT NULL,  -- 密码(bcrypt 哈希加密)
   email VARCHAR(100),  -- 邮箱(可选)
   email_verified SMALLINT NOT NULL DEFAULT 1,  -- 邮箱是否验证 0 未验证 1 已验证
   real_name VARCHAR(50),  -- 真实姓名(可选)
   avatar VARCHAR(500),  -- 头像URL(可选)
   status SMALLINT NOT NULL DEFAULT 1,  -- 状态 0 禁用 1 启用
   last_login_at TIMESTAMP,  -- 最后登录时间
   created_at TIMESTAMP NOT NULL DEFAULT NOW(),  -- 创建时间
   updated_at TIMESTAMP NOT NULL DEFAULT NOW(),  -- 更新时间
   deleted BOOLEAN NOT NULL DEFAULT false,  -- 是否删除 软删除标记
}

CREATE UNIQUE INDEX IF NOT EXISTS uk_kh_user_username ON kh_user (username)
WHERE deleted = false;

INT 4字节 最大值约21亿
BIGINT 8字节 最大值约922亿

### Role 表
用户、角色、权限RBAC 数据(Role Based Access Control) 基于角色的访问控制

// 角色表
CREATE TABLE IF NOT EXISTS kh_role {
   id BIGINT PRIMARY KEY,
   role_name VARCHAR(50) NOT NULL,
   role_code VARCHAR(50) NOT NULL UNIQUE, // 角色编码(唯一)
   description VARCHAR(200)
   status SMALLINT NOT NULL DEFAULT 1,  -- 状态 0 禁用 1 启用
}

// 用户角色关联表
CREATE TABLE IF NOT EXISTS kh_user_role {
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES kh_user (id), // 用户ID
  role_id BIGINT NOT NULL REFERENCES kh_role (id), // 角色ID
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role_id) // 用户角色组合唯一
}

// 用户角色关联表 索引
CREATE INDEX IF NOT EXISTS idx_kh_user_role_user_id ON kh_user_role (user_id)
WHERE deleted = false;