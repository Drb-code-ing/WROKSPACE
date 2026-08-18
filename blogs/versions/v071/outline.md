# v071 博客大纲

**标题**：TS 工具类型七件套：Pick、Omit、Partial、Record，与 Omit 的三步底层实现
**日期**：2026-08-18
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源 |
| --- | --- | --- |
| 引言 | 开门见山：TS 工具类型解决"从已有类型推导新类型"的重复定义；Omit 等价式背后的组合思路 | readme.md |
| 一、起点 User 接口 | 四个字段的 User 作统一原材料 | 1.ts / 2.ts |
| 二、Pick | 挑选字段（UserPreview）；Pick<T, 联合字符串> | 1.ts + readme.md |
| 三、Omit | 排除字段（UserSafe 去 email）；与 Pick 镜像 | 1.ts + readme.md |
| 四、Partial | 全部可选；patch 部分更新场景 | 1.ts + readme.md |
| 五、Record | 构造键值字典；ErrorMsgMap 状态码映射 + ?? 兜底 | 1.ts |
| 六、ReturnType 与 Exclude | ReturnType<typeof fn>；Exclude 排除联合成员；Omit 管对象/Exclude 管联合 | 1.ts |
| 七、Omit 三步底层实现 | keyof → Exclude → Pick 拆解 MyOmitUser；组合思维 | 2.ts + readme.md |
| 八、七件套全景 | 表格对照（签名/作用/操作对象） | 综合 |
| 面试问答 | Pick/Omit 区别、Omit 等价式、Partial 场景、Record/Exclude 辨析、ReturnType typeof | 综合 |
| 结语 | 会用 vs 会拆两层；检查清单 | 综合 |

## 核心结论

- **工具类型解决"从已有类型推导新类型"**：大型项目类型消费大，用工具类型减少重复类型定义；
- **Pick 白名单"留" / Omit 黑名单"删"**：`Pick<T, K>` 挑选字段、`Omit<T, K>` 排除字段，是一对镜像；
- **Partial<T> 全部可选**：用于 patch 部分更新，配合后端 PATCH"只改一部分"语义；
- **Record<K, V> 构造键值字典**：`Record<number, string>` 固化"状态码→错误信息"映射，`??` 兜底未知错误；
- **ReturnType<typeof fn> 取函数返回类型**：要 `typeof` 因为 ReturnType 要的是函数类型而非函数值；
- **Omit 管对象接口 / Exclude 管联合类型**：两者操作对象不同，别混用；
- **Omit = Pick + Exclude + keyof 的三步组合**（TS 内部实现原理）：`keyof T` 拿所有键联合 → `Exclude` 删 K → `Pick` 提取剩余键；
- **组合思维**：用简单工具类型拼出复杂类型，是进阶 TS 的核心能力。

## 引用说明

- 全部基于第六十天提交 `5cc1df9`（"第六十天学习 ts相关面试题"）：
  - `fe/ts/pick_partial/readme.md`（TS 高级类型：Pick/Omit 签名、Omit 等价式拆解、工具类型清单）；
  - `fe/ts/pick_partial/1.ts`（Pick/Omit/Partial/Record/ReturnType/Exclude 的 User 示例与注释）；
  - `fe/ts/pick_partial/2.ts`（keyof → Exclude → Pick 三步推导 MyOmitUser，即 Omit 底层原理）。
- 备注：`readme.md` 顶部另有 Docker mysql 笔记，属第六十天 docker 主题，已归入 v070 博客，本篇仅取其中"TS 高级类型"部分。
