// 表示空 没有
// null
// primitive 原始 内存空间固定
// 拷贝式赋值
let a = null
let b = a// 拷贝 复印机
b = 2
let obj = {name: "Alice"}
let obj2 = obj// 引用式 复制的是地址
obj2.company = "快手"// 改变的是 obj2 指向的内存空间, obj 也会改变
console.log(a, b)
console.log(obj, obj2)

// let obj1 = {
  // name: "Alice",
  // address: null
// }
// console.log(obj1.address)// null
// console.log(obj1.age)// undefined

let largeObject = {
  data: new Array(10000000).fill("hgh")
}
// 手动释放内存
largeObject = null