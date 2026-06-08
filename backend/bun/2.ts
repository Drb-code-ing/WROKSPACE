function add(a: number, b: number): number {// 返回类型约束
  return a + b
}
// js 足够简单
// 大型项目，需要类型约束
let a = 1
let b = '2'
console.log(add(1, 2))
add(1, parseInt(b))// api
add(1, Number(b))// 强类型转换
add(a, +b)// 隐式类型转换
