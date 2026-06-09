// promise es6 用来处理异步任务控制的最佳时机
const p = new Promise((resolve, reject) => {// 许诺言
  console.log('许诺')
  // 异步任务
  setTimeout(() => {
    resolve(666)// 可以传递任意类型的数据，通过 then 接收
    // reject("网络错误")// 耗时性的异步任务，执行失败，调用 reject 方法
  }, 2000)
})
console.log(p.__proto__)
// then 是 promise 的实例方法，resolve执行完后，then 才会执行
p.then((data) => {
  console.log('end', data)
}).catch((error) => {
  console.log('失败了', error)
}).finally(() => {
  console.log('finally')
})
