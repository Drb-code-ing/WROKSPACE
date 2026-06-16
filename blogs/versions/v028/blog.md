# CSS 3D 与布局原理：一个 AI Native 开发者的视觉编程进阶

## 引言

v026 用 Canvas 2D 在浏览器里画图、做动画、写游戏——那是**像素级**的图形编程。v027 转向算法思维，学了 DFS、BFS 和推荐系统——那是**逻辑级**的系统思维。

今天回到视觉，但升一个维度：**从 2D 走向 3D。** CSS 3D 变换 + 布局原理 + 定位系统——这些是前端工程师每天都在用但很少系统捋清楚的基础。

为什么 AI Native 开发者要学 CSS 3D？两个原因：
1. **3D 是下一波交互的趋势**——WebGL、Three.js、AI 物理引擎都在爆发，CSS 3D 是最友好的入门
2. **布局和定位是前端的骨架**——不懂 flex、不懂定位，页面永远排不齐

```
v026 ──→ v027 ──→ v028 今天
图形编程   算法思维   CSS 3D + 布局
  2D        逻辑       3D + 骨架
```

## 一、Canvas 的 3D 能力：从 2D 到 WebGL

v026 里学了 `getContext('2d')`，但 Canvas 还有一个更强大的模式：

```javascript
// 2D 上下文 → 2D 游戏、数据可视化
const ctx2d = canvas.getContext('2d')

// 3D 上下文 → WebGL → Three.js → 3D 游戏、AI 物理模拟
const ctx3d = canvas.getContext('webgl')
```

**WebGL 是浏览器里的 OpenGL。** 它给 JS 提供了访问 GPU 的能力，可以做 3D 渲染、物理模拟、图像处理。Three.js 是对 WebGL 的高层封装——就像 ECharts 封装了 Canvas 2D 一样。

> **AI 游戏时代的关键趋势**：Three.js + 物理大模型（AI 驱动的物理引擎）正在爆发。Canvas 的 3D 能力（WebGL）是这一波浪潮的基础。

但 WebGL 门槛太高——着色器、缓冲区、矩阵变换……我们先用 CSS 3D 入门 3D 思维，为后面的 Three.js 打基础。

## 二、CSS 3D 核心概念

### 为什么 CSS 也能做 3D？

CSS 不只是颜色和字体——`transform` 属性可以触发 **GPU 加速的 3D 渲染**。哪怕是一个 2D 页面，有时也会手动开启 3D 化来获得更流畅的动画：

```css
/* 这行代码可以触发 GPU 加速 */
.element {
    transform: translateZ(0); /* 强制开启 3D 渲染上下文 */
}
```

### 两个核心属性

```css
.scene {
    /* 核心1：透视距离——模拟"近大远小" */
    perspective: 600px;
    /* 值越小 → 透视效果越强 → 3D 感越明显 */
    /* 值越大 → 透视效果越弱 → 接近平面 */
}

.cube {
    /* 核心2：保持 3D 空间——告诉浏览器"我的子元素在 3D 空间中" */
    transform-style: preserve-3d;
}
```

```ASCII
perspective: 600px（透视距离）

    观察者 👁
       │
       │   perspective: 600px
       │
       ▼
    ┌─────────┐
    │  3D 场景 │  ← transform-style: preserve-3d
    │  ┌───┐   │
    │  │立方│   │
    │  └───┘   │
    └─────────┘

值越小 → 👁 越靠近物体 → 透视越强（鱼眼效果）
值越大 → 👁 越远离物体 → 透视越弱（接近正交）
```

**`perspective` 就是模拟人眼到屏幕的距离。** 600px-1000px 是常用的舒服范围。太小会扭曲，太大就没 3D 感觉了。

### 3D 变换函数

CSS 提供了六种 3D 变换：

