# LangSmith RAG 量化评估：从"感觉还行"到"数据说话"

> 第八十五天学习笔记：用 LangSmith + openevals 给 RAG 应用做回归评估。
> 对应代码：本目录 `src/` 下的 `build_dataset.mjs`、`evaluators.mjs`、`run_eval.mjs`、`rag_agent.mjs`。

---

## 一、为什么需要量化评估

RAG 应用跑通之后，最自然的问题是：**它到底好不好？**

没有评估体系时，我们的工作方式是这样的：

1. 手动问几个问题，看回答"感觉还行"
2. 改了 prompt / 换了模型 / 调了 k 值
3. 再手动问几个问题，"感觉好像好了一点？"

这种方式有三个致命问题：

| 问题 | 说明 |
| --- | --- |
| 样本太少 | 手动测 3~5 个问题，代表性极差，改一处可能悄悄搞坏另外 10 个场景 |
| 没有基线 | "感觉变好了"无法复现，过两天自己都忘了上次什么水平 |
| 不可回归 | 每次改动都可能引入退化（regression），没有自动化手段根本发现不了 |

量化评估要做的就是：**把"感觉"变成"分数"，把"手动问几个"变成"固定数据集上自动跑一遍"**。

这就是 LangSmith `evaluate()` 存在的意义——它本质上是 AI 应用领域的"单元测试框架"。

---

## 二、整体流程：四步走

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  ① 建数据集      │ → │  ② 定义评估器    │ → │  ③ 跑实验        │ → │  ④ 看分数迭代    │
│ build_dataset   │   │ evaluators.mjs  │   │ run_eval.mjs    │   │ LangSmith 网页  │
└─────────────────┘   └─────────────────┘   └─────────────────┘   └─────────────────┘
   12 条问答对           3 个 LLM 评委          evaluate()          平均分/逐条对比
   灌入 LangSmith        各管一个指标           批量执行+打分        找到最差样本分析
```

对应到代码里就三个脚本：

```bash
node src/build_dataset.mjs   # 一次性：建数据集（已存在会跳过）
node src/cli.mjs             # 平时：手动问单个问题调试
node src/run_eval.mjs        # 评估：整个数据集批量跑 + 自动打分
```

---

## 三、核心概念：数据集（Dataset / Example）

### 3.1 数据集是什么

LangSmith 里的 Dataset 就是一张表，每行是一个 **Example**，包含：

- `inputs`：喂给你应用的输入，我们这里是 `{ question: "无理由退货要在几天内申请？" }`
- `outputs`：**期望的正确答案（reference answer）**，我们这里是 `{ answer: "自签收之日起 7 天内支持无理由退货。" }`

`build_dataset.mjs` 里灌了 12 条客服问答对，覆盖退货、换货、运费、发票、价保、保修等场景——这就是我们的"考卷"。

### 3.2 为什么期望答案很关键

注意一个容易混淆的点：**跑评估时，应用产生的答案也叫 outputs，和 Example 里的期望 outputs 同名不同物。**

- Example 的 `outputs`：标准答案（人写的，跑之前就固定在数据集里）
- run 的 `outputs`：你的应用实际生成的答案（跑的时候现场产生）

评估器的工作就是**比较这两者**（或分别审视它们）。

### 3.3 踩坑：数据集已存在的判断

```js
// 错误写法：少了 await，readDataset 返回 Promise，永远不进 catch
dataset = client.readDataset({ datasetName: DATASET_NAME })

