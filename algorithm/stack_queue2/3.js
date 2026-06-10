const queue = []
queue.push("东北大板")
queue.push("可爱多")
queue.push("冰工厂")
queue.push("巧乐兹")

// 出队的代码
while(queue.length) {
  console.log(queue.shift())
}
console.log(queue)// []