| 函数 | 作用 | 示例 |
|------|------|------|
| `translateZ(d)` | 沿 Z 轴平移 | `translateZ(100px)` → 向屏幕外移动 |
| `translateX(d)` | 沿 X 轴平移 | `translateX(-100px)` → 向左 |
| `translateY(d)` | 沿 Y 轴平移 | `translateY(-100px)` → 向上 |
| `rotateX(deg)` | 绕 X 轴旋转 | `rotateX(90deg)` → 向前翻转 |
| `rotateY(deg)` | 绕 Y 轴旋转 | `rotateY(90deg)` → 水平翻转 |
| `rotateZ(deg)` | 绕 Z 轴旋转 | `rotateZ(180deg)` → 平面旋转 |

```
CSS 3D 坐标系统：

        Y+
        ↑
        │
        │   Z+ → (屏幕外，对着你的脸)
        │  ↗
        └─────────→ X+
      (原点在左上角)
```

## 三、CSS 动画：让 3D 动起来

静态的 3D 只是立体几何，加上动画才是真正的"3D 效果"。

### @keyframes：定义动画

```css
@keyframes rotate {
    0% {
        transform: rotateX(0deg) rotateY(0deg) translateZ(0px);
    }
    50% {
        transform: rotateX(180deg) rotateY(180deg) translateZ(400px);
    }
    100% {
        transform: rotateX(360deg) rotateY(360deg) translateZ(-550px);
    }
}
```

**`@keyframes` 就是"在时间轴上定义关键帧"。** 浏览器会自动计算中间的过渡帧（补间动画）。

### animation：应用动画

```css
.cube {
    /* 四个值的简写 */
    animation: rotate     /* 动画名称——对应 @keyframes */
               3s         /* 动画时长 */
               linear     /* 动画曲线——linear 是匀速 */
               infinite;  /* 循环播放 */
}

/* 完整写法 */
.cube {
    animation-name: rotate;
    animation-duration: 3s;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
}
```

**动画曲线（timing-function）：**

| 值 | 效果 | 使用场景 |
|---|---|---|
| `linear` | 匀速 | 持续旋转、加载动画 |
| `ease` | 慢→快→慢（默认） | 过渡效果 |
| `ease-in` | 慢→快 | 元素进入 |
| `ease-out` | 快→慢 | 元素离开 |
| `ease-in-out` | 慢→快→慢 | 弹窗出现 |

## 四、布局基础：行内与块级

CSS 3D 是"花活"，但页面布局是"基本功"。先搞清楚最基本的：**HTML 元素的两种类型。**

### 行内 vs 块级

```html
<!-- 块级元素 -->
<div>我是块级</div>
<p>我是块级</p>
<ul><li>我是块级</li></ul>

<!-- 行内元素 -->
<span>我是行内</span>
<a>我是行内</a>
<em>我是行内</em>
```

| | 块级（block） | 行内（inline） |
|---|---|---|
| **宽度高度** | ✅ 可以设置 width/height | ❌ 不能设置宽高 |
| **独占一行** | ✅ 独占一行 | ❌ 与兄弟元素共享一行 |
| **典型元素** | div, p, ul, h1-h6, section | span, a, em, strong, img |
| **默认行为** | 宽度 = 父容器 100% | 宽度 = 内容宽度 |

```ASCII
块级元素（block）：
┌──────────────────────────────┐
│ div                          │ ← 独占一行，宽度撑满
└──────────────────────────────┘
┌──────────────────────────────┐
│ 另一个 div                    │ ← 被挤到下一行
└──────────────────────────────┘

行内元素（inline）：
┌────┬──────┬────┐
│span│  a   │ em │ ← 排成一排，不换行
└────┴──────┴────┘
```

### display 属性：手动切换

```css
/* 浏览器默认是块级/行内 → 你可以手动改 */
div  { display: inline;       }  /* 块 → 行内 */
span { display: block;        }  /* 行内 → 块 */
div  { display: inline-block; }  /* 行内块——混合体 */
```

### inline-block：行内块

**可以设置宽高，但不会把兄弟元素挤下去——取其精华。**

```css
.box {
    display: inline-block;
    width: 50%;       /* ✅ 可以设置宽度 */
    background: red;
}
```

