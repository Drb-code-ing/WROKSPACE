# HTML5 Canvas 与数据可视化：一个 AI Native 开发者的图形编程初体验

## 引言

v025 用 Vite + fetch 调通了 Qwen 多模态生图 API——那是站在前端工程化的肩膀上调用 AI 能力。

今天换个维度：**从"文本/接口"的世界走进"视觉/图形"的世界。** 用 HTML5 Canvas 在浏览器里画图、做动画、写游戏、搞数据可视化。

为什么学这个？因为 AI Native 开发者不只是调 API —— **把 AI 生成的内容以视觉化的方式呈现给用户，是完整产品体验的关键一环。** 图生成了就要展示，数据分析了就要可视化，交互复杂了就要 Canvas 来画。

今天从 Canvas 零基础开始，一路做到一个完整的打飞机游戏和一个 ECharts 数据报表。

```
v023 ──→ v024 ──→ v025 ──→ v026 今天
后端API   HTTP底层   前端+AI    图形/视觉
                         │
              文本世界 ──→ 视觉世界
```

## 一、Canvas 是什么？

### canvas 标签：浏览器里的画布

```html
<canvas id="myCanvas" width="600" height="400"
  style="border: 1px solid #333;">
  您的浏览器不支持 canvas 标签。
</canvas>
```

`<canvas>` 就是一个 HTML 标签，和 `<div>`、`<p>` 没本质区别。但它提供了一个**像素级的绘图表面**——你想画什么就画什么，不受 DOM 树限制。

> **canvas 标签之间的文字是降级内容**——只有老到不支持 Canvas 的浏览器才会显示。现代浏览器（IE9+）都支持。

### 获取绘制上下文

```javascript
const canvas = document.getElementById('myCanvas')
const ctx = canvas.getContext('2d')
```

**`getContext('2d')` 是 Canvas 编程的入口。** 拿到 `ctx`（CanvasRenderingContext2D）后，所有绘制操作都通过它。

```javascript
// 2D 上下文 → 2D 游戏、数据可视化、图表
const ctx2d = canvas.getContext('2d')

// 3D 上下文 → WebGL → Three.js → 3D 游戏、AI 物理模拟
const ctx3d = canvas.getContext('webgl')
```

> **AI 游戏时代的关键点**：Three.js + 物理大模型（AI 驱动的物理引擎）正在爆发。Canvas 的 3D 能力（WebGL）是这一波浪潮的基础。今天先学 2D，为后面的 3D 打基础。

### Canvas 的编程范式

```
DOM 编程                          Canvas 编程
┌──────────────┐              ┌──────────────┐
│ <div>Hello   │              │ ctx.fillText  │
│ <button>     │    vs.      │ ctx.fillRect  │
│ 操作 DOM 树  │              │ ctx.drawImage │
│ 声明式       │              │ 命令式         │
└──────────────┘              └──────────────┘

DOM = 声明式 ——你告诉 HTML "这里有一个按钮"
Canvas = 命令式 ——你告诉画笔 "在这画一个矩形"
```

**Canvas 就像一块真正的画布，JS 是你的画笔。** 没有任何预置的组件，一切都需要你用代码画出来。坏处是麻烦，好处是自由——你想画什么都能画。

## 二、Canvas 基础绘制：在画布上"画"东西

### 三个最基础的 API

```javascript
const canvas = document.getElementById('myCanvas')
const ctx = canvas.getContext('2d')

// 1. 填充矩形
ctx.fillStyle = '#4299e1'      // 先选颜色
ctx.fillRect(20, 20, 100, 80)  // 再画：x, y, 宽, 高

// 2. 描边矩形
ctx.strokeStyle = '#f56565'    // 边框颜色
ctx.lineWidth = 4               // 边框粗细
ctx.strokeRect(150, 20, 100, 80)

// 3. 清除矩形（橡皮擦）
ctx.clearRect(50, 50, 40, 30)  // 擦掉一块区域
```

