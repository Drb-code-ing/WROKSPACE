// 同步代码，单线程，js 如此
// 执行效率，多线程 3个线程分别申明a,b,c 并发
// 2步 3个线程 分别执行a,b,c 再分别执行console.log
let a = 1
let b = 2
let c = 3
console.log(a + b + c)