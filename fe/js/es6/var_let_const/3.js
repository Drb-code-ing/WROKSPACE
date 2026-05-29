// 常量，一开始就要赋值
const key = 'abc123'
let a // undefined
let points = 50
points = 51
// let 不止是值可以改变，类型也可以改变
// 不要这么干
points = "52"// 不好的
let winner = false
winner = '戴'
// 复杂数据类型，对象
// 值可以改变，但是类型不能改变
const person = {
  name: '张三',
  age: 18
}
person.age++
console.log(person)