// 正确写法
dataset = await client.readDataset({ datasetName: DATASET_NAME })
```

**原理**：async 函数里的 Promise 拒绝是异步的。没有 `await`，`try/catch` 同步执行完就走了，Promise 之后拒绝时 catch 早已失效——这会成为 unhandledRejection 而不是走你的降级逻辑。

另外注意 `client.createExamples(...)` 挂在 **Client** 上，不是 `dataset.createExamples`——JS SDK 和 Python SDK 的 API 形状不一样，别照着 Python 教程抄。

---

## 四、核心概念：评估器（Evaluator）与 LLM-as-Judge

### 4.1 什么是 LLM-as-Judge

传统软件测试断言是精确的：`assert result == 42`。但 RAG 的答案是自然语言，"7 天"和"自签收之日起 7 天内"是同一个意思，字符串比对全挂。

解法：**让另一个 LLM 当评委**。给它一段评审标准（提示词）+ 材料，让它打分。

`evaluators.mjs` 里的评委配置：

```js
const judge = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  configuration: { baseURL: process.env.OPENAI_BASE_URL },
  model: process.env.MODEL_NAME ?? "qwen-plus",
  temperature: 0,  // 关键：评委必须确定性输出，同一答案每次打分一致
})
```

`createLLMAsJudge` 把「评审提示词 + 评委模型」包装成一个可调用函数。`continuous: true` 表示输出 0~1 连续分（而不是 0/1 二值），分数粒度更细，能区分"完全幻觉"和"基本忠实但漏了个细节"。

### 4.2 三个指标：恰好对应 RAG 流水线的三个环节

这是本篇最核心的一张图：

```
用户问题 ──→ [检索 retrieve] ──→ 相关文档 ──→ [生成 generate] ──→ 最终答案
                  │                                    │                  │
                  ▼                                    ▼                  ▼
        ③ retrieval_relevance                ① groundedness      ② helpfulness
        问题 vs 文档                          文档 vs 答案          问题 vs 答案
        "捞上来的东西相关吗？"           "答案忠于文档吗？有幻觉吗？"  "答案真的回答了问题吗？"
```

| 评估器 | 看什么材料 | 不看什么 | 检测的失败模式 |
| --- | --- | --- | --- |
| **忠实度 groundedness** | 检索文档 + 生成答案 | 用户问题 | **幻觉**：答案里编了文档没有的内容 |
| **帮助性 helpfulness** | 用户问题 + 生成答案 | 检索文档 | **答非所问**：答了一堆但没回应问题 |
| **检索相关性 retrieval relevance** | 用户问题 + 检索文档 | 生成答案 | **召回失败**：检索环节就捞错了材料 |

### 4.3 为什么"不看什么"和"看什么"一样重要

这是初学者最容易迷糊的地方：**每个评估器都被刻意限制了视野**。

- 忠实度**故意不看问题**。因为"答案是否忠于文档"与"用户问了什么"无关——哪怕答非所问，只要答案内容都能在文档里找到出处，忠实度就该给高分。答非所问是帮助性的事。
- 检索相关性**故意不看答案**。如果检索拉了 4 篇垃圾文档，但模型知识强悍行答对了，生成环节再完美也掩盖不了检索的失败——而这个失败必须被单独量化，否则你都不知道该修哪一环。

**这就是"分环节归因"的思想**：RAG 是流水线，总分低的时候你需要知道是哪一环拖后腿，而不是对着一个模糊的"质量分"干瞪眼。

### 4.4 适配层：喂什么字段给评委

openevals 的评审提示词有固定的输入槽位，所以我们要写一层薄适配：

```js
// 忠实度：只取 outputs 里的 context（检索文档）和 answer
export async function ragGroundnessEvaluator({ outputs }) {
  return ragGroundnessJudge({
    context: { documents: outputs.context },
    outputs: { answer: outputs.answer }
  })
}
```

这里的 `inputs`/`outputs` 来自 `evaluate()` 的调用约定：每条 Example 跑完后，评估器会收到 `{ inputs, outputs, referenceOutputs, run, example }` 等字段，你的适配器从中挑需要的喂给评委。

---

## 五、核心概念：evaluate() 的执行模型

```js
const result = await evaluate(runRagAgent, {
  data: DATASET_NAME,          // 用哪个数据集（考卷）
  evaluators: ragEvaluators,   // 用哪些评委
  client,
  experimentPrefix: `rag-openevals-qwen`,  // 实验名前缀，方便在网页里找
  maxConcurrency: 2            // 并发数，太大容易触发模型限流
})
```

执行流程展开：

```
对数据集里每一条 Example（共 12 条）：
  1. 调用 runRagAgent(example.inputs)
     └─→ 内部走完整 RAG 链路：retrieve → generate
     └─→ 返回 { answer, context }
  2. 把 inputs + 应用 outputs 交给 3 个评估器
     └─→ 每个评估器内部调一次评委 LLM（temperature=0）
     └─→ 得到 3 个 0~1 分数，挂到这条 run 上
  3. 所有 trace 和分数实时上传到 LangSmith

