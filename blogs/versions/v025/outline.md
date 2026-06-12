# v025 博客大纲

**标题**：多模态 AI 与前端工程化：一个 AI Native 开发者的 Vite 与 LLM 调用实战
**日期**：2026-06-12
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源笔记 |
|------|------|---------|
| 引言 | 回顾 v024（HTTP底层），引出从"提供API"到"消费API"的视角翻转——调用大模型 | 综合 |
| 一、多模态是什么 | 单模态 vs 多模态，图文混合输入输出，Qwen Image 2.0 Pro | ai/multi/readme.md |
| 二、前端工程化起点：Vite | 为什么需要工程化，Vite 的角色（脚手架/开发服务器/构建/代理/环境变量），项目结构 | ai/multi/readme.md + package.json |
| 三、API Key 安全管理 | 明文→环境变量→代理三层递进，.env.local、VITE_ 前缀、import.meta.env | ai/multi/readme.md |
| 四、Vite 代理 | vite.config.js 的 proxy 配置，/api → target 转发，changeOrigin，rewrite | vite.config.js + ai/multi/readme.md |
| 五、调用多模态生图 API | fetch POST 请求构造，multimodal-generation endpoint，content 数组混合 image+text | main.js |
| 六、完整代码走读 | 从 import.meta.env 到 innerHTML 渲染的完整链路 | main.js + index.html |
| 七、Vite 完整能力总结 | 脚手架、dev server、环境变量、代理、构建、预览——六合一总结 | ai/multi/readme.md |
| 八、AI 全栈版图回顾 | 从 v018 到 v025 三条学习线的交汇——后端+前端+AI | 综合 |
| 结语 | 从提供API到消费API的视角翻转，AI Native开发者的核心能力 | - |
