# 栈、队列与原型链：一个 AI Native 开发者的 JavaScript 底层探索

## 引言

v015 学了 HTTP 请求和前后端通信——fetch、async/await、API 调用。今天切换方向，回到更底层的东西：**数据结构和 JavaScript 的面向对象机制。**

学习笔记来自 `algorithm/stack_queue/readme.md`，内容围绕栈、队列和 JS 原型链展开。

v015 是"网络通信层"，v016 是"语言底层"。看似不相关，但有一个共同点：**不管用什么框架、什么平台，底层都是语言和数据结构在支撑。** HTTP 请求很重要，但理解 JavaScript 的底层设计，才能写出真正高效的代码。

## 一、线性数据结构：栈和队列

数据结构分为线性和非线性：

- **线性**：栈、队列、链表
- **非线性**：树

### 栈（Stack）

栈是 **FILO（后进先出）** 的数据结构。

生活类比：叠盘子。最后放上去的盘子，最先被拿走。

```javascript
const stack = []
stack.push(1)  // 入栈
stack.push(2)
stack.push(3)
stack.pop()    // 出栈，返回 3（最后入栈的最先出）
```

### 队列（Queue）

队列是 **FIFO（先进先出）** 的数据结构。

生活类比：排队买奶茶。先排的人先拿到奶茶。

基本操作：
- `push(x)`：将元素放入队列尾部
- `pop()`：从队列头部移除元素
- `peek()`：返回队列头部元素
- `empty()`：返回队列是否为空

## 二、用栈模拟队列

一个经典的算法题：**用两个栈实现队列。**

核心思想：
- 栈1 负责入队（push）
- 栈2 负责出队（pop）
- 当栈2 为空时，把栈1 的元素全部倒入栈2

这样就实现了队列的 FIFO 特性。

## 三、JavaScript 的面向对象：不走寻常路

学完数据结构，转向 JavaScript 的面向对象。JS 的面向对象和其他语言不太一样——**不需要 class 也可以实现面向对象。**

### 函数是一等对象

```javascript
function greeting() {
  console.log('hello world')
}
greeting.a = 1  // 函数可以有属性

greeting()      // 调用函数
console.log(greeting.a)  // 访问属性，输出 1
```

函数本质上也是对象，可以像普通对象一样添加属性。

### this 指向

- **普通函数调用**：this 指向全局对象（window）
- **new + 构造函数调用**：this 指向新创建的对象

```javascript
function Greeting(name) {
  console.log('实例化', this)  // this 指向新创建的对象
  this.name = name
  console.log('hello ' + this.name)
}
```

## 四、new 运算符的执行过程

`new` 运算符做了三件事：

1. **创建一个空对象**，this 指向这个新对象
2. **构造函数执行**，this 上添加属性，实例就有了这些属性
3. **构造函数有 prototype 属性**，指向原型对象，原型对象上的方法，实例也可以使用

```javascript
function Greeting(name) {
  this.name = name
}
Greeting.prototype.say = function() {
  console.log(`我叫${this.name}, 很高兴认识你`)
}

const drb = new Greeting('drb')
drb.say()  // 输出：我叫drb, 很高兴认识你
```

`new Greeting('drb')` 的过程：
1. 创建空对象 `{}`
2. 执行 `Greeting` 函数，`this.name = 'drb'`
3. 对象有了 `name` 属性和 `say` 方法（来自 prototype）

## 五、原型式面向对象

JS 没有类，只有对象。这是 JS 面向对象的核心。

### 原型链

```javascript
function Person(name, age) {
  this.name = name
  this.age = age
}
Person.prototype.poem = '仁义礼智信'
Person.prototype.say = function() {
  console.log(`我叫${this.name}, 我今年${this.age}岁`)
}

const Drb = new Person('Drb', 18)
console.log(Drb.toString())  // 没有这个方法，沿原型链向上查找，直到 Object
```

**原型链查找规则：**
- 实例对象有 `__proto__` 属性，指向原型对象
- 先在自己身上查找属性
- 没有再沿原型链查找
- 直到 Object 最顶层（终点是 null）
- 任何对象，要么直接是 Object.prototype，要么终点前是 Object.prototype

## 六、JS 的设计哲学

理解了原型链，就理解了 JS 的设计哲学：

- **一切皆对象，没有类**
- **Object 是顶层对象**
- Function、Array、Date、RegExp 等都是函数对象
- `let obj = {}` 等价于 `new Object()`
- 原型链是 JS 继承的核心机制

## 结语

今天学了三件事：
1. **栈和队列**是基础数据结构，栈 FILO，队列 FIFO
2. **JS 面向对象**基于原型而非类，函数是一等对象
3. **原型链**是 JS 的核心设计，理解它才能真正理解 JavaScript

v015 学了 HTTP 通信（网络层），v016 学了数据结构和语言底层。从"会用 API"到"理解语言本质"，这是 AI Native 开发者的必经之路。

下篇见。
