// RxJS 就是一套用来优雅管理各种异步数据流的工具
// 网络请求(文本流)、定时器(setTimeout, setInterval), 事件流(mousemove)
import { from, pipe, map } from 'rxjs'; // 从可迭代对象创建 Observable 观察流式处理的对象
// 可迭代表示多次执行
// 可观察的流
const stream = from([1, 2, 3]); // rxjs 把数组变成流式处理的对象
console.log(stream);
// 订阅流
stream.subscribe(v => console.log(v));
// 执行一系列操作
stream
  .pipe(
    map(v => v * 2)
  )
  .pipe(
    map(v => v * v)
  )
  .subscribe(v => console.log(v));