运行效果：

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  ┌──────────┐    ┌──────────┐                   │
│  │  蓝色    │    │  红色    │                   │
│  │  填充    │    │  描边    │                   │
│  │  □□□□□□  │    │  ┌────┐  │                   │
│  │  □ 擦 □  │    │  │    │  │                   │
│  │  □□□□□□  │    │  └────┘  │                   │
│  └──────────┘    └──────────┘                   │
│                                                  │
└──────────────────────────────────────────────────┘
```

**关键认知：Canvas 的坐标系统以左上角为原点。**

```
(0,0) ────────────→ x
  │
  │    (x, y)
  │     ┌────────┐
  │     │        │ height
  │     └────────┘
  │       width
  ▼
  y
```

### 更多绘制 API

Canvas 的 2D API 非常丰富：

| API | 作用 | 示例 |
|-----|------|------|
| `fillRect(x, y, w, h)` | 填充矩形 | `ctx.fillRect(20, 20, 100, 80)` |
| `strokeRect(x, y, w, h)` | 描边矩形 | `ctx.strokeRect(150, 20, 100, 80)` |
| `clearRect(x, y, w, h)` | 清除矩形 | `ctx.clearRect(50, 50, 40, 30)` |
| `fillText(text, x, y)` | 填充文字 | `ctx.fillText('Hello', 50, 50)` |
| `arc(x, y, r, start, end)` | 画弧/圆 | `ctx.arc(100, 100, 50, 0, Math.PI * 2)` |
| `beginPath()` / `closePath()` | 路径开始/关闭 | 配合 `moveTo`/`lineTo` 画任意形状 |
| `moveTo(x, y)` | 移动画笔 | 路径起点 |
| `lineTo(x, y)` | 画线 | 从当前点到目标点 |
| `drawImage(img, x, y)` | 绘制图片 | 把 Image 对象画到 Canvas 上 |

**一句话：Canvas 的 API 就是"在什么位置用什么颜色画什么形状"。** 记住这个心智模型，你就能查着文档画出任何东西。

## 三、帧动画：让画面动起来

画静态图只是第一步。真正的魅力在于**让画面动起来**——游戏、动画、数据可视化都需要这个能力。

### 为什么不能用 setInterval？

```javascript
// ❌ 不推荐：setInterval 和屏幕刷新率不同步
setInterval(() => {
  // 画下一帧
}, 16) // 约 60fps，但不精确

// ✅ 推荐：requestAnimationFrame
function animate() {
  // 画下一帧
  requestAnimationFrame(animate)  // 递归调用，由浏览器调度
}
animate()
```

**`requestAnimationFrame` 由浏览器根据显示器的刷新率自动调度**（通常 60Hz = 每秒 60 帧）。它比 `setInterval` 的优势：

| | setInterval | requestAnimationFrame |
|---|---|---|
| **调度精度** | JS 事件循环中的宏任务，不准 | 浏览器在重绘前调用，精确同步 |
| **后台标签页** | 继续执行，浪费资源 | 自动暂停，切回来恢复 |
| **掉帧处理** | 可能掉帧或堆积 | 浏览器自动处理 |
| **性能** | 一般 | 最优——浏览器做了大量优化 |

### 帧动画的核心模式：clear → draw

```javascript
let x = 20
const y = 20
const speed = 3

function animate() {
    // 第一步：擦掉上一帧
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 第二步：画当前帧
    ctx.fillStyle = '#4299e1'
    ctx.fillRect(x, y, 100, 80)

    // 第三步：更新状态（下一帧的位置）
    x += speed
    if (x > canvas.width) {
        x = -100  // 超出画面后从左边重新出现
    }

    // 第四步：请求下一帧
    requestAnimationFrame(animate)
}
animate()
```

```ASCII
帧动画 = 擦掉旧画面 + 画新画面 + 更新位置 + 循环

  帧1: [■          ]  擦掉 → 画在x=20
  帧2: [  ■        ]  擦掉 → 画在x=23
  帧3: [    ■      ]  擦掉 → 画在x=26
  ...
  帧N: [          ■]  超出右边界 → x=-100，从左重新来
