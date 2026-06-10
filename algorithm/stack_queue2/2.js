// peek 查看栈顶元素
const stack = []// 空栈
stack.push("东北大板")
stack.push("可爱多")
stack.push("冰工厂")
stack.push("巧乐兹")

// 出栈的代码
while(stack.length) {
  console.log(stack.pop())
}
console.log(stack)// []
