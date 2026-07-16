# 从网页到可检索知识：RAG 文档处理、切分策略与生产工程实践

## 引言

上一篇 v040 讨论的是 RAG 的**检索与生成**：向量库如何查、Retriever 和直接查向量有什么区别、相似度分数怎样变成工程决策、metadata 如何服务过滤和溯源。

这一篇不重复这些内容。我们把镜头往前推，回到 RAG 更容易被忽略、却更决定上限的阶段：**文档进入向量库之前，到底经历了什么？**

如果把 RAG 看成一条生产线，v040 讨论的是“用户提问之后，系统如何找资料并回答”；本篇讨论的是“资料在入库之前，怎样被加工成真正可检索的知识单元”。

第三十七天的代码实践非常小：一个 URL、一个 Loader、一个 CSS Selector、一个 `RecursiveCharacterTextSplitter`。但里面包含了生产 RAG 最关键的一条原则：

> **Embedding 不理解文件，检索也不理解整篇文章；它们只理解被正确抽取、清洗、切分并附带上下文的文本块。**

本文围绕这条知识入库链路展开：文档标准化、网页加载、反爬与动态页面、递归切分器、分隔符优先级、`chunkSize` / `chunkOverlap` 的工程权衡，以及如何把一个教学 Demo 推进到可上线的文档处理管道。

---

## 一、RAG 的隐形上游：从“原始文件”到“知识块”

常见 RAG 图里，人们习惯从 Embedding 开始画：

```text
文本 → 向量 → 向量数据库 → 检索 → 大模型回答
```

但真实系统中，向量化之前还有更长的一段：

```text
文件 / URL / 数据库记录 / 视频字幕
        ↓
Loader：读取并抽取原始内容
        ↓
Document：统一为 pageContent + metadata
        ↓
清洗：去导航、广告、脚本、重复页眉页脚
        ↓
Splitter：把长文切成有边界、有上下文的 chunk
        ↓
Chunk Document[]：可进入 Embedding 与向量库
```

这里的每一步都可能让后续检索质量失真。

| 环节 | 失败表现 | 对后续 RAG 的影响 |
|---|---|---|
| Loader 选错 | PDF 乱码、网页正文为空 | 根本没有可用知识 |
| 选择器过宽 | 导航、推荐、评论混入正文 | 向量语义被噪声污染 |
| 选择器过窄 | 漏掉标题、列表、代码 | 回答缺乏关键信息 |
| 清洗不足 | 重复页脚、免责声明大量入库 | 检索结果重复、浪费 token |
| 切块过大 | 一个 chunk 混合多个主题 | 召回不精准 |
| 切块过小 | 指代、因果、条件被截断 | 模型拿到碎片，无法回答 |
| 无 overlap | 信息恰好跨边界 | 检索到一半上下文 |

因此，RAG 的质量上限不只由 Embedding 模型决定，更早地由**语料加工质量**决定。

### 1.1 写时链路与读时链路

可以把完整系统分成两条链：

```text
写时（Ingestion）
原始资料 → Loader → Document → 清洗 → 切块 → Embedding → 索引

读时（Retrieval & Generation）
用户问题 → Query Embedding → 检索 / 重排 → Context → LLM 回答
```

v040 主要落在读时链路。本篇关注写时链路中最前面的三项：**Loader、Document、Splitter**。

工程上有个很重要的认知：

> 读时链路问题可以通过阈值、重排、Prompt 做缓解；写时链路把正文抽错、切错，读时再聪明也没有干净可靠的知识可以检索。

---

## 二、Document：不同数据源进入 RAG 的统一契约

无论知识来自 Word、PDF、网页、Notion、数据库还是视频字幕，最终都应该转成统一的数据结构：`Document`。

LangChain 的核心形态可简化为：

```javascript
new Document({
  pageContent: '真正参与切分、向量化和检索的文本',
  metadata: {
    source: '来源标识',
    // 其他描述信息
  },
})
```

