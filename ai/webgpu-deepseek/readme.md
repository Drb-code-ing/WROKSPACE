# webgpu-deepseek
## huggingface
AI 圈最火的开源模型社区，各个厂商吧AI 模型发布到这里
modelscope

transform.js
web 访问 id 远程下载，访问 并执行nlp任务

deepseek-r1-distill-qwen 1.5B 文件上传(GB) -> huggingface
-> transform.js -> load -> web 下载到浏览器本地(慢) -> 浏览器缓存
-> webgpu(新特性，兼容性) -> 执行nlp任务

## 安装依赖
- @huggingface/transformers
  js 版本的transformers 库，用于加载模型，执行推理
- marked
  aigc 返回的是markdown 格式，有利于在文本中表示一定格式，比如代码，加粗，引用等等
  显示到页面前需要把md 格式转换成html 格式，才能在浏览器中格式

更简洁
#<h1></h1>

## 引入webworker
个人介绍，聊下自己的项目的webgpu-deepseek

## !!(navigator as any).gpu
navigator.gpu 报错，比较新，实验阶段的属性 ts 没有很好的识别navigator 类
ts 的理解和学习
navigator as any
as 类型断言
any ts 的原生类型 任意类型 不要乱用，会泛滥

用别的方式？
### ts 类型检测底层
ts 有专门的类型声明文件，@types/webgpu 本质是缺失的类型声明文件
npm install -D @webgpu/types 开发依赖期间依赖
开发阶段用ts 代码打包后是js 代码

tsconfig.app.json  typescript 配置文件 根据项目需求做各种配置
types 配置 安装的类型文件

## 设计模式
OOP 面向对象编程，总结出来的23种解决特定问题的模式
数据结构，ADT
面向设计，而不是实现 Design Pattern
### 单例模式
类只实例化一次 全局只有一个实例
用于解决全局变量问题，以及全局状态问题

## load
- 空值合并运算符 ??=
  用于在变量未定义或为 null 或 undefined 时，赋值
  如果为false或其他值，不赋值
  避免重复赋值，保持变量原始值。AutoTokenizer.from_pretrained
  开销比较大
- web 异步下载
  AutoTokenizer.from_pretrained  Promise
  文件比较大，文件的chunk 慢慢到达，提供一个process_callback 获取下载进度
  AutoModelForCausalLM.from_pretrained  Promise
  Promise.all([])