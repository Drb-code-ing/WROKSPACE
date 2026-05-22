# v003 大纲

## 标题
从 AIGC 到 AI Agent：用 Claude Code 搭建产品级落地页的实战

## 结构

### 引言
- 接 v002 "代码向后，业务向前"
- 从一个困惑引入：AI 生成代码后还得手动复制粘贴？
- Claude Code 给出了不同的答案

### 一、从 Chat Bot 到 Agent：AI Coding Agent 的进化
- AIGC 阶段：LLM chatbot → 复制代码 → 粘贴到编辑器 → 手动调试
- Cursor 的过渡角色：不只是编辑器，而是 AI Coding Agent
- Claude Code 的关键区别：有手有脚
  - 能读写文件、运行命令、管理项目
  - 不只是"生成代码"，而是"完成工作"
- 最佳实践：单独窗口打开项目目录
  - 让 Agent 有边界感，不被上下文干扰
  - 专注完成任务
- 配置 DeepSeek 做后端（cc switch）

### 二、实战：产品级落地页的 Prompt 驱动开发
- 项目背景：Foodiez 外卖 App 落地页
- 从一次失败的尝试开始
  - 豆包生成纯 HTML/CSS/JS → 快速原型可以，但离生产级有距离
  - 决定升级技术栈：React + TypeScript + Tailwind CSS + Framer Motion
  - 从 AIGC 切换到 Claude Code Agent

### 三、六要素 Prompt 框架详解
- 对比 v002 的五块分割法，提出六要素：
  1. 任务描述（Input）
  2. 最终目标（Goal）
  3. 技术栈（Tech Stack）
  4. 风格和视觉方向（Style）
  5. 页面结构（Layout）
  6. 交付内容（Deliverable）
- 完整 Prompt 展示（引用）
- Agent 如何将 Prompt 转化为工程化代码

### 四、9 个页面模块一览
- Navbar / Hero / Social Proof / How It Works / Feature Highlights
  / App Preview / Promo Banner / Final CTA / Footer
- 每个模块一句话设计意图
- 强调：动画（Framer Motion）、响应式、可访问性

### 五、Prompt 设计的进阶思考
- v002 的五块分割法 vs 本期的六要素框架
- 核心洞察：Prompt 结构取决于项目类型
  - 3D 小世界 → 强调体验和技术约束
  - 落地页 → 强调技术栈和交付标准
- Prompt 设计不是模板化，而是根据项目特征定制

### 结语
- AIGC（复制粘贴）→ AI Agent（自主干活）→ 下一步？
- 七个角色中的"Boss/Agent"角色真正落地了
- Be AI Native
