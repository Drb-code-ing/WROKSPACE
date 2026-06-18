# v030 博客大纲

**标题**：从写 Prompt 到设计 Loop：一个 AI Native 开发者的自动化思维觉醒
**日期**：2026-06-18
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源笔记 |
|------|------|---------|
| 引言 | 回顾 v029（Agent 核心概念），引出今天更深一层——不是写 Prompt，而是设计 Loop，让 AI 自己跑起来 | 综合 |
| 一、Loop 是什么 | 开源大佬的洞见：别给 AI 写提示词，去设计 Loop；Claude Code 作者也 Loop；Loop 是计算机最底层的技术之一 | ai/loop/readme.md |
| 二、Loop 三要素 | 从哪里开始、重复做什么、什么时候停——一万行数据逐行检查的例子 | ai/loop/readme.md |
| 三、AI 训练中的 Loop | DeepSeek、Claude、Qwen 所有模型都是 Loop 跑出来的——训练底层逻辑：拿数据→算误差→调参数→再来一轮 | ai/loop/readme.md |
| 四、从手动协作到自动 Loop | 手动模式：写 Prompt → 看结果 → 不满意 → 改 → 再来；Loop 模式：Completion → Check → 对比目标 → 退出/继续 | ai/loop/readme.md |
| 五、Loop 的优劣势 | 解放人力 vs Token 大爆炸 | ai/loop/readme.md |
| 六、实战：Loop 代码全流程 | 小红书文案生成器逐行解读——gen() 生成、check() 校验、needStop() 刹车、限死循环三边界（maxRound/maxToken/sameStop） | ai/loop/demo/main.mjs |
| 结语 | 从 v001 到 v030 的里程碑回顾、Loop 是 Agent 自动化能力的放大器、AI Native 开发者的能力跃迁：调 API → 写 Prompt → 设计 Agent → 设计 Loop | - |
