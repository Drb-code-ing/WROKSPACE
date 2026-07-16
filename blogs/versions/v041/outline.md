# v041 大纲

## 标题
从网页到可检索知识：RAG 文档处理、切分策略与生产工程实践

## 主题
第三十七天学习 RAG 文本处理——基于网页 Loader、Cheerio CSS Selector 与 `RecursiveCharacterTextSplitter` 实践，梳理从原始文件/URL 到可入向量库 chunk 的完整写时链路；重点讨论文档抽取、清洗、递归切分、分隔符优先级、chunk overlap、网页风控与动态渲染，以及生产级数据治理。

## 与 V040 的边界
- **V040**：读时链路，重点是向量检索、Retriever、相似度、metadata 过滤、上下文组装和生成。
- **V041**：写时链路，重点是 Loader、Document 标准化、正文抽取、清洗、文本切分、chunk 质量、增量入库与权限治理。
- 不重复讲检索器、向量库选型与生成链路；仅在说明“切分质量影响检索上限”时建立必要联系。

## 核心线索
原始资料不是天然知识；Document 不是天然可检索单元。只有经过正确抽取、质量校验、清洗、语义切分、overlap 补偿并继承 metadata 的 chunk，才是 RAG 可用的知识资产。

## 章节结构
1. **引言**：从 V040 的检索与生成回到更上游的文档加工
2. **一、RAG 的隐形上游**：写时链路与常见数据质量失败点
3. **二、Document**：`pageContent + metadata` 的统一契约与职责边界
4. **三、Loader**：网页/文件加载不是读文件，而是内容抽取策略
5. **四、网页抓取的工程真相**：HTTP 200、WAF、动态渲染与抽取校验
6. **五、为什么要切块**：向量检索的最小语义单位与 chunkSize 权衡
7. **六、RecursiveCharacterTextSplitter**：递归原理、separators 优先级、结构感知切分
8. **七、chunkOverlap**：边界上下文保险、适用范围与成本
9. **八、生产文档处理管道**：校验、清洗、观测、幂等更新、权限治理
10. **九、如何评估切分质量**：结构、检索、生成与成本指标
11. **十、面试高频问题**：切块、递归、overlap、Loader 失败、数据治理
12. **结语**：检索系统的质量从知识块生产时就已经决定

## 核心来源
- `ai/agent/agent_in_action/rag_splitter/src/index.mjs`：CheerioWebBaseLoader、网页 Document、RecursiveCharacterTextSplitter、中文 separators、chunkSize 与 chunkOverlap。
- `ai/agent/agent_in_action/rag_splitter/src/crawl.mjs`：Axios + Cheerio 手写抓取、HTML 到 DOM-like 结构、CSS Selector 正文抽取。
- `ai/agent/agent_in_action/rag_splitter/readme.md`：Document、Loader、多数据源、切分意义、overlap 学习笔记。

## 面试要点
- 为什么文档切分决定 RAG 检索上限
- Document 的 pageContent / metadata 职责划分
- Loader 为什么是内容抽取策略而不只是读取文件
- 静态抓取和浏览器渲染的边界
- HTTP 200 为什么不能证明抓到正文
- RecursiveCharacterTextSplitter 的递归过程与 separators 优先级
- chunkSize / chunkOverlap 的权衡及调参方法
- 中文、代码、Markdown、表格的不同切分策略
- 文档入库阶段的空文本、去噪、可观测、幂等、权限治理

## 情感线
从“网页请求成功就算抓到数据、文本切成固定长度就能做 RAG”，升级到“知识入库是数据工程：每个 chunk 都要有语义边界、来源、质量门槛和可治理能力”。
