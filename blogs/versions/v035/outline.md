# v035 大纲

## 标题
手写 Mini-Cursor：用 Node 子进程 + ReAct Loop 打造能写代码、执行命令的 AI 编程助手

## 主题
第三十一天学习——完整 Agent 工具系统构建（四工具协同）+ Node.js child_process 深度剖析 + 手写 Mini-Cursor 编程 Agent

## 核心线索
从"能读文件"到"能读、能写、能运行"——四个工具组成 Agent 的完整四肢，Node 子进程让 Agent 走出文件世界，进入真实系统环境。

## 章节结构

1. **引言** — v034 只有一只手（read_file），今天接上全部四肢
2. **Agent 工具生态** — 四个工具的完整实现与工程细节
   - read_file：日志反馈与进度可见性
   - write_file：path.dirname() 跨平台、fs.mkdir recursive、try-catch 容错
   - list_directory：Agent 的"眼睛"，先看目录再操作
   - execute_command：spawn 四参数详解
3. **Node.js child_process 深度剖析** — 为什么需要子进程、spawn 的四个关键参数、事件模型、Promise 包装
4. **手写 Mini-Cursor** — 完整架构图、任务 Prompt 设计、System Prompt 五要素、ReAct 循环、防呆设计
5. **完整执行流程回放** — 从创建项目到启动服务器的 10 轮 ReAct 全过程
6. **node-exec.mjs 独立实验** — 学习路径：纯 Node → LangChain tool() → 完整 Agent
7. **完整技术对比** — Chatbot → Read Agent → Write Agent → CLI Agent → Mini-Cursor
8. **面试要点汇总** — Node.js、Agent 工程、路径处理三大类面试题速查表
9. **AI 工程化认知升级** — 工具设计两个层次、技能树更新、从学到造的分水岭
10. **结语** — 四肢、桥梁、循环，三层总结 + 角色转变认知

## 核心代码
- all-tools.mjs：四个工具的完整工程实现（127 行）
- mini-cursor.mjs：完整的 ReAct Agent 循环（126 行）
- node-exec.mjs：纯 Node 子进程实验

## 面试要点
- Node.js：spawn vs exec、stdio 三种模式、shell: true 安全风险、IPC 通信
- Agent 工程：工具容错设计、System Prompt 五要素、ReAct 终止条件、并行 vs 串行
- 路径处理：path 模块跨平台、recursive 递归创建目录

## 情感线
今天是"从学到造"的分水岭——四个工具 + Node 子进程 + ReAct 循环，拼出了第一个能自主编程的 Agent。不是 demo，是工程。