```

> **人眼的视觉暂留效应**：当帧率 ≥ 24fps 时，人眼看到的不是一帧帧静态图，而是连续的运动。电影是 24fps，游戏通常 60fps——Canvas 动画利用的就是这个原理。

**这个 clear → draw 循环是所有 Canvas 游戏和动画的基石。** 你今天看到的那个打飞机游戏，底层就是这个循环的反复执行。

## 四、打飞机游戏：从零到一

搞懂了基础的绘制和帧动画，现在把它们用在实战里——写一个完整的打飞机游戏。

### 项目初始化

和 v025 一样，用 Vite 开局：

```bash
npm init vite   # 选 vanilla 模板
```

拿到项目骨架后，不用写 HTML——整个游戏都在 Canvas 上画。

### 游戏架构

```
游戏循环 (requestAnimationFrame)
    │
    ├── update(dt)   更新逻辑——位置、碰撞、状态
    │   ├── 玩家移动（键盘输入）
    │   ├── 射击（空格键）
    │   ├── 子弹移动
    │   ├── 敌机生成 + 移动 + 射击
    │   ├── 碰撞检测（子弹 vs 敌机、敌弹 vs 玩家、敌机 vs 玩家）
    │   ├── 粒子更新
    │   └── 升级检查
    │
    └── render()     绘制——把当前状态画到 Canvas 上
        ├── 背景（星空）
        ├── 粒子
        ├── 敌弹
        ├── 玩家子弹
        ├── 敌机（侦察机/战斗机/重装机/Boss）
        ├── 玩家
        ├── 飘字
        ├── HUD（分数/等级/技能/进度条）
        └── 游戏结束画面
```

**游戏本质就是一个死循环：update → render → update → render → ...** 每秒跑 60 次，玩家的操作改变 update 的计算结果，render 把最新状态画出来——你就看到了"游戏"。

### 核心实现：玩家

```javascript
const player = { w: 40, h: 48, x: W / 2 - 20, y: H - 80 }

// 键盘输入
const keys = {}
window.addEventListener('keydown', e => { keys[e.code] = true })
window.addEventListener('keyup',   e => { keys[e.code] = false })

// update 中处理移动
function update(dt) {
    const spd = cfg.speed
    if (keys['ArrowLeft'])  player.x -= spd * dt
    if (keys['ArrowRight']) player.x += spd * dt
    if (keys['ArrowUp'])    player.y -= spd * dt
    if (keys['ArrowDown'])  player.y += spd * dt

    // 边界限制
    player.x = Math.max(0, Math.min(W - player.w, player.x))
    player.y = Math.max(0, Math.min(H - player.h, player.y))
}
```

**`dt`（delta time，帧间隔）是关键。** 不同设备帧率不同（60fps 的 `dt` ≈ 0.016s，120fps 的 `dt` ≈ 0.008s），如果直接写 `x += 5`，高刷屏上速度会翻倍。**`x += speed * dt` 保证在不同帧率下移动速度一致。**

### 核心实现：子弹与碰撞

```javascript
// 射击
function shoot() {
    const cfg = getCfg()
    const cx = player.x + player.w / 2  // 子弹从玩家中心发出
    bullets.push({ x: cx - 2, y: player.y, w: 4, h: 14 })
}

// 碰撞检测：两个矩形是否重叠
function rectsCollide(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x
        && a.y < b.y + b.h && a.y + a.h > b.y
}

