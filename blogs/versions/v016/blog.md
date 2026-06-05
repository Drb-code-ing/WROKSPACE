# 栈、队列与原型链：一个 AI Native 开发者的 JavaScript 底层探索

## 引言

v015 学了 HTTP 请求和前后端通信——fetch、async/await、API 调用。今天切换方向，回到更底层的东西：**数据结构、JavaScript 的面向对象机制，以及 JS 代码的执行过程。**

学习笔记来自两个地方：
- `algorithm/stack_queue/readme.md`——栈、队列和 JS 原型链
- `fe/js/runway/readme.md`——JS 执行机制（执行上下文、调用栈、编译过程）

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

**原型链的完整关系：**
- 任何函数有 `prototype` 属性，指向原型对象，负责给实例提供共享方法
- 原型对象上有 `constructor` 属性，指向构造函数，负责创建实例
- 实例先在自己身上查找属性，没有再沿原型链查找

## 六、JS 的执行机制：代码是怎么跑起来的

理解了对象和原型链之后，下一个问题是：**JavaScript 的代码到底是怎么执行的？**

### 执行上下文对象

JS 引擎在执行代码之前，会先进行编译，生成一个 **执行上下文对象**。这个对象包含三个部分：

| 组成部分 | 存放内容 |
|---------|---------|
| **变量环境** | `function`、`var` 声明的变量 |
| **词法环境** | `let`、`const` 声明的变量 |
| **执行的代码** | 从上到下，顺序执行 |

这三者共同构成一个执行上下文对象。

### 调用栈（Call Stack）

V8 引擎用 **调用栈** 来管理函数间的调用关系。

```javascript
function foo() {
  console.log('foo')
  bar()
}
function bar() {
  console.log('bar')
}
foo()
```

调用栈的变化过程：
1. 全局代码执行 → 全局执行上下文入栈
2. `foo()` 被调用 → foo 的执行上下文入栈
3. foo 中调用 `bar()` → bar 的执行上下文入栈
4. bar 执行完毕 → bar 的执行上下文出栈
5. foo 执行完毕 → foo 的执行上下文出栈
6. 全局执行完毕 → 全局执行上下文出栈

**关键规则：**
- 编译总在执行前一刻发生
- 全局和函数体的编译会生成执行上下文对象，存入调用栈
- 当一个函数执行完毕后，执行上下文会被弹出调用栈销毁
- 栈顶指针指向当前执行的执行上下文对象

### 编译的过程

JS 是先编译再执行的。编译阶段做了四件事：

1. **创建执行上下文对象**
2. **找形参和变量声明**，将形参和声明的变量名作为 key，值设为 `undefined`
3. **统一形参和实参的值**（全局没有这个操作）
4. **找函数声明**，将函数名作为 key，值设为函数对象

这就是 JavaScript **变量提升（hoisting）** 的本质：

```javascript
console.log(a)  // undefined（不是报错！）
var a = 10

console.log(b)  // 报错：Cannot access 'b' before initialization
let b = 20
```

`var a` 在编译阶段被提升，值为 `undefined`；而 `let b` 虽然也被编译阶段识别，但进入了 **暂时性死区（Temporal Dead Zone）**，在声明之前访问会报错。

### let、const 与块级作用域

`let` 和 `const` 的出现是为了解决 `var` 的历史遗留问题：

```javascript
// var 的问题：没有块级作用域
for (var i = 0; i < 3; i++) {}
console.log(i)  // 3（泄露到外部）

// let 的解决方案：块级作用域
for (let j = 0; j < 3; j++) {}
console.log(j)  // 报错：j is not defined
```

**let/const 的特点：**
- 词法环境支持块级作用域，仍然使用栈管理不同作用域的变量
- 不能重复声明
- 不会变量提升（严格来说是提升但进入暂时性死区）
- 会进入暂时性死区（Dead Zone）

一句话总结：**`let` 和 `const` 就是来给 `var` 的 bug 擦屁股的。**

### 执行流程总结

```
读取代码 → 编译 → 执行
```

整个过程可以用一张图理解：

```
源代码
  ↓
编译阶段（创建执行上下文）
  ├── 变量环境：var、function
  ├── 词法环境：let、const
  └── 形参统一
  ↓
执行阶段（顺序执行）
  ↓
调用栈管理（函数调用入栈，执行完出栈）
```

## 七、JS 的设计哲学

理解了原型链和执行机制，就理解了 JS 的设计哲学：

- **一切皆对象，没有类**
- **Object 是顶层对象**
- Function、Array、Date、RegExp 等都是函数对象
- `let obj = {}` 等价于 `new Object()`
- 原型链是 JS 继承的核心机制
- JS 是先编译再执行的语言
- 执行上下文 + 调用栈 是代码运行的基础框架

## 结语

今天学了四件事：
1. **栈和队列**是基础数据结构，栈 FILO，队列 FIFO
2. **JS 面向对象**基于原型而非类，函数是一等对象
3. **原型链**是 JS 的核心设计，理解它才能真正理解 JavaScript
4. **JS 执行机制**——执行上下文、调用栈、编译过程、let/const 的块级作用域

v015 学了 HTTP 通信（网络层），v016 学了数据结构、原型链和执行机制（语言底层）。从"会用 API"到"理解语言本质"，这是 AI Native 开发者的必经之路。

下篇见。
