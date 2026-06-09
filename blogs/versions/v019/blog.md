# 数组与高阶函数：一个 AI Native 开发者的数据结构启蒙

## 引言

v018 学了 Bun 和 TypeScript，把工具链从 Node.js 升级到了更快的运行时，从弱类型 JS 升级到了类型安全的 TS。还手写了 HTTP 请求调 LLM API——算是把"怎么和 AI 通信"搞明白了。

今天换个方向，补计算机科学的基本功：**数据结构**。

所有程序 = **数据结构 + 算法**。算法是解决问题的步骤，数据结构是数据的存储方式。今天从最基础也最常用的数据结构开始——**数组**。

## 一、数据结构全景图

先搞清楚要学什么。数据结构分两大类：

### 线性结构（列表）

| 数据结构 | 特点 | JS 里怎么用 |
|----------|------|------------|
| **数组** | 连续内存，索引访问 O(1) | 原生支持，最常用 |
| **链表** | 不连续内存，节点指针串联 | 无原生，需自己实现 |
| **栈** | 后进先出（LIFO） | 数组模拟（push/pop） |
| **队列** | 先进先出（FIFO） | 数组模拟（push/shift） |

### 非线性结构

- **树**（特别是二叉树）：DOM 树、文件系统、LLM 的向量搜索都基于树结构

**学习策略：** 面向 JavaScript、面向面试、面向 LeetCode Hot 100。不要急于刷题——先把每种数据结构在 JS 里怎么用搞明白。

## 二、数组的本质：连续内存 + 索引偏移

数组为什么快？因为它的内存布局决定了访问效率。

```
内存地址:  0x1000  0x1004  0x1008  0x100C  0x1010
数组元素:  [  1  ][  2  ][  3  ][  4  ][  5  ]
索引:        0      1      2      3      4
```

**访问 arr[3] 的过程：**
- 起始地址 + 偏移量（索引 × 每个元素大小）
- 即 `0x1000 + 3 × 4 = 0x100C`
- 一次计算，直接命中——这就是 O(1) 的原因

**JS 的数组更灵活：** 不强求每一项类型一致，也不限制 length。但底层依然是连续存储空间——这就是 **ADT（抽象数据类型）** 的概念：特定的存储结构 + 特定的访问方式。

## 三、数组的创建与增删方法

### 创建数组

```javascript
// 字面量
const arr = [1, 2, 3, 4, 5]

// 构造函数
const arr2 = new Array(7)        // [empty × 7]，7个空位
console.log(arr2[0])             // undefined

const arr3 = new Array(7).fill(1) // [1, 1, 1, 1, 1, 1, 1]
```

**empty 和 undefined 的区别：**
- `new Array(7)` 创建的是 7 个空位（empty），这个位置还没有被占据，不属于任何类型
- 但访问 `arr[0]` 返回的是 `undefined`
- `fill(1)` 会把所有空位填成 1

### push / pop / shift / unshift

这四种方法都是**修改原数组**的——不是纯函数：

```javascript
const arr = []
arr.push(1)       // 尾部添加 → 返回新长度 1
arr.push(2)       // 尾部添加 → 返回新长度 2
arr.unshift(3)    // 头部添加 → 返回新长度 3，arr 变成 [3, 1, 2]
arr.pop()         // 尾部删除 → 返回删除的元素 2
arr.shift()       // 头部删除 → 返回删除的元素 3
```

| 方法 | 位置 | 操作 | 返回值 | 纯函数？ |
|------|------|------|--------|----------|
| `push` | 尾部 | 添加 | 新数组长度 | ❌ |
| `pop` | 尾部 | 删除 | 被删元素 | ❌ |
| `unshift` | 头部 | 添加 | 新数组长度 | ❌ |
| `shift` | 头部 | 删除 | 被删元素 | ❌ |

**纯函数**：不修改原数据，同样的输入永远得到同样的输出。map、filter 是纯函数，push/pop 不是。

## 四、数组遍历：三种方式的选择

### for 循环 —— 命令式，性能最好

```javascript
for (let i = 0; i < arr.length; i++) {
  console.log(arr[i])
}
```

优点：性能最高（无函数调用开销），能用 break/continue
缺点：可读性低，像"机器语言"