// 碰撞检测应用：玩家子弹 vs 敌机
for (let i = bullets.length - 1; i >= 0; i--) {
    for (let j = enemies.length - 1; j >= 0; j--) {
        if (rectsCollide(bullets[i], enemies[j])) {
            bullets.splice(i, 1)        // 子弹消失
            enemies[j].hp--             // 敌机扣血
            if (enemies[j].hp <= 0) {
                score += enemies[j].score  // 加分
                enemies.splice(j, 1)       // 敌机死亡
            }
            break
        }
    }
}
```

**碰撞检测的本质就是检查两个矩形的坐标范围是否有交集。** 这个朴实无华的 `rectsCollide` 函数驱动了整个游戏的核心交互——子弹打中敌机、敌弹打中玩家、敌机撞上玩家，全用它判断。

> **数组倒序遍历（`i--`）**：在遍历过程中删除元素时，必须从后往前遍历。从前往后删会导致索引错乱，漏掉元素。

## 五、敌兵种与 Boss 设计

一个只有一种敌人的射击游戏玩两分钟就腻了。多种敌兵种 + Boss 才能造出"有层次感"的战斗体验。

### 四种敌兵种

```javascript
const enemyTypes = {
    scout:   { name: '侦察机', w: 24, speed: 快, hp: 1, canShoot: false },
    fighter: { name: '战斗机', w: 34, speed: 中, hp: 1, canShoot: Lv3+ },
    tank:    { name: '重装机', w: 44, speed: 慢, hp: 2-4, canShoot: true },
    boss:    { name: 'BOSS',   w: 72, speed: 很慢, hp: 18-50, canShoot: 高密度 },
}
```

**生成策略随等级变化：**

```
Lv1-2: 65% 侦察机 + 30% 战斗机 + 5% 重装机
Lv3-4: 35% 侦察机 + 40% 战斗机 + 25% 重装机
Lv5:   20% 侦察机 + 35% 战斗机 + 45% 重装机
```

等级越高，低级兵比例越低，高级兵越多。**难度曲线不是靠"堆数量"而是靠"换兵种"——这才是好的难度设计。**

### Boss 的两阶段行为

```javascript
// Boss 阶段切换
if (e._phase === 0) {
    // 阶段0：进场——从屏幕上方慢慢飞入
    e.y += e.speed * dt
    if (e.y >= 60) { e._phase = 1; e.y = 60 }
} else {
    // 阶段1：战斗——左右横移 + 扇形弹幕
    e.x += e._moveDir * e._moveSpeed * dt
    // 碰到边界就反弹
    if (e.x <= 0) e._moveDir = 1
    if (e.x >= W - e.w) e._moveDir = -1
}
```

**Boss 的扇形弹幕**比普通敌机的直射复杂得多：

```javascript
// Boss: 5-7 发扇形弹幕
const spread = 5  // 5 发子弹
const step = 0.35  // 相邻两发之间的角度差
for (let i = 0; i < spread; i++) {
    const angle = Math.PI / 2 + (-(spread - 1) / 2 + i) * step
    enemyBullets.push({
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
    })
}
```

```
         Boss
          │
    ← ← ← ┼ → → →   扇形扩散
          │
          ▼