在 [rag_splitter 的学习笔记](file:///e:/WROKSPACE/ai/agent/agent_in_action/rag_splitter/readme.md#L1-L17) 中，这个思想被概括为：不同格式的知识文件需要不同 Loader，但输出要统一为 `Document`。

### 2.1 为什么不能直接把“一个文件”当作一个向量？

假设上传了一份 100 页产品手册。

```text
一个 PDF → 一个 Document → 一个向量
```

这在技术上能运行，但检索几乎没有意义：用户问“退款规则是什么”，这个向量同时代表安装、登录、支付、售后、权限等所有主题。它只能表达“这是一份产品手册”，而无法精确表达“其中退款章节与问题最相关”。

因此，`Document` 是标准输入，但还不是最终索引单位；它要继续变成多个 chunk Document。

### 2.2 `pageContent` 和 `metadata` 的职责边界

```javascript
{
  pageContent: '退款申请需在订单完成后七天内提交……',
  metadata: {
    source: 'help/refund-policy.pdf',
    page: 12,
    section: '退款规则',
    updatedAt: '2026-07-01'
  }
}
```

- `pageContent`：正文语义，进入切分与 Embedding；
- `metadata`：来源、位置、权限、时间、标题等结构化描述，通常不进入 Embedding，却会贯穿过滤、溯源、展示、增量更新与权限控制。

注意：切分器应让每个子块**继承父文档 metadata**。否则检索到了一个 chunk，却不知道它来自哪一页、哪个业务文档，就无法展示引用、排错或做权限校验。

---

## 三、Loader：不是“读文件”，而是内容抽取策略

在 [index.mjs](file:///e:/WROKSPACE/ai/agent/agent_in_action/rag_splitter/src/index.mjs#L14-L28) 中，网页内容由 `CheerioWebBaseLoader` 加载：

```javascript
const cheerioLoader = new CheerioWebBaseLoader(
  'https://juejin.cn/post/7662627075258449946',
  {
    selector: '.main-area p',
  }
)

const documents = await cheerioLoader.load()
```

这段代码不是“把网页下载下来”这么简单，而是在做三件事：

```text
发送 HTTP 请求
  ↓
得到 HTML 字符串
  ↓
用 CSS Selector 提取正文区域
  ↓
包装为 Document[]
```

### 3.1 Loader 的选择应该由数据形态决定

没有万能 Loader，只有对数据形态合适的 Loader。

| 数据源 | 典型 Loader / 技术 | 额外关注点 |
|---|---|---|
| HTML 静态网页 | Cheerio、HTML Loader | CSS Selector、正文去噪 |
| JavaScript 渲染网页 | Playwright、Puppeteer | 等待页面稳定、浏览器资源 |
| PDF | PDF Parser / OCR | 页码、双栏排版、扫描件乱码 |
| Word / PPT | Office Parser | 标题层级、表格、图片说明 |
| Markdown | Markdown Loader | 标题层级、代码块边界 |
| CSV / 数据库 | 自定义 Loader | 一行一条还是按业务实体聚合 |
| 视频 / 音频 | ASR 转录 Loader | 时间戳、说话人、章节切分 |

工程上不要先问“LangChain 有什么 Loader”，而应先问：

1. 内容是静态 HTML 还是浏览器渲染后的 DOM？
2. 文档有没有天然结构，例如标题、页码、章节、表格？
3. 是否需要保留权限、更新时间、作者、来源 URL？
4. 失败时怎样重试、怎样知道抽取结果是否为空？

### 3.2 CSS Selector 是知识质量的第一道过滤器

当前代码使用：

```javascript
selector: '.main-area p'
```

它的优点是直观：只保留文章区域中的段落，尽量排除导航、侧边栏与推荐内容。

但它也有明显边界：

- `p` 可能不包含标题、列表、代码块、表格；
- 页面改版后 class 变化，选择器会静默失效；
- 同一个页面结构里可能含有“相关阅读”或评论；
- 正文并非总在初始 HTML 中，可能需要执行前端 JavaScript。

所以生产中，Selector 不应该只被当成一个字符串配置，而应被视作**可测试的数据抽取规则**。

一个最小的质量门槛应包含：

```javascript
const documents = await loader.load()
const textLength = documents.reduce((sum, doc) => sum + doc.pageContent.length, 0)

if (documents.length === 0 || textLength < 200) {
  throw new Error('文档抽取结果异常：数量或正文长度不符合预期')
}
```

“没有抛异常”不等于“抽取成功”。一个 `pageContent: ''` 的 Document 也可能正常返回，但它进入向量库后只会制造隐蔽的数据质量问题。

---

## 四、网页抓取的工程真相：HTTP 200 不等于拿到了正文

本次实践里最有价值的排障经验，是同一个掘金 URL 出现了“请求成功、HTML 能打印、正文却为空”的现象。

手写实现位于 [crawl.mjs](file:///e:/WROKSPACE/ai/agent/agent_in_action/rag_splitter/src/crawl.mjs#L11-L29)：

```javascript
const { data: html } = await axios.get(targetUrl)
const $ = cheerio.load(html)
const pageContent = $('.main-area p').text()
console.log(pageContent)
```

表面看，`axios.get()` 没有报错，`html` 也确实存在；但 `$('.main-area p').text()` 仍可能返回空字符串。

原因是服务端可能返回的不是文章 HTML，而是风控验证页：

```text
HTTP 200
  ≠ 业务成功
  ≠ 得到文章正文
```

### 4.1 Axios + Cheerio 能做什么，不能做什么

```text
Axios：发送请求，获得响应字符串
Cheerio：把 HTML 字符串解析为 DOM-like 树，支持 CSS Selector 查询
```

它们**不会**：

- 执行页面 `<script>`；
- 具备真实浏览器的 `navigator`、Canvas、插件、指纹环境；
- 自动完成 WAF 的 JavaScript Challenge；
- 等待 React / Vue 客户端渲染正文；
- 自动维护复杂登录态与人机校验。

因此：

```javascript
cheerio.load(html)
```

不是“在命令行运行网页”，而是“在 Node 进程内解析已有 HTML 字符串”。它构造的是可查询的 DOM-like 结构，不会运行 HTML 中的 JS。

### 4.2 为什么同一 URL 有时又能成功？

风控通常不是一个稳定的二元开关。IP、请求频率、Cookie、请求头、网络出口、验证状态、服务端策略都可能影响本次响应内容。

所以正确的工程策略不是“多试几次”，而是：

```text
抽取后校验 → 识别验证页 / 空正文 → 记录失败原因 → 重试或切换合规方案
```

例如：

```javascript
if (html.includes('waf-jschallenge') || html.includes('Please wait...')) {
  throw new Error('目标站点返回验证页，未获得文章正文')
}

const $ = cheerio.load(html)
const nodes = $('.main-area p')

if (nodes.length === 0) {
  throw new Error('正文选择器未匹配：可能是页面结构变化、动态渲染或访问受限')
}
```

### 4.3 生产环境的合规选型

| 场景 | 推荐方案 |
|---|---|
| 平台提供公开 API | 优先使用官方 API |
| 自有网站 / 有授权站点 | 静态抓取 + Selector + 抽取监控 |
| 必须处理动态渲染且获得授权 | Playwright / 浏览器自动化 |
| 企业内部知识库 | 直接接 SDK、数据库或导出文件，不抓网页 |
| 大规模采集 | 遵守 robots、服务条款、限流和授权协议 |

浏览器自动化能解决“页面需要执行 JS 才有正文”的技术问题，但不等于可以绕过访问限制。工程方案必须同时满足稳定性、成本和合规性。

---

## 五、为什么要切块：向量检索的最小语义单位

Loader 的输出通常仍然是一个较大的 Document。接下来要做的是切分。

当前代码中的初始化：

```javascript
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 400,
  separators: ['。', '！', '？'],
  chunkOverlap: 80,
})
```

目标不是机械地“每 400 个字切一刀”，而是把长文本转为**大小可控、主题相对完整、可独立检索**的 chunk。

### 5.1 为什么整篇文档不适合直接 Embedding？

一篇文章可能同时讲：安装、配置、鉴权、异常排查、性能优化。若整篇只生成一个向量，用户问“鉴权失败怎么办”，检索只能知道这篇文章“整体和鉴权相关”，却无法精确把鉴权段落送给模型。

切块后的理想状态：

```text
原始文章
 ├─ Chunk 1：安装与环境要求
 ├─ Chunk 2：API Key 配置
 ├─ Chunk 3：鉴权失败排查
 └─ Chunk 4：性能优化建议
```

查询“鉴权失败怎么办”时，Chunk 3 的语义向量更容易被召回。

### 5.2 Chunk 不是越小越好，也不是越大越好

| Chunk 策略 | 优点 | 问题 |
|---|---|---|
| 很大 | 上下文完整、块数少 | 多主题混杂，召回粗糙，Prompt 浪费 |
| 很小 | 命中精确、检索粒度细 | 指代断裂，缺主谓宾，索引量增大 |
| 适中且有语义边界 | 精度与上下文平衡 | 需要按领域调参 |

`chunkSize: 400` 是字符计数意义上的起点，不是通用答案。技术文档、法律条款、客服知识库、代码库的最佳大小会不同；模型 Tokenizer 也会让“字符数”和“token 数”不是一一对应。

实践上应先定义评测问题集，再比较不同参数下的：

```text
Hit Rate / Recall@k / MRR / NDCG
回答正确率
上下文 token 成本
索引体积与构建耗时
```

---

## 六、RecursiveCharacterTextSplitter 为什么叫“递归”

`RecursiveCharacterTextSplitter` 不是“固定每 N 个字符切一次”的工具。它会根据 `separators` 的优先级，从大语义边界到小语义边界，逐层尝试切分超长文本。

假设配置：

```javascript
separators: ['\n\n', '\n', '。', '！', '？', '；', '，', '']
```

其思路可理解为：

```text
先尝试按段落（\n\n）切
  ↓ 某个块仍然超长
再对这个超长块按换行（\n）切
  ↓ 仍超长
再按句号、感叹号、问号切
  ↓ 仍超长
再按分号、逗号切
  ↓ 仍超长
最后按单字符切，保证不会无限超出 chunkSize
```

这就是“递归”：不是重新处理整篇文章，而是只对**仍然过大的子块**，继续尝试下一层更细粒度的分隔符。

### 6.1 `separators` 数组顺序就是优先级

代码中的：

```javascript
separators: ['。', '！', '？']
```

意思是：

```text
优先按 `。` 切
不够时才尝试 `！`
还不够才尝试 `？`
```

因此顺序不是随便写的，它表达了你对文本结构的偏好。对于一般中文 prose，段落和换行通常比句号更重要；句号通常又比逗号更重要。

推荐的中文起始配置：

```javascript
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 400,
  chunkOverlap: 80,
  separators: ['\n\n', '\n', '。', '！', '？', '；', '，', ''],
})
```

最后的 `''` 是兜底：如果文本是超长 URL、日志、压缩内容或没有任何标点的连续字符串，仍然必须能切开。

如果没有它，某个完全不含 `。！？` 的超长块可能仍超过 `chunkSize`，让“大小控制”失效。

### 6.2 对不同内容类型，分隔符应不同

| 内容 | 更合适的结构边界 |
|---|---|
| 中文文章 | `\n\n`、`\n`、`。！？；，` |
| 英文文章 | `\n\n`、`\n`、`. `、`? `、`! `、空格 |
| Markdown | 标题、空行、列表、代码块边界 |
| 源代码 | 文件、类、函数、方法、语句块 |
| 表格 | 表格行 / 业务实体，而不是字符数 |
| 对话记录 | 会话轮次、说话人、时间窗口 |

因此，通用字符切分器是可靠的起点，但不是所有文档的终点。对代码、Markdown、PDF 标题层级等结构明显的数据，优先使用结构感知的 splitter 往往更好。

---

## 七、chunkOverlap：边界损失的“上下文保险”，不是万能药

切分时，即使优先选择自然语义边界，也可能因为 `chunkSize` 限制而必须把相关信息拆开。

例如：

```text
Chunk 1：东东起初不会踢球，光光每天放学后教他控球、传球和射门。
Chunk 2：在比赛关键时刻，东东传出漂亮一球，光光射门得分。
```

如果用户问“东东为什么后来能帮助光光赢球”，而检索器只召回 Chunk 2，模型可能看不到此前练习的原因链。

`chunkOverlap: 80` 的意义是让新块带上前一块末尾的一段文本：

```text
Chunk 2：……光光每天放学后教他控球、传球和射门。
        在比赛关键时刻，东东传出漂亮一球……
```

它用数据冗余换取边界附近的语义连续性。

### 7.1 overlap 解决什么，不解决什么

| 能缓解 | 不能根治 |
|---|---|
| 指代跨 chunk，例如“他”“这一步” | 原始网页抽错、正文为空 |
| 因果关系恰在边界断开 | 一个 chunk 内混入多个完全不同主题 |
| 定义与示例被切到相邻块 | 不合理的 Selector 和噪声内容 |
| 标题与首段分开 | 检索器本身召回失败 |

所以正确顺序是：

```text
先改善抽取质量
  ↓
再选择语义分隔符
  ↓
再设定适当 chunkSize
  ↓
最后用 overlap 缓解不可避免的边界损失
```

不能把 overlap 当成“先硬切、后补救”的唯一方案。

### 7.2 overlap 的成本

Overlap 并非越大越好。

```text
overlap 过小：边界信息仍丢失
overlap 过大：相邻 chunk 过度重复
             → 向量库容量增加
             → Embedding 成本增加
             → top_k 结果可能高度相似
             → 上下文窗口被重复内容占满
```

经验起点可以是 `chunkSize` 的 10%～20%。当前：

```text
chunkSize = 400
chunkOverlap = 80
```

即 20%，作为中文文章 Demo 是合理起点。但最终要用真实问题集验证，而不是背一个固定数字。

---

## 八、把 Demo 补成生产文档处理管道

教学代码当前停在：

```javascript
const documents = await cheerioLoader.load()
const textSplitter = new RecursiveCharacterTextSplitter({ ... })
console.log(textSplitter)
```

真正入库时，应至少继续完成：

```javascript
const chunks = await textSplitter.splitDocuments(documents)
```

`splitDocuments()` 的价值在于：拆分 `pageContent` 的同时，保留每个原始 Document 的 metadata。

一个更接近生产的框架如下：

```javascript
async function ingestUrl(url) {
  // 1. 加载与正文抽取
  const loader = new CheerioWebBaseLoader(url, {
    selector: 'article, .main-area',
  })
  const documents = await loader.load()

  // 2. 质量校验：不能把空文档直接写入向量库
  const validDocuments = documents.filter(doc => doc.pageContent.trim().length >= 200)
  if (validDocuments.length === 0) {
    throw new Error(`未提取到有效正文：${url}`)
  }

  // 3. 清洗：实际项目应按站点规则去除噪声
  const cleanedDocuments = validDocuments.map(doc => ({
    ...doc,
    pageContent: normalizeText(doc.pageContent),
    metadata: {
      ...doc.metadata,
      source: url,
      ingestedAt: new Date().toISOString(),
      pipelineVersion: 'v1',
    },
  }))

  // 4. 切分并继承 metadata
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 400,
    chunkOverlap: 80,
    separators: ['\n\n', '\n', '。', '！', '？', '；', '，', ''],
  })

  const chunks = await splitter.splitDocuments(cleanedDocuments)

  // 5. 质量指标：写入日志 / 监控系统
  return {
    chunks,
    metrics: {
      sourceDocuments: documents.length,
      validDocuments: validDocuments.length,
      chunkCount: chunks.length,
      averageChunkLength: Math.round(
        chunks.reduce((sum, chunk) => sum + chunk.pageContent.length, 0) / chunks.length
      ),
    },
  }
}
```

这里的关键不是复制代码，而是建立几个生产意识。

### 8.1 抽取质量校验

- 正文是否为空；
- 正文长度是否明显异常；
- 是否包含验证页、登录页、错误页特征；
- 标题、来源、页码等 metadata 是否存在；
- 同一 URL 重复抓取时内容 hash 是否变化。

### 8.2 可观测性

至少记录：

```text
source_url
loader_type
selector
raw_html_length
extracted_text_length
chunk_count
average_chunk_length
empty_chunk_count
failed_reason
pipeline_version
```

没有这些指标，线上“问不到知识”时，你无法区分是抓取失败、切分异常、向量化失败还是检索没召回。

### 8.3 幂等与增量更新

生产入库任务不能每次都把全部文档重新向量化。

常见做法：

```text
源文件内容 → 计算 content hash
hash 未变化 → 跳过
hash 变化 → 删除旧 chunk / 写入新 chunk
记录 documentId、chunkIndex、ingestionVersion
```

这样可以避免重复向量、降低 Embedding 成本，并让引用可追溯。

### 8.4 权限必须在入库阶段设计

企业知识库中，文档不是所有人都能看。不要等回答生成后才想起权限。

建议每个 chunk 写入：

```javascript
metadata: {
  tenantId: 'tenant-a',
  departmentId: 'finance',
  acl: ['role:finance', 'user:10086'],
  source: 'internal/financial-report.pdf',
}
```

后续检索必须带权限过滤条件。否则 RAG 会变成非常危险的数据泄露通道。

---

## 九、文档切分如何评估：不要只看“切出来了”

一个切分器能返回 chunk，不等于切分质量好。评价应至少覆盖三个维度。

### 9.1 结构质量

- chunk 是否大量为空、过短或超长；
- 标题是否和紧随其后的正文分离；
- 代码块、表格、列表是否被截断；
- 相邻 chunk 的重叠是否符合预期；
- metadata 是否完整继承。

### 9.2 检索质量

准备一批真实问题，检查正确答案所在 chunk 是否进入 top_k。

```text
问题：“如何配置 API Key？”
期望：包含配置步骤的 chunk 被召回
不期望：安装介绍、性能调优、无关 FAQ 占据 top_k
```

这比只打印 chunk 文本更接近业务结果。

### 9.3 生成质量与成本

切分最终服务的是生成：

- 模型回答是否有据可依；
- 引用是否指向正确来源；
- 上下文是否因重复 chunk 太长；
- 文本块数量是否让 Embedding 和索引成本失控。

> 最佳 chunk 参数不是“看起来最整齐”的参数，而是在你的问题集上取得检索质量、生成准确性和成本平衡的参数。

---

## 十、面试高频问题与答题框架

### 10.1 为什么 RAG 要先切块？

**回答框架：**

> 长文档通常包含多个主题，直接生成一个向量会让语义表示过于平均，查询很难精确命中答案位置。切块把文档转成粒度更合适的语义单元，提升召回精度；同时需要保留来源和页码等 metadata，保证后续引用与权限控制。切块不是越小越好，过小会破坏上下文，所以要结合语义边界和 overlap 做平衡。

### 10.2 `RecursiveCharacterTextSplitter` 为什么叫递归？

**回答框架：**

> 它按 `separators` 从左到右的优先级切分，先用段落、换行等大语义边界；如果某个子块仍超过 `chunkSize`，再对这个子块尝试更细的句号、逗号甚至单字符边界。递归的对象是超长子块，目的是尽可能保留自然语义边界，同时保证块大小受控。

### 10.3 `chunkOverlap` 是什么？设多少合适？

**回答框架：**

> overlap 是相邻 chunk 的重复上下文，用来缓解定义、指代、因果关系恰好跨边界时的信息缺失。它不是替代语义切分的手段；应先设计好 separators，再用 overlap 做边界保险。常见起点是 chunkSize 的 10% 到 20%，最终通过真实问题集、召回率、上下文成本验证。

### 10.4 网页 Loader 返回了 Document，为什么还可能失败？

**回答框架：**

> Loader 返回对象只说明调用流程没抛异常，不代表正文有效。可能拿到的是 WAF 验证页、登录页、动态页面壳或者选择器匹配为空。生产中要校验 `pageContent` 长度、选择器匹配数量、页面特征和抽取指标；对于动态页面或有授权场景，使用浏览器渲染或官方 API。

### 10.5 文档处理阶段最容易被忽略的生产问题是什么？

**回答框架：**

> 不是“能否加载”，而是数据质量与可治理性：空文本、噪声、重复入库、文档更新、metadata 继承、权限标签、失败重试和可观测性。检索质量问题很多时候根源不在向量模型，而在入库语料已经错了。

---

## 结语

RAG 不应该从“把文本转向量”开始理解，而应该从“这份资料怎样变成可信、可检索、可治理的知识块”开始理解。

第三十七天的 Loader 与 Splitter 代码看似简单，但它建立了一个关键工程视角：

```text
原始网页 / 文件
  ↓ 不是天然知识
正确抽取
  ↓ 不是天然可检索
语义切分 + overlap + metadata 继承
  ↓ 才成为可被 Embedding 和 Retriever 使用的知识块
```

v040 讨论“如何找到正确 chunk”；本篇讨论“如何生产正确 chunk”。

前者决定系统如何回答，后者决定系统到底有什么资格回答。
