# v032 博客大纲

**标题**：LLM 的底层语言：从分词到向量化，搞懂 AI 是怎么"读"文字的
**日期**：2026-06-23
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源笔记 |
|------|------|---------|
| 引言 | 回顾 v031（Agent 工程化），引出新问题：我们一直在用 LLM，但它到底是怎么"读懂"文字的？从工程层下沉到基础层 | 综合 |
| 一、先聊算法：递归与分治 | 递归的本质（函数调用自己）、分治策略（分+治+合）、快排作为分治的经典案例、递归在 AI 系统中的影子 | algorithm/recursive/ + algorithm/quick_sort/ |
| 二、快速排序详解 | pivot 基准值、双指针原地交换、partition 函数、O(nlogn) vs O(n²)、不稳定性分析 | algorithm/quick_sort/1.js + readme.md |
| 三、Token：LLM 的最小语言单位 | 为什么 LLM 不能直接读文字（神经网络只认数字）、Token 是什么、中英文 token 比例、计价单位、js-tiktoken 实操（encode/decode） | ai/token/readme.md + demo/index.mjs |
| 四、Embedding：从符号到语义 | Token ID 是离散符号、Embedding 向量化的作用、1024 维向量空间、语义相似度计算、Dashscope API 实操 | ai/token/readme.md + demo/main.mjs |
| 五、完整的文本处理管线 | 文本 → Tokenize → Token IDs → Embedding → 向量 → LLM 处理，串联整条链路 | 综合 |
| 结语 | 算法思维（递归/分治）和 AI 基础（Token/Embedding）的关系——都是"把大问题拆成小问题" | - |
