# react 常用hooks
## useState
  响应式状态
## useEffect
  副作用
## useRef
  可变对象
  - 可变，但是不会触发组件重新渲染
  - 绑定DOM 对象
    react 不直接操作DOM
    万一需要呢？

## DOM 编程
- js在v8引擎
- dom在渲染引擎
js里做DOM编程非常耗费性能
- react vue 之前 原生js 做DOM编程 
- react vue 新框架
直接规避dom编程，不需要dom编程，react框架帮我们做
useState 数据绑定+响应式编程
前端开发方式直接改变

## 如果非要去dom？
不是不可以做DOM 编程
而是交给react
如果DOM useRef 来了
- useRef 申明一个可变对象 null
- jsx dom ref 属性绑定
current 属性指向dom 节点对象
- useEffect
- 和useState 相同的和区别点
  都可以改变
  useState 聚焦数据业务状态
  useRef DOM 对象引用等...

## 总结定义
useRef 是react 一个提供持久可变对象的hook 函数，经常用来引用DOM 节点对象
它有一个current 属性，可以指向任何值或对象，不会触发渲染

## js ? 单线程
做一些前端交互，脚本工作，简单，显示和操作的页面，一致性，不能出问题
js如果是多线程可能会有冲突

页面复杂起来，有很多任务要干，耗时任务， event loop js 执行机制
异步无阻塞，不要卡在这里，前端要尽快去响应用户交互(滚动屏幕、点击...)

llm 游戏，非界面的页面逻辑，很耗费计算时间，event loop 异步搞不定
用worker 线程，接下更耗时、复杂的任务，浏览器独立开辟的内存，
进行复杂计算，完成后告知主线程（消息机制）