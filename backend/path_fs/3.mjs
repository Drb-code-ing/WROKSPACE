// fs FileSystem 是文件系统模块，用于操作文件和目录
import fs from 'fs'// 没加 不直接启用/promise
// I/O 操作 可异步，可同步 readFileSync 同步阻塞线程的执行
// 简单粗暴，性能问题差一点 同步
// js 单线程，充斥着异步 高性能解决方案
// node 和前端环境不一样 可异步(node 的优势)，可同步
// node 异步无阻塞 省很多服务器
// node c++ 写出来的(fs，path暴露给js代码)，封装了v8 引擎(解析 js)
const syncData = fs.readFileSync('text.txt', 'utf-8')
console.log(syncData)
// 异步  跳过执行后面的 将回调函数放入事件循环event loop
// 控制流程
// es6 之前老办法 回调函数
// 回调函数处理异步有缺陷，es6 promise.then 解决
// 回调地狱
// fs.readFile('./text.txt', 'utf-8', (err, data) => {
  // node 第一个参数是err 错误对象
  // if(!err) {
    // console.log(data)
  // } else {
    // console.log(err)
  // }
// })
// console.log('111')

// 先读取file1.txt 再读取file2.txt 最后读取file3.txt
// js 异步业务 流程越来越复杂，callback 太麻烦了，产生了回调地狱
fs.readFile('./file1.txt', 'utf-8', (err, data) => {
  if(!err) {
    console.log('file1', data)
    fs.readFile('./file2.txt', 'utf-8', (err, data) => {
      if(!err) {
        console.log('file2', data)
        fs.readFile('./file3.txt', 'utf-8', (err, data) => {
          if(!err) {
            console.log('file3', data)
          } else {
            console.log(err)
          }
        })
      } else {
        console.log(err)
      }
    })
  } else {
    console.log(err)
  }
})