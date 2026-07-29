# React + Typesrcipt
- React + ts 非常适合企业级开发
- ts 提供了类型约束、静态编译、大型语言的丰富功能

## React 的类型约束
- React.FC
react 函数组件的类型，
() => void () => ReactNode
react 本身就是用ts写的

- Hello 组件, 向某人打招呼
  React.FC<Props> 父子之间props 声明 数据约束ts 出现
  FC<T> 泛型 泛指内部的类型，props 的类型传参
  interface 申明

  type FC<P = {}> = FunctionComponent<P> react源码
  FunctionComponent 函数组件类的申明 返回一定是ReactElement
  type 类型别名 FC 简短一些
  type FC<P = {}> 默认值为{} 如果你传了，用传递的类型参数来约束
  ts 里type 和interface 都可以用于申明类型
  但组件需要满足props 中的属性或自定义方法，接口用来定义对象需要满足的属性和方法Interface

  - interface 自定义事件
  - 函数的类型申明 (e:) => void | ReactNode
  - React 合成事件 看过去像原生事件
    React.ChangeEvent<> 泛型内部的需要用到的类型，事件最重要的事件发生的元素

- 组件升级
  - 组件通信 单向数据流
    父组件负责持有状态和修改状态的方法
    props 属性+自定义事件 传给子组件
    多个组件共享状态
  - 子组件
    如果不需要共享的，子组件的私有状态
    React.ChangeEvent<HTMLInputElement> 复杂性放到了内部

- useEffect
  - 副作用
    在组件挂载(mounted)后，在去请求接口，拿到数据，响应式更新
    满足组件即刻挂载，快(第一步)，更新状态(第二步)

- 版本的变迁
  1. 把子组件的event 对象 传给父组件 导致两边都要做ReactEvent.ChangeEvent<HTMLInputElement>
     影响了父组件的可读性，父组件原来的使命 持有状态和修改状态，让子组件共享
     单向数据流 父子们组件通信state 交给父组件，props 传给子组件们，应用状态正确的前提，法律
  2. 子组件中添加私有的状态 editingName  onChange 自己修改
     提交给父组件时只需要给值就好
  3. 将私有状态提升到父组件，通过props 传过来，onChange 修改editingName
     子组件没有状态，性能会更好，只负责展示
     UI = fn(props)
     子组件职责非常单一，就是负责显示

## useEffect
副作用 hook
生命周期
- 挂载后执行
- 每次依赖项变化后执行
- 组件卸载前执行
- 依赖项为空数组时，只在挂载后执行一次