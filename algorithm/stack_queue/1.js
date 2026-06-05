/* 函数表达式
 * 类 MyQueue
 * 早期的js 没有类，通过函数 + prototype 实现面向对象
 * 函数 + prototype 更优秀
 * 类？抽象 一套方法 + 方法的模版
*/
const MyQueue = function () {
  // 构造函数，属性
  console.log('实例化', this)
  // this.x = 1
  this.stack1 = []
  this.stack2 = []
}
MyQueue.prototype.push = function () {
  console.log('push 方法')
}

// new 运算符 this 指向实例对象
const queue = new MyQueue()
console.log(queue)
queue.push()
