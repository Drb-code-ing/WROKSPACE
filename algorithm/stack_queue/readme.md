# 如何用栈模拟队列
 线性
   栈、队列、链表
 非线性
   树
 - 栈 stack
   FILO 后进先出
 - 队列 queue
   FIFO 先进先出
 push(x) 将一个元素放入队列的尾部
 pop() 从队列的头部移除一个元素
 peek() 返回队列的头部元素
 empty() 返回队列是否为空

## JS 的面向对象
 - 不走寻常路
   不需要class 也可以实现面向对象
   函数是一等对象
   普通函数 调用
     this 指向 全局对象(window)
   new + 构造函数 调用
     this 指向新创建的对象
     new+ 构造函数运行时，this 指向不断地完成对象属性的创建
   
   原型式的面向对象：
     js 没有类，只有对象 如：MyQueue 对象
     MyQueue.prototype 也是一个对象

## new 的过程
 - 创建一个空对象，this 指向新创建的对象
 - 构造函数执行，this 上添加属性，实例也就有了这些属性
 - 构造函数有一个prototype 属性，指向原型对象
   原型对象上有的方法，实例也就有了这些方法

## JS 设计哲学
 - 一切皆对象，没有类
 - Object 是顶层对象
   按照原型式的面向对象来设计
   Object() 函数对象
   Object.prototype 是原型对象
   let obj = {} new Object() 也是创建一个空对象
   Function、Array、Date、RegExp 等都是函数对象
   下一站 Object 原型链
 
 - 实例对象有__proto__ 属性，指向原型对象
 - 沿着原型链查找属性，直到Object 最顶层 终点是null
 - 任何函数有prototype 属性，指向原型对象，负责给实例提供共享方法
 - 原型对象上有constructor 属性，指向构造函数，负责创建实例
 - 实例先在自己身上查找属性，没有再沿原型链查找
 - 任何对象，要么直接是Object.prototype，要么终点前是Object.prototype
