let a// 未初始化 undefined
console.log(a)
let obj = {}// 不存在的属性
console.log(obj.prototype)
function noReturn() {
  
}
noReturn()// 没有返回值

let arr = [1, 2, 3]
console.log(arr[3])// 不存在的数组索引
