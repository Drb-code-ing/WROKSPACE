// js数组内存一定连续吗？不一定

const arr = [1, 2, 3, 4]// js 当数组处理
// 每个元素的类型不一样，不连续，连续也没有意义
// arr2[2] 任然可以访问到元素 hashTable 来计算索引
const arr2 = ['haha', 1, {a:1}]// 不那么数组了
console.log(arr2[2])