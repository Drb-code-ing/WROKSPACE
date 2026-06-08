// 如何封装一个sleep 函数? 2000?

async function sleep(ms) {
  // await 后面接受一个 Promise 对象
  // es6 新增的语法，提供解决异步的api 许下诺言
  await new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms)
  })
}
sleep(2000).then(() => {
  console.log('2秒后执行')
})
