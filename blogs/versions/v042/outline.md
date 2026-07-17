# v042 大纲（扩展版）

## 标题
从 Prompt 到可复用能力：Agent Skills 的工程本质、SKILL.md 协议与面试通关指南

## 主题
第三十八天学习 skill 初步——基于 `ai/skills` 笔记与本地 `.agents/skills` 实践（会议纪要 skill、AI 日报 skill、skill-creator），系统梳理 Agent Skills 是什么、解决什么问题、与 Tool/MCP/Prompt/RAG/Subagent 的边界、SKILL.md 结构与渐进式披露、触发工程、写作模式、组合协作、评测体系、生产治理，以及面试高频问答。

## 与相邻版本的边界
- **V033**：提出 Agent 六要素公式，Skills 只被点名。
- **V036 / V037**：MCP / Tool。
- **V038 / V040 / V041**：RAG。
- **V039**：流式输出。
- **V042（本篇）**：只讲 Skills。不混入同日 RAG 全量与流式专题。

## 核心线索
Skill = 专业流程的产品化封装。YAML 元数据负责路由，Markdown 工作流负责工艺，资源与脚本负责细则与确定性，evals 负责回归。工程目标：可触发、可复用、可评测、可演进、可治理。

## 章节结构
1. 引言：前有 MCP，后有 Skills
2. 一、何为 Skill：能力蒸馏
3. 二、用 AI 的两阶段与三阶段史
4. 三、六要素中的位置与易混概念矩阵
5. 四、Skill 构成：文件夹即能力单元
6. 五、SKILL.md 协议深挖
7. 六、渐进式披露与 token 经济
8. 七、触发工程：undertrigger / overtrigger
9. 八、写作模式：可执行、可解释、可泛化
10. 九、实战一：会议纪要 Skill（含转写→纪要样例）
11. 十、实战二：AI 日报 Skill
12. 十一、从 0 到 1：手把手封装一个 Skill
13. 十二、skill-creator 与评测体系
14. 十三、Skill 组合、冲突与 Agent Host 运行时
15. 十四、生产治理：版本、权限、安全、团队共享
16. 十五、何时封装 / 决策树 / 反模式大全
17. 十六、面试题库（基础→深挖→场景设计）
18. 十七、上线检查清单与 FDE 技能树更新
19. 结语

## 核心来源
- `ai/skills/readme.md`
- `ai/skills/hys/readme.md`
- `ai/skills/hys/meeting/meeting_content.txt`
- `.agents/skills/meeting-minutes/SKILL.md`
- `.agents/skills/tian-ai-daily/SKILL.md`
- `.agents/skills/skill-creator/SKILL.md`
- `blogs/versions/v033/blog.md`（衔接，不重复）

## 面试要点
- Skill 定义与能力蒸馏
- 与 Prompt / System Prompt / Tool / MCP / RAG / Subagent / Custom GPT 的边界
- description 路由与触发评测
- Progressive Disclosure
- 会议纪要质量门禁（不编造、待确认、行动项判定）
- skill-creator 闭环与 assertion 设计
- 多 Skill 冲突与治理
- 生产安全与“无惊喜原则”
- OPC 虚拟岗位编制

## 情感线
从每天重新培训实习生，到把岗位 SOP 编码成可版本化的 Skills 资产——Skills 是 OPC 从概念走向日常作业的关键一跳。