### for...of —— 声明式，语义清晰

```javascript
for (const item of arr) {
  console.log(item)
}
```

优点：语义好，读起来像"对于数组中的每一项"
缺点：拿不到索引（除非用 `entries()`）

### forEach —— 函数式，功能最强

```javascript
arr.forEach((item, index, self) => {
  console.log(item, index, self)
})
```

优点：同时拿到 item、index、原数组三个参数
缺点：**不能 break / continue**（函数调用栈开销，return 只退出当前回调）

### 怎么选？

| 场景 | 推荐 |
|------|------|
| 追求极致性能 | `for` |
| 简单遍历 | `for...of` |
| 需要 index + item | `forEach` |
| 需要 break / continue | `for` 或 `for...of` |

## 五、高阶函数：map、filter、some、every

**高阶函数**：接收函数作为参数，或者返回一个函数的函数。数组的 map、filter、some、every 都是高阶函数。

### map —— 映射，纯函数

```javascript
const arr = [6, 8, 12, 15]
const newArr = arr.map((item) => item * 2)
console.log(newArr)  // [12, 16, 24, 30]
console.log(arr)     // [6, 8, 12, 15] ← 原数组不变！
```

map 是纯函数——不修改原数组，返回全新数组。这是函数式编程的核心思想。

### filter —— 筛选

```javascript
arr.filter((item) => item % 2 === 0)  // [6, 8, 12]
```

返回条件为 true 的元素组成的新数组。

### some —— 存在性检查

```javascript
arr.some((item) => item % 2 === 0)  // true（至少有一个偶数）
```

### every —— 全量检查

```javascript
arr.every((item) => item % 2 === 0) // false（不是所有都是偶数）
```

### reduce —— 归并

```javascript
arr.reduce((prev, curr) => prev + curr, 0) // 41（求和）
```

map、filter、some、every 底层都是基于 forEach 实现的。高阶函数让代码从"怎么做"变成"做什么"。

## 六、二维数组与引用陷阱

LLM 的向量矩阵、图像处理、游戏地图——二维数组到处都是。

### 创建二维数组的错误方式

```javascript
// ❌ 错误！所有行指向同一个数组引用
const arr = new Array(7).fill([])
arr[0][0] = 1  // 所有 arr[i][0] 都变成了 1！
```

**为什么？** `fill([])` 里的 `[]` 是引用类型——fill 传的是同一个对象的引用。7 行共享同一个数组。

### 正确方式

```javascript
// 方式1：for 循环逐行创建
const arr = new Array(7)
for (let i = 0; i < arr.length; i++) {
  arr[i] = []
}

// 方式2：Array.from + 箭头函数（更优雅）
const arr2 = Array.from({ length: 7 }, () => Array(6).fill(0))
```

`Array.from` 的第二个参数是一个 map 函数——每一行都调用一次箭头函数，返回一个**全新的**数组。这才是正确的二维数组。

## 七、原型链小窥

顺便验证了一下 Array 的原型链：

```javascript
Array.prototype.constructor === Array                    // true
Array.prototype.__proto__ === Object.prototype          // true
Array.prototype.__proto__.constructor === Object        // true
Array.prototype.__proto__.__proto__ === null            // true（原型链终点）
```

数组方法（push、map、filter...）都在 `Array.prototype` 上。这跟 v016 学的原型链完全对得上——数组 → Array.prototype → Object.prototype → null。

## 结语

今天从零开始搭建数据结构的认知框架：

1. **数据结构全景** —— 数组、链表、栈、队列、树，以及"面向 JS + 面试"的学习策略
2. **数组本质** —— 连续内存 + 索引偏移，ADT 抽象数据类型
3. **增删方法** —— push/pop/shift/unshift，都会修改原数组（不是纯函数）
4. **遍历方式** —— for（性能）、for...of（语义）、forEach（功能），各有适用场景
5. **高阶函数** —— map/filter/some/every，纯函数 + 函数式编程思想
6. **二维数组** —— `fill([])` 的引用陷阱，`Array.from` 的正确姿势

数据结构是大厂面试的必考项，也是写高效代码的基础。**数组是第一块积木，后面还有栈、队列、链表、树——一个一个来。**

下篇见。
