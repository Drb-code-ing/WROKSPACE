# JS 同步和异步
## js 有哪些异步任务
 cpu 执行时间 不能霸占，几十毫秒的轮询分配给进程的时间
 进程 董事长 PID process
 线程 经理 TID thread
 主线程 还可以启动子线程

 - c++, java 等系统级别语言有多进程，多线程架构，执行效率高，但是开发复杂度高
 - js 简单，设计为单线程
   setTimeout
   事件
   怎么办？
  
## JS 执行机制(同步异步)
 - 前端 script 或后端 node / bun 代码执行
 - 启动一个进程 PID 负责分配资源
 - 进程启动一个主线程 TID
   js 足够简单 ，设计为单线程
 - 主线程 先把同步代码快速执行
 - 但是还是有定时器，fetch 请求，事件等耗时性异步任务 Async task
 - js 会把他放入到event loop 中跳过，先执行后面的代码，
   等到同步任务完成，再到event loop 中取异步任务，执行

## 如何控制执行流程
 A fetch users api 所有的用户
 B fetch 每一个用户

## 理解 Promise
 - 实例化 Promise
 - 需要传递一个函数，executor 会立即执行，
   是耗时性任务的容器同步，里面可以容纳异步任务，
   会得到resolve 和 reject 两个函数能力
 - resolve 表示异步任务成功解决了
    then  被调用
 - reject 表示异步任务失败了，
    catch 被调用
 - executor 里面的异步任务成功解决或异常时，手动调用
 - resolve(data) 可以传递任意类型的数据，通过 then 接收
 - reject(error) 可以传递失败的原因，通过 catch 接收
