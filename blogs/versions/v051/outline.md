# v051 大纲

## 标题
Benchmark 不是排行榜：用标准题给大模型打分的体系、多维能力与选型门槛

## 主题
第四十四天学习提交 `9f54576`（第四十四天学习 benchmark）里的 `ai/agent/concepts/benchmark/readme.md`。讲清什么是 LLM Benchmark、常见测试集各自考什么能力、厂商如何挑选分数宣传，以及工程师应如何把 benchmark 当门槛而不是唯一排名。

## 与相邻版本的边界
- **v045**：Temperature / Top-K 与生成随机性——本篇不讲采样参数。
- **v047**：Workflow vs Agent——本篇不讲编排形态。
- **v052**：GPT-5.6 分层与工具协作——本篇只建立「怎么读分」的公共语言，不展开具体模型发布叙事。
- **v051（本篇）**：Benchmark 定义、主要测试集、厂商用法与选型心智。

## 核心线索
模型太多需要客观尺子 → 多维试卷（知识/推理/代码/数学/中文）→ 厂商挑高分宣传 → 门槛而非排名 → 结合业务与真实体验。

## 章节结构
1. 引言 — 为什么不能只看「第一」
2. 一、Benchmark 是什么
3. 二、常见测试集：多维能力的几张卷
4. 三、厂商怎么用 benchmark
5. 四、正确用法：门槛，不是排名
6. 五、实践清单
7. 六、面试题
8. 结语

## 核心来源
- `ai/agent/concepts/benchmark/readme.md`

## 面试要点
- 什么是 LLM Benchmark
- MMLU / GPQA / HumanEval / SWE-bench / MATH·AIME / C-Eval 分别测什么
- 为什么「Google-Proof」重要
- 为什么「某项第一」不等于整体最强
- 选型时如何用 benchmark