```
┌──────────────┬──────────────┐
│      1       │      2       │ ← 排在一行，各自有宽高
└──────────────┴──────────────┘
```

> ⚠️ **inline-block 的天坑**：两个 inline-block 元素之间默认有一个**空格符**（HTML 源码中的换行 `\n\r` 会被渲染为一个空格）。
>
> 解决方案：父元素设 `font-size: 0`，子元素再设回正常字体大小；或者使用 flex 替代。

### 格式化上下文：display 的终极形态

```css
/* 从 block/inline 到格式化上下文 */
.box {
    display: flex;           /* 弹性格式化上下文 */
    display: grid;           /* 网格格式化上下文 */
    display: inline-block;   /* 行内块格式化上下文 */
}
```

```
display 的进化链：

block / inline          ← 浏览器默认
    ↓
inline-block           ← 混合体（有坑）
    ↓
flex / grid            ← 现代布局（推荐）
```

**格式化上下文 = 一组布局规则。** 当你设 `display: flex`，不只是改了一个属性——你开启了一套全新的布局体系。

## 五、Flex 弹性布局

### Flex 的核心：容器与项目

```css
.box {
    display: flex;          /* 开启弹性格式化上下文 */
    flex-direction: row;    /* 主轴方向：row（默认）/ column */
    justify-content: center; /* 主轴对齐 */
    align-items: center;     /* 交叉轴对齐 */
}
```

```ASCII
Flex 的轴模型（flex-direction: row）：

    交叉轴 ↑
           │
    ┌──────┼──────┐
    │      │      │
    │ 项目1 │ 项目2 │ 项目3 │ 项目4 │
    │      │      │
    └──────┴──────┘
           │
           └───────→ 主轴

justify-content → 主轴对齐（行方向）
align-items     → 交叉轴对齐（列方向）
```

**关键认知：父与子的关系变了。** 开启 flex 后，父元素变成了"容器"，子元素变成了"项目"。父元素通过 `justify-content` 和 `align-items` 统一管理所有子元素的位置——你不需要分别设置每个子元素的 margin 了。

### 常用的 Flex 组合

```css
/* 水平垂直居中——最常见的 flex 用法 */
.parent {
    display: flex;
    justify-content: center;  /* 水平居中 */
    align-items: center;      /* 垂直居中 */
}

/* 子元素等分空间 */
.item {
    flex: 1;         /* 每个项目占据等量空间 */
    text-align: center;
}
```

> **`flex: 1` 的含义**：把剩余空间按 1:1:1:... 的比例分配给每个子元素。这是响应式布局最简单的实现方式——不需要算百分比。

## 六、视口单位与全屏布局

CSS3 引入了两个改变游戏规则的单位：

```css
.full-screen {
    height: 100vh;  /* viewport-height：视口高度的 100% */
    width: 100vw;   /* viewport-width：视口宽度的 100% */
}
```

```
视口（viewport）= 浏览器可见区域

┌─────────────────────────────┐
│                             │  ← 100vh
│       浏览器窗口可见区域      │
│                             │
└─────────────────────────────┘
  ←──────── 100vw ──────────→
```

### 为什么用 vh/vw 而不是 %？

```css
/* ❌ % 的问题：需要所有祖先元素都设 height: 100% */
html { height: 100%; }
body { height: 100%; }
.content { height: 100%; }  /* 三级传递才能生效 */

/* ✅ vh：不依赖父元素 */
.content { height: 100vh; }  /* 直接占满视口 */
```

**`vh/vw` 是视口相对单位，不依赖任何父元素。** 移动端适配的利器——无论什么屏幕尺寸，`100vh` 始终等于屏幕高度。

### 经典的"全屏居中"布局

```css
* {
    margin: 0;
    padding: 0;
}

html, body {
    height: 100vh;           /* 撑满视口 */
    display: flex;           /* 开启弹性布局 */
    flex-direction: row;     /* 默认横向 */
    justify-content: center; /* 水平居中 */
    align-items: center;     /* 垂直居中 */
}
```

