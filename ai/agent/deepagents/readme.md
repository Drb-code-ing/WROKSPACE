# DeepAgent

学会了langchain/langgraph 基于他们实现各种Agent

复杂的Agent 全部从头实现比较麻烦
DeepAgent 半成品的Agent 框架，提供了基础的Agent 模块，可以快速实现复杂的Agent

LangChain 是给你一堆AI 开发积木，
LangGraph 搭建复杂工作流的底层蓝图
DeepAgent 大幅度降低复杂Agent的开发门槛，适合快速落地复杂的Agent应用
跳过重复的底层基建，直接聚焦Agent的业务逻辑与能力迭代，是LangGraph生态面向生产落地的高阶方案
状态管理state，循环路由 持久化执行能力  底层
任务规划、长期记忆、子Agent的调度、上下文压缩等核心能力

## createAgent  LangChain
快速启动Agent 开发，帮我们打理底层的活
messages
配置model, tools, systemPrompt, middleware

## middleware 中间件
用户 request 对象  中间件（函数）生成
response
中间件插入到每一次Agent 运行中，提供一些格外功能
生命周期
添加状态


## 深度调研助手

只需要给他一个主题

调研国家统计局公开的2023年省级地区生产总值（GDP）数据： 提取GDP总量前6名身份的具体数值及同比增速， 计算六省GDP 总和、各省占全国GDP 的比重， 并按增速从高到低排名。

## Agents 划分
### 主Agent

整个系统的编排中心，负责把用户输入的调研主题拆解成可执行流程(内置`write_todos`规划工具)，并协调各子Agent 分工完成
它不亲自包揽所有调研细节，而是按 规划 -> 调用 -> 分析 -> 起草 -> 审阅 -> 定稿
推荐任务; 先用代办列表明确步骤，再按需委派子Agent 最后自己整合材料，撰写报告并根据边界反馈修订定稿

## 调研员子Agent(researcher)

每次只负责一个聚集的子主题。通过网络搜索搜集资料，将关键事实与来源URL整理成结构化摘要，写入find_*.md。
多个调研员可并行工作，适合大主题拆分成若干子方向同时推进

### 分析师子Agent(analyzer) 可选

当调用涉及数字对比、排名、增长率等计算时启用。
@langchain/quickjs 提供一个**沙箱（安全）**环境，编写js 代码，并在沙箱中执行，得到执行结果。
不会影响Agent 的正常运行。llm 不擅长计算，擅长写代码并完成计算，写入analysis_*.md。
供主Agent 写报告时引用。

## 编辑子Agent(editor)

在报告草稿完成后介入，从准确性、结构完整性、来源引用、语言表达等维度审阅，返回具体修改意见。
编辑部直接改写报告，审阅与修订分离，便于主Agent 在保持整体思路的前提下做针对性修改