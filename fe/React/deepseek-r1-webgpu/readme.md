# deepseek-r1-webgpu

简历中的超燃项目， 将覆盖以下技能
## 端侧模型
有别于OpenAI\DeesSeek API 调用， llm 在远程，和调用客户端不在一起。
- 贵
- 不安全 
  context 会随着请求发送到服务器， 服务器会将 context 保存在数据库中， 服务器可以被攻击， 导致 context 泄露。

ollama 本地开源模型部署，在用户端，端侧模型
手机端，汽车端，Agent 任务 划分的
开源小参数模型就能完成这些任务
浏览器端，随时下载，随时使用
webgpu

## React + TS
AI 时代的大模型首选前端技术
- react 比vue 难入门
- 大型项目

## 创建项目
react + ts + eslint(代码约束，大公司必备，代码风格一致)
'' "" ; eslint 负责约束代码风格规范

## tailwindcss
几乎不在需要写css，原子css 类

## react 组件
搭积木方式搭建页面，是由一组html, css, js混合在一起，成为一个组件，一个功能单元
vue template, script style 三明治 一个文件vue 好入门react? 封装一个组件(函数)

## tailwind 运行原理
- 不是原生css
- 原子类csss框架，提供一堆css 类名（原子类）
- 不用写css了，选择器，css rules 太低效了。
- vite 插件就可以使用，将我们申明的类名 ， 它的样式，都写在 tailwindcss 配置文件中。
- 原子内容(英文单词)，简单，语义化很好，特别适合自然语义编程
  如果说以前的css 选择器，rules(key:value)，太底层，太低效 二进制
  写类名就好，tailwindcss 已经成为vibe UI的基本构成

  - className ?
    类名class
    class 是js 的类名(OOP)关键字，函数里面写JSX，所以不能用class，会被理解为你要声明一个js类

  - JSX
    JSX 是 Reaxt 专用语法(模版)，能在JS 代码里直接写HTML 标签，编译后转为原生DOM 操作
    react 最为骄傲的一大特性之一，非常方便表达UI 界面
    javascript with xml
    <div></div> html 特有的XML

## React 合成事件
- onClick 最原始的 DOM 0 级事件监听
  html, css, js 三剑客 不要耦合在一起 模块化分离
- DOM 1 ?
  DOM n ? html 标准的执行迭代
  DOM 1 这个版本没有更新事件相关，不存在DOM 1 事件
- addEventListener DOM 2 级事件监听
- 同一个dom 元素可以多次监听同一事件
- react 代码洁癖 能不发明新概念就不
  @ 事件绑定 ... vue
  react 直接用已在的概念
  onClick 作为高手没有学习成本
- react 里面的事件并不是原生事件，是合成事件

## 封装进度条组件
比较独立的，可复用的业务模块
把它单独抽离出来，作为组件

## 组件树
- 代替DOM 树
- 基于组件封装，组件树
  一眼看出页面的组件构成
  页面的组件化程度，粒度
  前端发展的必然
  页面及交付越来越复杂，组件作为最小开发单元
  团队好协作，好复用，好维护