```

**Boss 击杀奖励**：炸弹 +1、护盾 5 秒。让玩家有动力打 Boss，形成"风险与回报"的正向循环。

## 五、升级与技能系统：让游戏有"成长感"

如果打来打去玩家角色没有变化，那是街机时代的设计。现代游戏需要**成长系统**——让玩家感受到自己在变强。

### 五级升级配置

```javascript
const LEVEL_CONFIG = [
    { score: 0,    name: '初级', bullets: 1, cooldown: 0.28, speed: 340 },
    { score: 150,  name: '进阶', bullets: 2, cooldown: 0.24, speed: 400 },
    { score: 400,  name: '精英', bullets: 3, cooldown: 0.19, speed: 460 },
    { score: 800,  name: '王牌', bullets: 5, cooldown: 0.14, speed: 530 },
    { score: 1500, name: '传说', bullets: 7, cooldown: 0.09, speed: 620 },
]
```

**分数门槛拉大、数据线性增长**——玩家从 1 发子弹升到 7 发，射击间隔从 0.28s 缩短到 0.09s，速度从 340 涨到 620。每升一级，战斗力都有明显提升。

### 技能系统

| 技能 | 触发方式 | 效果 |
|------|----------|------|
| 🛡 护盾 | 击杀 Boss / Lv3+ 升级时自动获得 | 5 秒无敌，可以撞敌机 |
| 💣 炸弹 | 击杀 Boss + 升级时 +1 | 全屏清敌，清除所有敌弹 |

**护盾的设计很精妙**：护盾不仅能挡子弹，还能**撞死敌机**——但撞一次护盾就消失。这给玩家一个战术选择：是安全地避开还是主动撞击换分。

### HUD 信息展示

```
┌──────────────────────────────────────────┐
│ 分数: 1250     🛡 3.2s  💣 ×2 [B]       │
│ Lv.4 王牌 | 击杀: 47                      │
│ [████████░░] 80% → 传说                   │
│                                          │
│                                          │
│                                          │
│                                          │
│ 方向键移动 | 空格射击 | B 炸弹            │
└──────────────────────────────────────────┘
```

HUD 让玩家随时知道自己"在哪、有多强、下一步目标是什么"。**一个好的 HUD = 玩家不需要记忆任何游戏状态。**

## 七、数据可视化：从 Canvas 到 ECharts

Canvas 能做游戏，也能做图表——但手写图表的渲染逻辑太累了。ECharts 把 Canvas 封装成了声明式的图表库。

### ECharts 的编程模式

```javascript
import * as echarts from 'echarts'

// 1. 初始化
const chartDom = document.getElementById('chart')
const myChart = echarts.init(chartDom)

// 2. 配置 option（声明式——告诉 ECharts "我要什么"，不用管"怎么画"）
const option = {
    title: { text: '销售额' },
    xAxis: { type: 'category', data: ['1月', '2月', /*...*/] },
    yAxis: { type: 'value' },
    series: [{
        type: 'bar',
        data: [18.2, 14.5, /*...*/],
        itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#667eea' },
                { offset: 1, color: '#764ba2' },
            ]),
        },
    }],
}

// 3. 应用配置
myChart.setOption(option)
```

```
Canvas 原生                        ECharts
┌──────────────────┐          ┌──────────────────┐
│ ctx.fillRect()   │          │ option = {       │
│ ctx.stroke()     │   vs.    │   series: [{     │
│ ctx.fillText()   │          │     type: 'bar'  │
│ ...              │          │   }]             │
│ 命令式           │          │ }                │
│ 你想怎么画就怎么画│          │ 声明式——告诉它   │
│                  │          │ "我要什么"       │
└──────────────────┘          └──────────────────┘
```

**Canvas 是画笔，ECharts 是打印机。** 画笔给你无限自由但代价是每个像素都要自己画；打印机给你模板但你调几个参数就能出成品。

### 数据驱动图表

```javascript
// data.js —— 数据和视图分离
const salesData = [
    { month: '1月',  sales: 18.2 },
    { month: '2月',  sales: 14.5 },
    // ...
]
export { salesData }

