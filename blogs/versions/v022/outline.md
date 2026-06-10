# v022 博客大纲

**标题**：JS 的八种数据类型与内存分配：一个 AI Native 开发者的语言底层理解
**日期**：2026-06-10
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源笔记 |
|------|------|---------|
| 引言 | 回顾 v020（JS 执行机制）和 v021（数据结构），引出 JS 语言本身八种数据类型 | 综合 |
| 一、ECMA262 规范的八种类型 | 8种类型全景图、primitive vs reference | fe/js/type/readme.md |
| 二、原始数据类型详解 | Number、String、Boolean、null、undefined 五个原始类型的特征与应用 | fe/js/type/readme.md |
| 三、null vs undefined | 两者语义区别——空引用 vs 未定义，五种 undefined 出现场景 | fe/js/type/1.js, fe/js/type/2.js |
| 四、拷贝式赋值 vs 引用式赋值 | 栈内存存原值、堆内存存对象，两种赋值方式的底层区别 | fe/js/type/1.js |
| 五、Symbol：唯一的标识符 | ES6 新增，每次调用返回唯一值，用作对象属性 key | fe/js/type/4.js |
| 六、BigInt 与 Number 精度问题 | JS 浮点数精度丢失（0.1+0.2≠0.3）、BigInt 处理大整数 | fe/js/type/3.js |
| 七、内存分配：栈与堆 | 冯诺依曼体系、栈内存（快/小/原始类型）、堆内存（大/对象） | fe/js/type/readme.md, fe/js/runway/readme.md |
| 八、内存手动释放 | null 赋值触发垃圾回收 | fe/js/type/1.js |
| 结语 | 八种类型的全景回顾，类型理解是 JS 编程的基石 | - |
