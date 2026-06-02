# 从 div 到语义化：一个 AI Native 开发者的前端规范化初体验

## 引言

v012 上午用 JavaScript 调了 DeepSeek API，打通了"第二语言"。下午切换方向，学了一件前端的事——**用 WeUI 框架做一个按钮页面。**

WeUI 是微信官方的 UI 框架。但今天学的重点不是"WeUI 怎么用"，而是三个更底层的东西：**HTML5 语义化标签、BEM 命名规范、CSS Reset。** 这三件事和 WeUI 无关，它们是前端开发的"规范意识"——不管你用什么框架，写什么页面，都得遵守。

v012 上午是"AI 工程"，下午是"前端工程"。两条线看似不相关，但有一个共同点：**规范比技巧重要。** API Key 要用 .env 管理，类名要用 BEM 命名，样式要从 CSS Reset 开始——这些都是"不这么做也能跑，但做了才叫专业"的事。

## 一、HTML5 语义化标签：从 div 堆砌到结构化页面

之前的代码里，所有标签都是 `<div>`。`<div>` 是一个"无意义的容器"——它能包裹内容，但不告诉浏览器"这部分是什么"。

HTML5 引入了一系列语义化标签：

```html
<div class="page">
  <header class="page__hd">
    <h1 class="page__title">这是一个页面</h1>
    <p class="page__desc">这是一个页面的描述</p>
  </header>

  <main class="page__bd">
    <div class="button-sp-area">
      <a class="weui-btn weui-btn_primary">主要按钮</a>
      <a class="weui-btn weui-btn_default">默认的按钮</a>
      <a class="weui-btn weui-btn_default">次要按钮</a>
    </div>
  </main>
</div>
```

`<header>` 表示"这是头部"，`<main>` 表示"这是主体"。对比一下：

```html
<!-- 没有语义：只知道是一堆 div -->
<div class="hd">...</div>
<div class="bd">...</div>

<!-- 有语义：一眼看出页面结构 -->
<header class="page__hd">...</header>
<main class="page__bd">...</main>
```

语义化标签的价值有三个：
1. **浏览器理解**：屏幕阅读器能识别 `<header>` 和 `<main>`，给视障用户提供导航
2. **SEO 友好**：搜索引擎知道哪些是头部内容，哪些是主体内容
3. **代码可读性**：开发者看到 `<header>` 就知道是头部，不用猜 `.hd` 是什么意思

**语义化标签让代码从"机器能读"变成"人也能读"。** 这和 v005 学 Git 的道理一样——代码不只是给机器跑的，也是给人看的。

## 二、BEM 命名规范：解决 CSS 类名的"命名地狱"

写 CSS 最头疼的事之一就是"给类起名字"。`.wrapper`、`.container`、`.box`、`.content`——写多了就不知道哪个是哪个，也不敢改，怕一改就崩。

今天学了 **BEM 命名规范**，一种国际通用的 CSS 命名方法：

```
B = Block（区块）      → .page
E = Element（元素）    → .page__hd、.page__bd
M = Modifier（修饰符） → .weui-btn_primary、.weui-btn_default
```

### 三条命名规则

**规则一：Block 和 Element 之间用 `__` 双下划线分隔。**

```css
.page { }        /* Block：页面区块 */
.page__hd { }    /* Element：页面头部（hd = header） */
.page__bd { }    /* Element：页面主体（bd = body） */
.page__title { } /* Element：页面标题 */
.page__desc { }  /* Element：页面描述 */
```

看到 `.page__hd` 就知道它是 `.page` 的子元素。不用猜，不用查，名字本身就是文档。

**规则二：Block 和 Modifier 之间用 `_` 单下划线分隔。**

```css
.weui-btn { }            /* Block：按钮组件 */
.weui-btn_primary { }    /* Modifier：主要按钮（绿色） */
.weui-btn_default { }    /* Modifier：默认按钮（灰色） */
```

Modifier 表示"同一个组件的不同状态"。`.weui-btn` 是基础按钮，`.weui-btn_primary` 是它的"主要"状态。

**规则三：命名用最简单的英文单词，和结构相关。**

