# Harness Engineering

用工程化手段 让AI Agent 可靠 持续完成任务
智能体工程 AI Agent Harness

AI 应用开发工程师  Agentic RAG 应用
AI Agent 开发工程师 Harness Agent  FDE

## 包含六个基础模块
- Loop 主循环
  自主的长时间干活
  ReAct
  核心控制层 调用大模型 分发工具调用、判断任务终止条件
  Agent的主执行流程
- Tool 工具集 llm 能使用的工具集
- Context 上下文管理器
  无状态
  输入给模型的全部内容：系统提示词、历史对话、rag、es上下文、工具调用结果、上下文压缩 窗口控制
- Environment 沙箱环境
  工具运行时的隔离环境，文件系统、网络、数据库等
- Memory 记忆层
  跨轮次、跨会话状态持久化状态、短期记忆+长期记忆
- Observability 可观察性
  日志（分析）、轨迹Trace（调试）、评估（指标）

除了六个基础模块，包含一些可拔插的高级模块
- sub agents
  - 职责清晰  拆分
  - 上下文互不干扰
主Agent 分配任务给子Agent
子Agent 像子进程 上下文互不被打扰
主Agent 也不会因为子Agent 的执行而被阻塞、上下文受拖累
- hooks
- Police & Safety 安全与策略层
  权限、输出过程、资源配额

6大基础模块是最小内核; Sub Agents 属于高级编排的扩展模块
不是底层必选，但现代Agent Harness 工程体系普遍把它作为标准模块

- Agent A 写前端代码
- Agent B 写后端代码
- Agent C 写测试

## Sub Agents 子智能体
- 清晰的任务拆分
- 独立不受影响的上下文
  主Agent 
  负责分配任务 上下文不应收到太多干扰
  派发任务给子Agent 独立的运行上下文
  按需加载tools 不用一次性加载那么多

## 为什么是Agent 而不是Workflow?
固定的workflow 是预先写死的步骤(23-25年，较固定，简单任务)
只能按预设路径执行，无法应对不确定，动态变化的任务
多Agent (含subAgent) 可按需拆解任务，按需调用能力，根据中间结果调整执行分支
适合需求模糊，存在未知问题的复杂场景
具备更强的自适应与容错能力

### 举例
做一份技术调研报告：
- 任务需求  简单版本，workflow
  问题 -> 行业关键字 -> 技术关键字 -> 上网搜 -> 分析 -> 报告
- 任务是专业的
  分析需要哪些agent ?
  - 主Agent 负责任务拆解与整体调度
  - 子Agent 负责检索资料
    反扒、资料优劣
    自动分析、切换数据源
  - 摘要Agent
  - 校验
    不要全信资料，网上有些要分辨的
  - 行业内的大佬的联系方式找到
  - 报告Agent

## 多Agents 业务隔离
- 专属SYSTEM prompt
  多个system
  主system 规划、分工
  子system 执行任务
- 子进程