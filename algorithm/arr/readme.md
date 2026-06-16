# 需要掌握的数据结构

## 列表
 - 数组
   很多语言内置的数据结构
 - 链表
 - 栈
 - 队列
 - 树
   二叉树

## 怎么学习复习数据结构
 面向JavaScript
 面向面试
 hot 100

 - 需要注意的问题
   不要急于做题，要迁移语言

## 数组
 开箱即用，JS更灵活
 没有强调每一项类型一致，也不需要限制length
 - 内存地址
 起始地址 + 偏移量

## 数组的创建
 - ADT 的认识
   连续的存储空间 + 特定的访问方式
 - push pop shift unshift
     修改了原数组 破坏了原来的数组 以下方法都不是纯函数
     纯函数：
   - push 返回新数组的长度
   - pop 移除了数组的最后一个元素
   - shift 移除了数组的第一个元素
   - unshift 在数组的第一个位置插入一个或多个元素, 返回新数组的长度

 - new Array(7)
   创建一个长度为7的数组，数组的每一项都是undefined
   console.log(new Array(7))// [empty x 7]
   empty 表示空位，说明数组的这个位置还没有被占据，不属于任何类型
   arr[0] 是 undefined
   - new Array(7).fill(1) 创建一个长度为7的数组，数组的每一项都是1

## 数组的访问
 arr[0] // 索引，下标访问
 - for
   机器化 命令式 缺点是可读性低
   优点是性能高
 - for of
   语义化 函数式
 - forEach
   入调用栈 执行上下文 等开销，
   不能 break continue
   优点是功能强大
 - map、filter、some、every
   都是基于forEach 实现的，
   map 是一个高阶函数
   是一个纯函数
   返回一个新的新数组，数组的每一项都是原数组的每一项的处理结果
   高阶函数：一个函数作为参数，或者返回一个函数

   filter 筛选 结果为true，留下
   some 有一个为true，返回true
   every 所有都为true，返回true

## 二维数组
 矩阵 llm 向量矩阵

 new Array(7).fill([])
 这里的fill的[] 是引用类型，fill 传的是一个对象，所有数组的每一项都是同一个对象的引用
