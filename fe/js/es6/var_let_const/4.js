// 执行顺序
// 编译阶段 检测代码语法
// 准备好执行上下文(变量环境)
// 执行阶段
console.log(pizza)// undefined
var pizza = 'Deep Dish'
console.log(dog)// ReferenceError: dog is not defined
let dog = 'Pug'// let 不支持变量提升