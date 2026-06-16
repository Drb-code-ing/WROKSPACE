# v028 博客大纲

**标题**：CSS 3D 与布局原理：一个 AI Native 开发者的视觉编程进阶
**日期**：2026-06-16
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源笔记 |
|------|------|---------|
| 引言 | 回顾 v026（Canvas 2D图形编程），引出今天从 2D 走向 3D——CSS 3D + 布局原理 + 定位系统 | 综合 |
| 一、Canvas 的 3D 能力 | getContext('webgl')、Three.js、AI 物理大模型的前景 | fe/html5/3d/readme.md |
| 二、CSS 3D 核心概念 | perspective 透视距离、transform-style: preserve-3d、3D 变换属性 | fe/html5/3d/common.css |
| 三、CSS 动画：让 3D 动起来 | @keyframes、animation 属性、transform 组合（rotateX/Y/Z + translateX/Y/Z） | common.css |
| 四、布局基础：行内与块级 | inline vs block、display 属性切换、inline-block 的天坑 | fe/html5/3d/readme.md + 2.html |
| 五、Flex 弹性布局 | display: flex、主轴与交叉轴、justify-content + align-items、格式化上下文 | fe/html5/3d/3.html |
| 六、视口单位与移动端适配 | vh/vw 单位、100vh 全屏布局、响应式设计 | fe/html5/3d/readme.md |
| 七、定位系统 | relative/absolute/fixed/sticky 四种定位、定位上下文 | fe/html5/3d/readme.md |
| 八、实战：CSS 3D 立方体 | 六面体搭建、perspective + preserve-3d、transform 拼装 | 1.html + common.css |
| 结语 | 从 Canvas 到 CSS 3D，从算法到视觉——v027+v028 完成"逻辑+视觉"双线进阶 | - |
