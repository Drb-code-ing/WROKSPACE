# 流式输出 Streamable
 
 一次性返回的， 等待，等很久
    复杂的计算，推理生成，耗时挺久，让人等的不耐烦
    如何优化？一个一个token 推理生成，实时的展示？
    不用一次性都给，
    api，计算机网络协议层去理解
    chatbot 客户端 不断的拼接token，流式输出就成了
    水流，llm 服务器和chatbot 客户端两端接根管子，
    生成的token 就像水流一样不断流向客户端
 llm chatbot 像打字机一样流式输出，体验很好
 前端工程师来说有点复杂，AI 产品的第一个关键用户体验

## 耗时
 主要是推理所花费的时间（transform）和问题复杂度（难度和长度）

## 约定
 - 服务器端约定 接受 stream: true  token生成就输出时
 - 客户端 发送 stream: true 表示流式输出

## 使用流式（Streaming）传输减少等待时间
 用户体验的打造，前端的责任，必考内容，AI 产品的核心体验

 - vite 前端前端项目中集成 deepseek apikey?
     vite 会帮我们读取.env.local
     vite 是脚手架，node 后端

## VUE 基础
 - .vue 文件
    文件，也叫组件文件 component
    facebook 网页有一万多个compont 组成
    组件是组成网页的最小单位
    方便封装，复用，维护
    ## 封装三部分
     - template 模板 html是静态的，模版是动态的
       一段HTML，可以绑定数据，可以响应式更新
     - script js 逻辑
       引入vue/react  {{}} .vue ref/reactive
       count  setup vue3 新增的语法糖，支持宏指令，宏函数
       把script 全局数据直接可以被template 绑定使用
     - style 样式