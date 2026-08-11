# v063 博客大纲

**标题**：TS 类型之争与 Harness 择优工程：从 interface 与 type 的面试必考点，到让大模型自我评分的自动化流水线  
**日期**：2026-08-11  
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源 |
| --- | --- | --- |
| 引言 | 承接 v062 端侧推理，第 55 天回到面试考点：TS 类型 + LLM Harness，串起"用结构减少不确定性" | 综合 |
| 一、同一个对象，两种描述 | interface 与 type 都能描述对象结构，用于函数参数/返回值/类型约束 | readme.md / 1.ts |
| 二、继承：extends 与 & | `interface Employee extends Person` vs `type EmployeeType = PersonType & {job}` | 1.ts |
| 三、声明合并 | interface 可重复声明自动合并，type 重复即冲突；扩展库类型的意义 | 2.ts |
| 四、type 的用武之地 | 联合类型、元组类型（interface 不能）；函数类型两者都能、type 更简洁 | 3.ts / 4.ts |
| 五、React 实战 | UserCardProps 面向接口编程，TS 类 Java OOP、父子组件数据接口 | UserCard.tsx / App.tsx |
| 六、Harness 工程 | 工程化解决 LLM 幻觉与落地；马具比喻；呼应 v053 质量阀门 | harness readme.md |
| 七、核心思想 | Best of N Sampling + LLM as Judge + Harness 抽象，三阶段解耦 | readme.md |
| 八、代码拆解 | askLLM / judge / evaluateAll / generateCandidates / pickBest / harness 全流程 | index.mjs |
| 九、面试问答 | interface vs type、声明合并、LLM Harness、Best of N、LLM as Judge、流水线三阶段 | 综合 |
| 结语 | 编译期类型锁变量、运行期流水线筛生成；检查清单 | 综合 |

## 核心结论

- `interface` 与 `type` 的四大差异：继承（extends vs `&`）、声明合并（interface 可合并 / type 冲突）、非对象类型（type 能表示联合/元组，interface 不能）、函数类型（都能表达，type 箭头函数更简洁）；
- React 中用 `interface` 定义 props 契约（如 `UserCardProps`），即"面向接口的编程"；
- LLM Harness：将"生成 → 评测 → 择优"串成闭合流水线的编排框架，用工程化手段解决 LLM 幻觉与落地；
- 核心模式：Best of N Sampling（`Promise.all` 并行生成 N 份候选，随机性覆盖可能性）+ LLM as Judge（LLM 当自动化评分器，代替人工评测实现闭环）；
- 代码细节：`judge` 用 `parseFloat` 解析评分并 `isNaN` 兜底为 0 分，保证评委不靠谱时流水线仍可运行；`pickBest` 排序取最高分。

## 引用说明

- 全部基于第五十五天两个提交：
  - `3bac91d`（ai/interview/ts/type_interface/readme.md、1.ts、2.ts、3.ts、4.ts、type-interface/src/App.tsx、type-interface/src/cpmponents/UserCard.tsx）；
  - `61fa691`（ai/interview/harness/q1/readme.md、q1/index.mjs）。
