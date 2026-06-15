# v026 博客大纲

**标题**：HTML5 Canvas 与数据可视化：一个 AI Native 开发者的图形编程初体验
**日期**：2026-06-15
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源笔记 |
|------|------|---------|
| 引言 | 回顾 v025（Vite+LLM调用），引出今天从"文本/接口"走向"视觉/图形"——Canvas 2D编程 | 综合 |
| 一、Canvas 是什么 | canvas标签、getContext('2d')、Canvas API的编程范式 | fe/html5/canvas/readme.md |
| 二、Canvas 基础绘制 | fillRect、strokeRect、clearRect、fillStyle、strokeStyle——画布上"画"东西 | fe/html5/canvas/1.html |
| 三、帧动画 | requestAnimationFrame vs setInterval，clear-then-draw模式，动画循环 | fe/html5/canvas/2.html + readme2.md |
| 四、打飞机游戏开发 | Vite初始化、游戏架构（玩家/敌机/子弹/粒子）、游戏循环、键盘输入 | fe/html5/canvas/airplans/src/main.js |
| 五、敌兵种与Boss | 侦察机/战斗机/重装机/Boss四种敌兵种参数设计，射击机制，Boss阶段切换 | airplans/src/main.js |
| 六、升级与技能系统 | 五级升级配置、炸弹、护盾、进度条HUD——让游戏有成长感 | airplans/src/main.js |
| 七、数据可视化：ECharts | 从Canvas到ECharts，npm引入，option配置，柱状图，响应式 | fe/html5/canvas/echart/src/main.js + data.js |
| 八、Canvas vs ECharts vs 游戏引擎 | 三种图形技术选型对比，适用场景分析 | 综合 |
| 结语 | 从文本世界走向视觉世界，AI Native开发者的技能版图扩展 | - |