**flex + vh = 万能居中。** 这个组合可以让你在任何屏幕上把一个盒子放在正中间——移动端、PC 端、大屏都一样。

## 七、定位系统

布局解决"元素怎么排列"，定位解决"元素放在哪"。

### 四种定位模式

| 属性 | 定位参照 | 是否脱离文档流 | 使用场景 |
|------|---------|--------------|---------|
| `relative` | 元素原本的位置 | ❌ 不脱离 | 微调位置、作为 absolute 的参照 |
| `absolute` | 最近的定位祖先 | ✅ 脱离 | 弹出层、下拉菜单、3D 面定位 |
| `fixed` | 浏览器视口 | ✅ 脱离 | 固定导航栏、悬浮按钮 |
| `sticky` | 滚动容器 | ❌ 不脱离 | 吸顶导航、表格固定头 |

```css
/* relative：相对于自己原来的位置偏移 */
.box {
    position: relative;
    top: 10px;    /* 从原来位置向下移 10px */
    left: 20px;   /* 从原来位置向右移 20px */
}

/* absolute：相对于最近的定位祖先 */
.face {
    position: absolute;      /* 所有面叠在同一位置 */
    top: 0; left: 0;
}
/* 然后通过 transform 把每面推到 3D 空间的对应位置 */

/* fixed：钉在屏幕上不动 */
.navbar {
    position: fixed;
    top: 0; left: 0;
    width: 100%;             /* 永远在屏幕顶部 */
}
```

### 定位在 3D 立方体中的应用

```css
.cube {
    position: relative;       /* 父元素：定位参照 */
    transform-style: preserve-3d;
}

.face {
    position: absolute;       /* 子元素：六面叠在同一位置 */
    width: 200px;
    height: 200px;
    /* 每面通过不同的 transform 推到 3D 空间的对应位置 */
}
```

**relative 做容器 + absolute 做子元素 + transform 推到 3D 位置**——这就是 CSS 3D 立方体的核心套路。

## 八、实战：CSS 3D 立方体

现在把所有知识拼起来——手写一个旋转的 3D 立方体。

### HTML 结构

```html
<div class="box-wrap">          <!-- 透视容器 -->
    <div class="box">           <!-- 3D 空间 -->
        <div class="face front">前</div>
        <div class="face back">后</div>
        <div class="face left">左</div>
        <div class="face right">右</div>
        <div class="face top">上</div>
        <div class="face bottom">下</div>
    </div>
</div>
```

### CSS：最外层——设置透视

```css
.box-wrap {
    width: 200px;
    height: 200px;
    perspective: 600px;    /* 🔑 3D 核心：透视距离 */
}
```

### CSS：3D 空间——让子元素在 3D 中渲染

```css
.box {
    width: 100%;
    height: 100%;
    position: relative;              /* 为 absolute 子元素提供定位参照 */
    transform-style: preserve-3d;    /* 🔑 保持 3D 空间 */
    animation: rotate 3s linear infinite;  /* 旋转动画 */
}
```

### CSS：六个面——推到 3D 位置

```css
.face {
    width: 200px;
    height: 200px;
    position: absolute;              /* 六面叠在同一位置 */
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 30px;
    opacity: 0.8;
}

/* 前面：沿 Z 轴向外推 */
.front  { background: #4299e1; transform: translateZ(100px); }

/* 后面：沿 Z 轴向里推 + 翻转 180° */
.back   { background: #f5656f; transform: translateZ(-100px) rotateY(180deg); }

/* 左面：沿 X 轴左移 + Y 轴旋转 */
.left   { background: #9966ff; transform: translateX(-100px) rotateY(90deg); }

/* 右面：沿 X 轴右移 + Y 轴旋转 */
.right  { background: #66ff99; transform: translateX(100px) rotateY(-90deg); }

/* 上面：沿 Y 轴上移 + X 轴旋转 */
.top    { background: #ff9966; transform: translateY(-100px) rotateX(90deg); }

/* 下面：沿 Y 轴下移 + X 轴旋转 */
.bottom { background: #6699ff; transform: translateY(100px) rotateX(-90deg); }
```

