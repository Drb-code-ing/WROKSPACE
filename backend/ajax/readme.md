# Ajax 

## Json.stringify(value, replace?, space?)
 - 将对象序列化为json 字符串，便于网络传输
 - replace 取舍? null 表示原样序列化
 - space 空格数，团队规范，可读性好

## JS 异步处理
 - js 是单线程，遇到异步任务放到event loop 中跳过执行
 - 等到执行时机，event loop里面拿出回调函数执行。callback
 - 也可以使用Promise + then 等异步处理机制
 - 最建议使用async/await 处理异步任务，比上面的回调函数更简洁，看起来更像同步代码