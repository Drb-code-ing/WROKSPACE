# es6 变量声明

  JavaScript 蹭了一波java 的热度，是弱类型语言。早期设计用来给网页添加交互(幻灯片),
  DOM 编程。
  JS 是以Escript 为语言标准的语言
  ES6 是JS 的一个新版本， ES5, ES6+
  2015年发布，企业级大型项目开发发展
  早期，JS 是一个KPI项目 一周就开发出来，有很多问题。

## 声明变量并赋值
  - var es5 不用了
  - let es6 新增，块级作用域
  - const es6 新增，常量，不能重新赋值

## 作用域 scope
### 作用域嵌套
  - 全局作用域 global scope
  - 函数局部作用域 local scope
       - 局部作用域
  - 块级作用域 block scope {  }
    变量属于作用域，
    变量声明，JS 弱类型，他的类型由值确定。
    - 查找变量的规则
      1. 先查找当前作用域
        找到了，直接拿到值
      2. 如果没有找到，向外层作用域查找，
        冒泡查找
      3. 当在全局作用域都没有找到，停下，报错。
    - 函数/代码块运行后，启动垃圾回收机制，释放内存。
      - 内存角度 变量的声明
        在内存中申请了一块区域，用来存储变量的值。
        之后，销毁函数，回收内存。
        变量的生命周期
    
    - Assignment to constant variable.
    - ReferenceError: dog is not defined

  ### var let const 区别
    早期，JS 使用var 声明变量，没有常量，用代码规范约束
    var PI = 3.1415926
    var CHATMODEL = "gpt-3.5-turbo"
    var 不支持块级作用域

    js 设计的时候比较赶工 浏览器的副产品(世界首富)
    JS 没有经过深思熟虑，有一些瑕疵
    es6 后
    let 变量，const 常量 支持块级作用域
    const : constant variable 不可变变量

  ## for + setTimeout
   var 不支持块级作用域，只有一个 i
   同步代码i 变成10，所以setTimeout 打印都是10
   let 支持块级作用域，嵌套着n个局部作用域
   setTimeout 打印的是当前循环的i

   const 声明时就要赋值，let 可以分开
   简单数据类型不可以重新赋值
   复杂数据类型可以重新赋值，类型不能改变

   ## 变量的提升 hoisting
   - 代码先有编译阶段
      准备执行上下文
      pizza = undefined
   - 再有执行阶段
   - 不好的东西
     和代码顺序，直觉不符合，避免使用变量提升
     4.js中：
     ReferenceError: Cannot access 'dog' before initialization
     let 不支持变量提升