```
立方体的六个面是怎么拼起来的：

            [上]
             ↑ translateY(-100px) + rotateX(90deg)
             │
[左] ← ─ ─ [前] ─ ─ → [右]
             │
             ↓ translateY(100px) + rotateX(-90deg)
            [下]
             
          [后]（在背面，translateZ(-100px) + rotateY(180deg)）

每面尺寸：200×200px
translate 偏移：±100px（= 边长的一半 = 中心到面的距离）
```

**关键理解：六面都是 `position: absolute` 叠在同一位置，然后通过 `transform: translateX/Y/Z` 推到立方体的六个面位置。** 200px 宽高的立方体，面从中心向外推 100px（边长的一半）。

### CSS 动画：让它转起来

```css
@keyframes rotate {
    0% {
        transform: rotateX(0deg) rotateY(0deg);
    }
    100% {
        transform: rotateX(360deg) rotateY(360deg);
    }
}
```

**`@keyframes` 定义动画的关键帧，`animation` 把动画绑定到元素上。** 0% 到 100%，浏览器自动计算中间帧——你就看到了一个持续旋转的 3D 立方体。

### 完整的技能组合回顾

这个立方体用到了今天学的**所有知识点**：

```
perspective          → 3D 核心（第二节）
transform-style      → 保持 3D 空间（第二节）
@keyframes + animation → 让立方体旋转（第三节）
transform: translate/rotate → 六个面的定位（第二节）
display: flex + justify-content + align-items → 面内文字居中（第五节）
position: absolute   → 六面叠在同一位置（第七节）
position: relative   → 父元素提供定位参照（第七节）
vh 单位              → 全屏居中（第六节）
```

## 结语

今天从 CSS 3D 到布局原理，系统梳理了前端"看到的东西是怎么排出来的"：

1. **Canvas 3D 能力** —— `getContext('webgl')`，WebGL → Three.js → AI 物理大模型。CSS 3D 是最好的 3D 入门
2. **CSS 3D 核心** —— `perspective`（透视距离）模拟人眼，`transform-style: preserve-3d` 保持 3D 空间，`translateZ/X/Y` + `rotateX/Y/Z` 六个变换函数
3. **CSS 动画** —— `@keyframes` 定义关键帧，`animation` 四个值（名称/时长/曲线/循环），浏览器自动补间
4. **行内 vs 块级** —— block 独占一行可设宽高，inline 共享一行不可设宽高。`display` 手动切换，`inline-block` 取其精华但有空格坑
5. **Flex 弹性布局** —— `display: flex` 开启格式化上下文，`justify-content`（主轴）+ `align-items`（交叉轴），`flex: 1` 等分空间
6. **vh/vw 视口单位** —— 不依赖父元素的 100% 高度，移动端适配利器。flex + vh = 万能居中
7. **定位系统** —— relative（微调/做参照）、absolute（脱离文档流/3D 面定位）、fixed（钉在视口）、sticky（吸顶）
8. **CSS 3D 立方体实战** —— relative 做容器 + absolute 叠面 + transform 推到位 + @keyframes 转起来。200px 立方体，面偏移 ±100px

**从 v026 到 v028 的视觉线：**

```
v026: Canvas 2D          → 像素级图形编程
v027: 算法思维（本期姊妹篇）→ 逻辑级系统思维
v028: CSS 3D + 布局      → 3D 视觉 + 页面骨架
```

v026 让你能"画"出来，v027 让你能"想"清楚，**v028 让你能"排"得整齐——把元素放在该放的位置，把 3D 效果做出来。**

**前端视觉三条腿：Canvas（像素自由） + CSS（布局排版） + WebGL（3D 世界）。** 今天补上了 CSS 和 3D 的基础。为后续 Three.js + AI 物理大模型打下第一根桩。

下篇见。