```
hd = header（头部）
bd = body（主体）
title = 标题
desc = 描述
```

不用 BEM，命名要靠猜——`.header` 还是 `.top` 还是 `.hd`？用了 BEM，命名靠规则——`.page__hd`，没有歧义。

### BEM 解决了什么问题？

最核心的问题是**命名冲突和维护困难**。假设页面有多个"标题"：

```css
/* 没有 BEM：不知道哪个 title 属于哪个模块 */
.title { }  /* 页面标题？卡片标题？弹窗标题？ */

/* 有 BEM：一目了然 */
.page__title { }    /* 页面的标题 */
.card__title { }    /* 卡片的标题 */
.modal__title { }   /* 弹窗的标题 */
```

**BEM 把"命名"从主观判断变成了客观规则。** 这和 v005 学 Git 的道理一样——规范不是限制，是让协作更顺畅的约定。

## 三、CSS Reset：从"浏览器默认"到"一张白纸"

不同浏览器对 HTML 元素的默认样式不一样。`<body>` 有默认 margin，`<ul>` 有默认列表样式，`<a>` 有默认下划线和蓝色。如果不清掉这些默认样式，同一个页面在不同浏览器里可能长不一样。

**CSS Reset 就是把这些默认样式全部清零，让页面从一张干净的白纸开始。**

### 两种方式

**方式一：通配符选择器（不推荐）**

```css
* {
  margin: 0;
  padding: 0;
}
```

`*` 匹配页面上**所有元素**——包括 `<html>`、`<head>`、`<script>`、`<style>` 这些不需要重置的元素。"贪婪"匹配，性能不好。

**方式二：列出所有需要重置的元素（推荐）**

```css
html, body, div, span, applet, object, iframe,
h1, h2, h3, h4, h5, h6, p, blockquote, pre,
a, abbr, acronym, address, big, cite, code,
del, dfn, em, img, ins, kbd, q, s, samp,
small, strike, strong, sub, sup, tt, var,
b, u, i, center,
dl, dt, dd, ol, ul, li,
fieldset, form, label, legend,
table, caption, tbody, tfoot, thead, tr, th, td,
article, aside, canvas, details, embed,
figure, figcaption, footer, header, hgroup,
menu, nav, output, ruby, section, summary,
time, mark, audio, video {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 100%;
  font: inherit;
  vertical-align: baseline;
  box-sizing: border-box;
}
```

看起来很长，但每一个元素都是"有的放矢"。精确匹配，不浪费性能。

### 关键的重置规则

除了 `margin: 0; padding: 0`，还有几个重要的重置：

```css
/* HTML5 语义化标签：旧浏览器不认识它们，需要声明为块级元素 */
article, aside, details, figcaption, figure,
footer, header, hgroup, menu, nav, section {
  display: block;
}

/* 链接：去掉下划线和默认颜色 */
a {
  text-decoration: none;
  color: inherit;
}

/* 表单元素：去掉默认边框和背景 */
button, input, select, textarea {
  font: inherit;
  background: transparent;
  border: none;
  outline: none;
}

/* 媒体元素：响应式 + 块级显示 */
img, svg, picture, video {
  max-width: 100%;
  display: block;
}
```

**CSS Reset 是"写样式之前的第一步"。** 就像 v012 上午学的 `.env` 是"写代码之前的第一步"一样——先清场，再开始。

## 四、WeUI 按钮组件：从设计稿到代码

WeUI 是微信官方的 UI 框架，微信里的按钮、列表、弹窗都是用它实现的。今天仿写了它的按钮组件。

### 按钮的基础样式

```css
.weui-btn {
  position: relative;
  display: block;
  min-width: 184px;
  max-width: 280px;
  margin-left: auto;
  margin-right: auto;
  padding: 12px 24px;
  font-weight: 500;
  font-size: 17px;
  text-align: center;
  color: #fff;
  line-height: 1.41176471;
  border-radius: 8px;
}
```

