# v013 大纲

## 标题
从 div 到语义化：一个 AI Native 开发者的前端规范化初体验

## 结构

### 引言
- v012 上午用 JavaScript 调 DeepSeek API，下午切换到前端学习
- 用 WeUI 框架做按钮页面，但重点不是 WeUI，而是三个底层规范：HTML5 语义化标签、BEM 命名规范、CSS Reset
- 核心观点：规范比技巧重要（API Key 用 .env、类名用 BEM、样式从 CSS Reset 开始）
- v012 上午是"AI 工程"，v013 是"前端工程"，共同点是"规范意识"

### 一、HTML5 语义化标签：从 div 堆砌到结构化页面
- div 是"无意义的容器"，不告诉浏览器"这部分是什么"
- HTML5 语义化标签：header、main、footer、nav、section、article 等
- 代码示例：<header class="page__hd">、<main class="page__bd">
- 对比：div class="hd" vs header class="page__hd"
- 语义化价值：① 浏览器理解（屏幕阅读器） ② SEO 友好 ③ 代码可读性
- 呼应 v005：代码不只是给机器跑的，也是给人看的

### 二、BEM 命名规范：解决 CSS 类名的"命名地狱"
- 问题：.wrapper、.container、.box 写多了不知道哪个是哪个
- BEM = Block（区块） + Element（元素） + Modifier（修饰符）
- 三条命名规则：
  - Block 和 Element 之间用 __ 双下划线分隔：.page__hd
  - Block 和 Modifier 之间用 _ 单下划线分隔：.weui-btn_primary
  - 命名用最简单的英文单词，和结构相关（hd=header, bd=body）
- 代码示例：.page → .page__hd → .page__title，.weui-btn → .weui-btn_primary
- BEM 解决的核心问题：命名冲突和维护困难
  - 没有 BEM：.title 不知道属于哪个模块
  - 有 BEM：.page__title、.card__title、.modal__title 一目了然
- 呼应 v005 Git：规范不是限制，是让协作更顺畅的约定

### 三、CSS Reset：从"浏览器默认"到"一张白纸"
- 问题：不同浏览器对 HTML 元素的默认样式不同
- CSS Reset：把默认样式全部清零，页面从干净的白纸开始
- 两种方式：
  - 通配符选择器 *：简洁但"贪婪"，匹配所有元素，性能不好（不推荐）
  - 列出所有需要重置的元素：精确匹配，性能好（推荐）
- 关键重置规则：
  - HTML5 语义化标签需要 display: block（旧浏览器兼容）
  - a 标签去掉下划线和颜色：text-decoration: none; color: inherit
  - button/input 等表单元素去掉默认边框和背景
  - img/video 等媒体元素设置 max-width: 100%; display: block
- CSS Reset 是"写样式之前的第一步"，呼应 .env 是"写代码之前的第一步"

### 四、WeUI 按钮组件：从设计稿到代码
- WeUI：微信官方 UI 框架
- 按钮基础样式：.weui-btn（display: block, min-width, max-width, 居中, 圆角）
- 按钮状态（Modifier）：.weui-btn_primary（微信绿 #07c160）、.weui-btn_default（半透明灰）
- BEM Modifier 用法：同一个组件的不同变体，不需要写两个完全不同的组件
- 相邻兄弟选择器 +：.weui-btn+.weui-btn { margin-top: 15px }
  - 效果：第一个按钮无上边距，后续按钮都有 15px 间距
  - 不用逐个加 margin-top，也不用写覆盖逻辑
- line-height 设计稿还原：24px（按钮高度）/ 17px（字体大小）= 1.41176471
- 前端开发不只是写代码，还要还原设计稿的精确数值

### 五、AI Prompt 的前端规范
- 三个规范可以写进 AI Prompt：语义化标签、BEM 命名、CSS Reset
- 不加规范：AI 生成一堆 div 和 .wrapper、.container
- 加了规范：生成的代码更专业
- Prompt Engineering 不只用在"调 LLM"上，写代码时的注释、规范、约束本质上都是 Prompt
- 呼应 v011：提示词工程在前端开发中同样适用

### 结语
- 四件事：① 语义化标签让代码有"意义" ② BEM 让类名有"规则" ③ CSS Reset 让页面从"白纸"开始 ④ 相邻兄弟选择器让样式逻辑更简洁
- 十三篇文章的完整路径
  - v001-v004：AI 工具链（OPC → Prompt → Agent → CLI）
  - v005-v006：工程基本功（Git → 模块化）
  - v007：业务视角（FDE）
  - v008-v010：编程基本功 + 语言扩展（数组去重 → Python + API → JS 底层）
  - v011：Prompt Engineering（从写代码到写提示词）
  - v012：JavaScript 调用 LLM（双语言能力）
  - v013：前端规范化入门（语义化 + BEM + CSS Reset）
- v012 上午打通 AI 工程"第二语言"，v013 补上前端开发"规范意识"
- 下篇见。
