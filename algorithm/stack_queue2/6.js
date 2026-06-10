let arr = [10, 2, 5]
// 一定要传比较函数，否则按ASCII码排序
arr.sort((a, b) => a - b)
console.log(arr)
