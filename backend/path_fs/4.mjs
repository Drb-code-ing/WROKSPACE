import fs from 'fs/promises'
// es6 promise 处理异步业务 es8 async/await
// 回调地狱 无法忍受
// then 链式调用 爬楼梯 也烦
// es8 async/await 解决 语法糖
// 立即执行函数 IIFE
// 异步的，他只是语法糖，不是fs.readFileSync
// await 帮我们实现了流程控制 不需要手动处理then链式
// 同步 -> js单线程，耗时性任务(block) -> 异步(event loop) -> callback(回调) -> 业务复杂(回调地狱) -> promise + then(略显复杂) -> async/await(es8 语法糖) 异步代码同步化(可读性) 本质还是 promise，异步中的微任务
(async () => {
  // console.log('111')
  const file1Data = await fs.readFile('./file1.txt', 'utf-8')
  console.log('file1', file1Data)
  const file2Data = await fs.readFile('./file2.txt', 'utf-8')
  console.log('file2', file2Data)
  const file3Data = await fs.readFile('./file3.txt', 'utf-8')
  console.log('file3', file3Data)
})();


// fs.readFile('./file1.txt', 'utf-8')
  // .then(data => { // 比 callback 优雅
    // console.log('file1', data)
    // promise 实例
    // then 方法返回的还是一个 promise 实例 可以继续调用 then 方法
    // return fs.readFile('./file2.txt', 'utf-8')
  // })
  // .then(data => {
    // console.log('file2', data)
    // return fs.readFile('./file3.txt', 'utf-8')
  // })
  // .then(data => {
    // console.log('file3', data)
  // })
  // .catch(err => {
    // console.log(err)
  // })