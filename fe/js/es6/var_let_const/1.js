// global scope 全局作用域
var height = 1000
// 局部作用域 
function setWidth() {
  // 局部作用于变量
  var width = 5
  console.log(width, height)
}

setWidth()

var age = 12
if(age >= 12) {
  // 块级作用域
  // const es6 新增的常量 不可以改变的
  const dog = age * 7
  // let es6 新增的变量
  let cat = age * 5
  console.log(dog, cat)
}