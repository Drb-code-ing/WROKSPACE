# v081 博客大纲

**标题**：Agent 记忆管理：InMemory 短期记忆、文件持久化，与上下文截断的取舍
**日期**：2026-09-01
**目标平台**：稀土掘金（juejin.cn）
**学习笔记**：第六十七天（ai/agent/memory/，git 短提交号 `d6158ff`（上，InMemory）/ `1eb2823`（下，文件持久化 + 截断）；核心是 Agent 记忆的两根轴——存储逻辑（内存/文件/数据库）与管理逻辑（截断/总结/检索），配套 InMemoryChatMessageHistory、FileSystemChatMessageHistory、trimMessages 三个实践）

## 结构

| 章节 | 内容 | 来源 |
| --- | --- | --- |
| 引言 | 开门见山：大模型无状态，Agent 靠记忆机制记住对话；两个子问题（历史放哪 / 放多少）；三个技术核心（Agent = LLM + Harness 且 tool/RAG 依赖 memory、记忆从数组升级为容器、存储轴 × 管理轴） | readme.md 综合 |
| 一、大模型为什么"记不住" | 无状态是起点；Agent = LLM + Harness（tool 干活 / RAG 取知识 / 都依赖 memory）；早期 chatMessage 数组的局限（持久化、上下文窗口 200k、开销）；/compact /clear；记忆 = 存储逻辑 + 管理逻辑 | readme.md「Agent = LLM + Harness」「大模型无状态」「持久化/上下文窗口/开销」 |
| 二、临时记忆 | InMemoryChatMessageHistory 把数组升华成内存记忆实例；addMessage / getMessages；Human/AI/Tool 消息统一结构（type/content）；两轮对话循环（用户入历史 → 组装 system+history → invoke → AI 回复存回历史）；msg.type 区分用户/助手 | history-test.mjs |
| 三、长期记忆 | FileSystemChatMessageHistory 持久化到文件；1.x 改名（FileChatMessageHistory → FileSystemChatMessageHistory）与 import 路径；filePath + sessionId 两个核心参数；chat_history.json 的存储结构（按 sessionId 分组 + messages 数组 + type/data.content）；history-test3 跨重启恢复第三轮对话；长时记忆两种载体：文件 / 向量数据库（Milvus 按相关性检索） | history-test2.mjs、history-test3.mjs、chat_history.json、readme.md「长时记忆」 |
| 四、上下文管理 | 管理三手段：截断/总结/检索，本篇实践截断；两种方式：slice(-maxMessages) 按条数（简单但不感知 token）、countTokens + trimMessages（js-tiktoken cl100k_base 编码计数、maxLength/tokenCounter/strategy:'latest'、token 单调递增 + 二分查找）；按条数快但粗、按 token 准但贵 | truncation-memory.mjs |
| 五、记忆的完整图景 | 存储轴（内存 → 文件 → 数据库）× 管理轴（截断 → 总结 → 检索）交叉；三手段可组合（检索挑相关 → 总结压缩 → 截断控长）；tool 与 RAG 都依赖 memory 的回扣 | readme.md「memory 逻辑」 |
| 面试问答 | 大模型无状态与 Agent 靠什么记住、InMemory 与裸数组区别、FileSystem 两个参数与跨重启、管理三手段、按条数 vs 按 token、trimMessages 参数、长期记忆两种载体 | 综合 |
| 结语 | 记忆链路图（为什么需要记忆 → 临时 → 长期 → 上下文管理 → 统一框架）+ 检查清单 | 综合 |

## 核心结论

- **大模型无状态，Agent 靠记忆机制记住**：Agent = LLM + Harness（tool + RAG + memory），tool 让它"干活"、RAG 让它"取知识"，两者都依赖 memory；早期 chatMessage 数组的局限是持久化、上下文窗口大小与开销；
- **记忆问题 = 存储逻辑 + 管理逻辑两根轴**：存储轴（内存 → 文件 → 数据库）回答"历史放哪"，管理轴（截断 → 总结 → 检索）回答"放多少"；
- **临时记忆 InMemoryChatMessageHistory**：内存里的消息容器，addMessage 添加 Human/AI/Tool 消息（模型回复也要存回历史）、getMessages 取全部；message 对象统一带 type/content；
- **长期记忆 FileSystemChatMessageHistory**：filePath + sessionId 持久化到 chat_history.json，跨重启 getMessages 恢复历史接续对话；1.x 类名从 FileChatMessageHistory 改名；长时记忆还有向量数据库（按相关性检索）这一载体；
- **上下文截断两种方式**：slice(-N) 按条数（简单、不感知 token）；trimMessages + js-tiktoken 按 token（编码计数、maxLength/tokenCounter/strategy:'latest'、单调递增 + 二分查找）；按条数快但粗、按 token 准但贵。

## 引用说明

- 基于第六十七天学习笔记（git 提交号 `d6158ff`（上）/ `1eb2823`（下））：
  - `E:/WROKSPACE/ai/agent/memory/readme.md`（Agent 记忆原理 / Agent = LLM + Harness / 存储与管理逻辑）——`1eb2823`（上+下两次提交后最终状态）；
  - `E:/WROKSPACE/ai/agent/memory/history-test.mjs`（InMemoryChatMessageHistory 两轮对话 / 临时记忆）——`d6158ff`；
  - `E:/WROKSPACE/ai/agent/memory/history-test2.mjs`（FileSystemChatMessageHistory 持久化 / 1.x 改名）——`1eb2823`；
  - `E:/WROKSPACE/ai/agent/memory/history-test3.mjs`（从文件恢复历史 / 第三轮接续）——`1eb2823`；
  - `E:/WROKSPACE/ai/agent/memory/truncation-memory.mjs`（slice 按条数 + trimMessages 按 token 截断）——`1eb2823`；
  - `E:/WROKSPACE/ai/agent/memory/chat_history.json`（文件持久化产物 / 存储结构）——`1eb2823`。
- 素材说明：v054/v055 讲过 Milvus 原理与 RAG 工程，v079 讲过 Milvus 三组件部署与集合建模；本篇是 **Agent 记忆本身的分层实现（内存 → 文件持久化 → 上下文截断）**，向量数据库只在"长时记忆的另一种载体"层面引用，不重复 RAG 工程细节。未登记无讲解价值的文件：package.json / package-lock.json / .env 类。
