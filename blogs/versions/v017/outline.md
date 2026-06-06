# v017 大纲

## 标题
用 Prompt 做 NLP：解构赋值与 AI 全栈的第一次实战

## 结构

### 引言
- v016 学了执行机制和原型链（语言底层）
- v017 用 ES6 的解构赋值写代码，用 Prompt 调 LLM 做 NLP 任务
- 从"理解语言"到"用语言干活"

### 一、解构赋值：从对象和数组里快速取值
- 对象解构：let {name, city} = {"name": "姚明", "city": "北京"}
- 为什么要用：比 obj.name 简洁，性能也好
- 数组解构：按顺序取值
- rest 操作符：let [coach, ...players] = [...] 余下的全部打包
- spread 操作符：[...players, ...hrplayers] 展开合并

### 二、NLP 四大任务：让 LLM 帮你读文本
- 情感分类 sentiment analysis
  - 正面 | 负面 | 中性
  - 电商评论、客服预警、产品质检
- 信息提取 information extraction
  - 从评论中提取商品名、品牌名
  - 格式化为 JSON 输出
- 主题推断
- 文本总结 summarization
  - 老板、小编的刚需：长文变短文
  - 可聚焦特定方面（运输、价格、质量）

### 三、实战：用 Prompt 跑通四种任务
- 情感分类的 Prompt 设计
- 信息提取的 Prompt 设计（JSON 格式输出）
- 文本总结的 Prompt 设计（聚焦不同维度）
- 批量处理多个评论

### 四、模块化：把项目拆清楚
- main.mjs 入口：跑任务、写 Prompt
- client.mjs：封装 OpenAI 客户端
- completion.mjs：通用的 getCompletion 函数
- import/export 的两种用法：默认导出 + 命名导出

### 结语
- 解构赋值让代码更简洁
- NLP 任务让 LLM 真正干活
- 模块化让项目能维护