// main.js —— 用数据渲染图表
import { salesData } from './data.js'
const months = salesData.map(d => d.month)
const values = salesData.map(d => d.sales)
```

**数据和视图分离**——换一组数据就能生成不同的图表，不用改渲染逻辑。这就是 v006 里学的模块化思想在数据可视化中的实际应用。

### 关键配置解读

| 配置项 | 作用 | 关键点 |
|--------|------|--------|
| `title` | 图表标题 | `left: 'center'` 居中 |
| `tooltip` | 鼠标悬停提示框 | `trigger: 'axis'` 触发方式 |
| `grid` | 图表边距 | `containLabel: true` 自动预留标签空间 |
| `xAxis` / `yAxis` | 坐标轴 | `type: 'category'` 类目轴 vs `'value'` 数值轴 |
| `series` | 数据系列 | `type: 'bar'` 柱状图，`itemStyle` 控制样式 |
| `emphasis` | 高亮态样式 | 鼠标悬停时柱子变色 |

### 响应式

```javascript
window.addEventListener('resize', () => myChart.resize())
```

一行代码搞定图表随窗口大小自适应。

## 八、Canvas vs ECharts vs 游戏引擎：什么时候用什么？

| | Canvas 原生 | ECharts | 游戏引擎（如 Phaser） |
|---|---|---|---|
| **抽象层级** | 低——你控制每个像素 | 高——声明式配置 | 中——提供游戏框架 |
| **自由度** | 最高 | 低——局限于预置图表类型 | 高——但受引擎架构约束 |
| **学习成本** | 中——API 量大但概念简单 | 低——看懂 option 配置就行 | 高——要学引擎的抽象 |
| **适用场景** | 自绘组件、特效、简单游戏 | 数据报表、Dashboard | 复杂游戏 |
| **性能** | 取决于你的代码 | ECharts 高度优化 | 引擎帮你优化 |

**选择建议：**

```
要做报表展示数据？        → ECharts（调 option 就完事了）
要做独特的视觉效果？      → Canvas 原生（自由发挥）
要做复杂游戏？            → 游戏引擎（别用 Canvas 裸写碰撞检测和物理）
要做简单的 2D 互动？      → Canvas 原生（杀鸡不用牛刀）
```

**今天的打飞机游戏属于"简单 2D 互动"范畴——用 Canvas 原生写刚好。** 如果是做大型 RPG 或平台跳跃游戏，就该上 Phaser 了。

## 结语

今天从零开始进入了前端图形编程的世界：

1. **Canvas 基础** —— `<canvas>` 标签 + `getContext('2d')` 拿到画笔。`fillRect`/`strokeRect`/`clearRect` 三个基础 API 就能画东西
2. **帧动画** —— `requestAnimationFrame` 替代 `setInterval`，clear → draw 循环是所有 Canvas 动画和游戏的基石。`dt`（帧间隔）保证不同帧率下速度一致
3. **打飞机游戏** —— 游戏循环 = update + render 跑 60fps。键盘输入驱动玩家移动，碰撞检测驱动战斗交互，粒子系统增加视觉反馈
4. **敌兵种与 Boss** —— 四种敌兵种 + 等级渐进的生成策略，Boss 两阶段行为（进场→战斗）搭配扇形弹幕，击败奖励形成正向循环
5. **升级与技能系统** —— 五级配置驱动属性线性增长，护盾和炸弹提供战术深度，HUD 展示完整游戏状态
6. **ECharts 数据可视化** —— 声明式 option 配置替代命令式 Canvas API，数据和视图分离，响应式适配一行代码
7. **技术选型** —— Canvas 原生（自由但手写）vs ECharts（方便但受限）vs 游戏引擎（强大但学习成本高），根据场景选对工具

**从 v023 到今天的 AI 全栈版图扩展：**

```
后端线              前端线                    AI 线              视觉线
│                   │                        │                   │
├── v023: RESTful   ├── v024: AJAX/HTTP      ├── v018: LLM调用   │
├── v024: HTTP底层  ├── v025: Vite工程化     ├── v025: 多模态AI  │
│                   │                        │                   │
│                   ├── v026: Canvas 图形 ←── 今天新增！          │
│                   │                                              │
└───────────────────┴──────────────────────────────────────────────┘
```

v023/v024 搞清楚数据怎么在后端和前端之间流动，v025 用 Vite + fetch 把 AI 能力接进来，**今天用 Canvas 把数据和交互以视觉化的方式呈现出来——数据 → AI → 视觉，完整的产品链路。**

**AI Native 开发者的技能版图又扩展了一个维度：不只是写逻辑，还要能把东西画出来。** 图形编程是 AI 时代最被低估的能力——AI 生成的图片要展示、分析的数据要可视化、交互要 Canvas 渲染。这三个场景的终点都是图形能力。

会用 + 理解 + 能画出来 = AI Native 开发者。

下篇见。
