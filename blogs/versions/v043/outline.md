# v043 大纲

## 标题
BFF 层流式输出：从前端直连到生产级流式网关的架构演进

## 主题
第三十九天学习 BFF 层处理流式输出——基于 `ai/SSE/stream-bff` 实践（Vue 3 + Vite + Express BFF + DeepSeek stream API），系统梳理 BFF（Backend For Frontend）在 AI 流式场景中的角色：从解决 API Key 安全与跨域问题，到成为生产级流式网关的核心——协议适配、错误重试、限流熔断、多模型路由、流式转换与成本管控。

## 与相邻版本的边界
- **V039**：流式输出的客户端视角——SSE 协议、ReadableStream、buffer 管理、HTTP chunked encoding。重点在"前端怎么消费流"。
- **V042**：Agent Skills 的能力封装与治理。
- **V043（本篇）**：流式输出的架构视角——BFF 层的引入、演进与生产化。重点在"流式链路中间层怎么做、为什么做、做到什么程度"。
- 不重复 SSE 协议基础、ReadableStream API 细节。直接用 BFF 的视角重新组织流式整条链路。

## 核心线索
一条请求从前端到 LLM 再回来，经历三层架构：前端 → BFF → LLM。BFF 不是"多一层转发"——它把安全、跨域、错误处理、流式解析复杂度从前端剥离，让前端回归"发请求、读流、渲染 UI"的简单职责。生产级的 BFF 更进一步：限流、鉴权、多模型路由、流式协议转换、缓存、降级——它是一个流式 API 网关。

## 章节结构

1. **引言** — v039 回答了"流是怎么来的"，v043 回答"流该怎么架构"
2. **一、三层架构：为什么前端不能直连 LLM** — API Key 泄露、跨域、前端过重
3. **二、BFF 层的最小定义与第一天职** — 前端专属后端、大前端能力边界
4. **三、第一级：Vite Proxy——最薄的 BFF** — proxy 配置、跨域原理、rewrite 规则、局限性
5. **四、第二级：Express BFF——有脑子的中间层** — 路由定义、请求转发、API Key 服务端化管理
6. **五、BFF 中的流式管道：ReadableStream 在 Node 端的消费与透传** — 服务端 stream pipeline
7. **六、第三级：生产级流式 BFF 网关** — 鉴权、限流、多模型路由、熔断降级、流式日志
8. **七、BFF 作为协议适配层** — SSE→SSE 透传、SSE→chunk 聚合、SSE→WebSocket 桥接
9. **八、流式输出中的 Token 经济——BFF 层的成本管控** — 流式 token 计数、用户配额、成本预警
10. **九、BFF 的变体与延伸** — API Gateway 模式、Edge Function BFF、多端 BFF
11. **十、完整数据流：一次"用户提问→流式回答"在三级 BFF 架构中的全旅程**
12. **十一、面试题库** — BFF 定义、安全价值、流式透传、架构演进、事故场景
13. **结语** — BFF 是 AI 应用从 Demo 到产品的第一道分水岭

## 核心来源
- `ai/SSE/readme.md`：BFF 概念、三层架构、跨域解决思路
- `ai/SSE/stream-bff/server.mjs`：Express BFF 服务端、dotenv 安全加载、fetch LLM stream
- `ai/SSE/stream-bff/src/App.vue`：Vue 前端 fetch /api/stream
- `ai/SSE/stream-bff/vite.config.js`：Vite proxy 跨域方案
- `ai/stream-demo/readme.md`：二进制流基础概念、SSE 数据块格式

## 面试要点
- BFF 定义与三层架构理解
- 纯前端直连 LLM 的安全风险（API Key 暴露）
- Vite proxy 解决跨域的原理与局限
- Express BFF 的流式透传实现
- Node 端 ReadableStream 管道
- 生产 BFF：鉴权、限流、多模型路由、熔断
- BFF 与 API Gateway 的关系
- BFF 层流式日志与可观测性
- SSE 在 BFF 中的三种处理模式（透传/聚合/桥接）

## 情感线
从前端硬扛二进制流解析、API Key 裸奔、跨域抓狂，到 BFF 层把复杂度一口吃掉——好的架构不是"多加一层"，而是让每一层只做它最擅长的事。