汇总：一次"实验"（experiment）= 12 条 run × 3 个分数 = 36 个评分点
```

**踩坑**：JS SDK 的签名是 `evaluate(target, config)` 两个参数，不是 Python 那种单大对象。`evaluate({ target: ..., data: ... })` 会直接报错。

### target 函数的约定

`runRagAgent` 是个适配器，把数据集的 inputs 形状翻译成我们应用的接口：

```js
async function runRagAgent(inputs) {
  const { answer, context } = await ask(inputs.question)
  return {
    answer,
    context: context.map(d => d.pageContent)  // Document 对象 → 纯文本，评委读得懂
  }
}
```

**注意返回值必须包含 context**：忠实度和检索相关性两个评估器都依赖检索文档。如果你的应用只返回答案，这两个指标就没法评了。这也是为什么 `rag_agent.mjs` 的 `ask()` 要同时返回 answer 和 context。

---

## 六、拿到分数之后：怎么读、怎么迭代

实验跑完后在 LangSmith 网页能看到每条 run 的三个分数和平均分。读法：

### 6.1 先看哪个分低，定位环节

| 低分指标 | 病灶在哪 | 常见处方 |
| --- | --- | --- |
| retrieval_relevance 低 | 检索环节 | 调 k 值、换 embedding 模型、改分块大小、加混合检索/重排 |
| groundedness 低 | 生成环节 | 强化 prompt 约束（"仅根据上下文回答"）、换更听话的模型、降 temperature |
| helpfulness 低（但前两个高） | 答案质量 | 材料是对的但表达差/没直击问题，优化 prompt 的回答风格要求 |

### 6.2 再看具体哪几条样本差

平均分掩盖不了分布。12 条里 11 条满分 1 条 0 分，平均 0.92 看着不错，但那 1 条可能暴露了一个系统性缺陷（比如某类问题的分块恰好把关键句切断了）。**逐条点开最差的 run，看 trace 里检索到了什么、prompt 拼成了什么样、评委的扣分理由**——这是评估体系真正的价值：把"哪里差"变成可观察、可复现的具体证据。

### 6.3 改动后重跑，对比实验

LangSmith 的实验是可以**并排对比**的。改了分块策略？重跑一次，两次实验选一起看分数变化。这就形成了完整的迭代闭环：

```
改东西 → 跑评估 → 对比基线 → 分数升则保留/降则回滚
```

这就是把"感觉变好了"变成"groundedness 从 0.81 升到 0.93"。

### 6.4 LLM-as-Judge 的局限（更深一层）

评委也是 LLM，它自己也会犯错，需要保持清醒：

1. **评委 ≠ 真理**：groundedness 0.9 不代表 10% 幻觉，只代表"评委模型认为有 10% 左右的问题"。换更强的评委模型，分数分布可能整体移动。
2. **分数可比性只在同一配置下成立**：换评委模型、换提示词后，新旧分数不能直接比。所以 `experimentPrefix` 里带上模型名是好习惯。
3. **评委要用够强的模型 + temperature 0**：评委太弱会乱打分；temperature 不为 0 会让同一答案两次打分不同，引入噪声。
4. **成本**：12 条数据 × 3 评估器 = 36 次评委调用 + 12 次 RAG 调用。数据集大了以后评估本身也是一笔 token 开销。

---

## 七、本次踩坑汇总（v2 速查）

| 报错/现象 | 原因 | 修法 |
| --- | --- | --- |
| `langsmith/evaluators` 找不到 | 子路径不存在 | `import { evaluate } from 'langsmith/evaluation'` |
| 数据集 not found | 名字横线/下划线不一致 | `rag_eval_v1` 与 build_dataset 对齐 |
| evaluate 参数报错 | 照抄了 Python 单对象签名 | JS 是 `evaluate(target, config)` 两参 |
| `RAG_HELPFULLNESS_PROMPT` undefined | 拼写，helpfulness 只有一个 L | `RAG_HELPFULNESS_PROMPT` |
| 数据集重复灌了 24 条 | readDataset 没 await，catch 失效 | 补 await，已存在就 return |
| `dataset.createExamples` 不存在 | Python SDK 的写法 | JS 用 `client.createExamples` |
| `const question = question[i]` 炸 | TDZ 自我遮蔽 | 改名 `const q = question[i]` |
| npm ERESOLVE | community 包 peer 依赖冲突 | `--legacy-peer-deps` |

---

## 八、一句话总结

> RAG 量化评估 = **固定考卷（Dataset）+ 分环节评委（Evaluator）+ 批量执行器（evaluate）**。
> 三个指标各司其职：检索相关性管召回、忠实度管幻觉、帮助性管答非所问。
> 分数不是目的，**可复现的归因和回归检测**才是——它让每一次 prompt 调整、每一次检索参数改动，都从"凭感觉"变成"看数据"。