几个关键属性：
- `display: block`：按钮独占一行，宽度自适应容器
- `min-width: 184px; max-width: 280px`：限制按钮宽度范围
- `margin-left: auto; margin-right: auto`：水平居中
- `border-radius: 8px`：圆角

### 按钮的状态（Modifier）

```css
.weui-btn_primary {
  background-color: #07c160;  /* 微信绿 */
}

.weui-btn_default {
  background-color: rgba(0, 0, 0, 0.1);  /* 半透明灰 */
}
```

同一个 `.weui-btn` 基础样式，不同的 Modifier 给不同的颜色。这就是 BEM 的 Modifier 用法——**组件的"变体"用 Modifier 表示，不需要写两个完全不同的组件。**

### 相邻兄弟选择器 +

```css
.weui-btn+.weui-btn {
  margin-top: 15px;
}
```

`+` 是**相邻兄弟选择器**——选中的是"紧跟在前一个 `.weui-btn` 后面的 `.weui-btn`"。

效果是：
- 第一个按钮：没有上边距
- 第二个按钮起：每个都有 15px 的上边距

```html
<a class="weui-btn weui-btn_primary">主要按钮</a>     <!-- 无上边距 -->
<a class="weui-btn weui-btn_default">默认的按钮</a>   <!-- margin-top: 15px -->
<a class="weui-btn weui-btn_default">次要按钮</a>     <!-- margin-top: 15px -->
```

**不用给每个按钮单独加 margin-top，也不用写 `.first { margin-top: 0 }` 的覆盖逻辑。** 一个选择器搞定间距，干净利落。

### line-height 的设计稿还原

WeUI 按钮的 `line-height: 1.41176471`，这个数字不是随便写的——它是 UI 设计师标注的：

```
按钮高度：24px
字体大小：17px
line-height = 24 / 17 = 1.41176471
```

**前端开发不只是写代码，还要还原设计稿的精确数值。** 设计师标 24px 的高度，前端就要算出对应的 line-height，差一个像素都不行。

## 五、AI Prompt 的前端规范

今天学的三个规范，也可以写进 AI Prompt 里，让 AI 生成的代码更规范：

```
1. 使用 HTML5 语义化标签（header、main、footer、nav、section）
2. 使用 BEM 命名规范（Block__Element--Modifier）
3. 使用 CSS Reset（列出所有元素，不用 * 通配符）
```

如果直接告诉 AI"帮我写一个页面"，它可能给你一堆 `<div>` 和 `.wrapper`、`.container` 这样的类名。但如果你在 Prompt 里加上这三条规则，生成的代码就规范多了。

**Prompt Engineering 不只是用在"调 LLM"上，写代码时的注释、规范、约束，本质上都是 Prompt。** v011 学的提示词工程，在前端开发中同样适用。

## 结语

今天下午学了四件事，看似是"前端入门"，其实是"规范意识"：

**第一，HTML5 语义化标签让代码有"意义"。** `<header>` 比 `<div class="hd">` 更清晰，浏览器、搜索引擎、开发者都能理解。

**第二，BEM 命名规范让类名有"规则"。** `.page__hd` 不用猜就知道是 `.page` 的子元素，命名从主观判断变成客观规则。

**第三，CSS Reset 让页面从"一张白纸"开始。** 先清场再写样式，不同浏览器表现一致。

**第四，相邻兄弟选择器让样式逻辑更简洁。** `.weui-btn+.weui-btn` 一个选择器搞定间距，不用逐个加 margin。

回顾十三篇文章的完整路径：

- v001-v004：AI 工具链（OPC → Prompt → Agent → CLI）
- v005-v006：工程基本功（Git → 模块化）
- v007：业务视角（FDE）
- v008-v010：编程基本功 + 语言扩展（数组去重 → Python + API → JS 底层）
- v011：Prompt Engineering（从写代码到写提示词）
- v012：JavaScript 调用 LLM（双语言能力）
- **v013：前端规范化入门（语义化 + BEM + CSS Reset）**

v012 上午打通了 AI 工程的"第二语言"，v013 补上了前端开发的"规范意识"。从调 API 到写页面，AI Native 开发者不只是"后端选手"，也要能"前端落地"。

下篇见。
