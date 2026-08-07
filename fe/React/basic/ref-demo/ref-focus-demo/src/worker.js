// web worker 独立线程计算
// 不可以做DOM api
console.log('worker 线程启动')
// self 关键字
self.onmessage = (e) => {
  console.log('worker 线程收到主线程发送的消息:', e.data)
  let sum = 0
  for (let i = 0; i < 500000000; i++) {
    sum += e.data.num * i
  }
  self.postMessage({
    result: sum
  })
}