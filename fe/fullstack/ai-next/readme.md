# Next.js + AI

基于React的全栈开发框架，最好的AI 全栈框架，为全栈开发叠加了上下文buf

## 什么是框架？ Framework ？
想象成为一个建筑蓝图/工具箱，不需要从零开始盖房子
而是提供了地基、墙壁和屋顶的一个基本架构
以前是为开发者所用，现在是为AI所用
我们只需要关注组长和装修这个房子，关注业务

## js和React
返回jsx 格式，响应式状态
把开发者从低级的前端API 命令式流水线编程，
通过现代前端库React/Vue MVVM，直接写业务就好
const [count, setCount] = useState(0);
<>
  {count}
  onClick={setCount(count++)}
</>

## Next.js 基于React 最好的面向AI的全栈框架
AI 上下文 = 组件 + 响应式业务 + 服务器端渲染 + api
不使用框架：散乱的积木和工具
- 图片放哪里？ /public
- 页面文件放哪里？ /app
- 组件放哪里？ /components
使用框架 预制的乐高积木 提供了一系列的约束最佳实践，和AI SDD 文档上下文不谋而合

开发效率大大提高，常见功能内置好，文件放在哪里，请求方法放哪？
框架通过基础结构，开发者专注**业务**逻辑。AI FDE harness 落地
使用框架，也给AI 一套约束，一套上下文。AI 能够更高效的根据框架给的约束开发项目

## 为什么选择Next.js
- 传统的前后端全栈开发
  react + Java/Python 两种语言，上下文切换成本
- claude code/codex 支持最好
  约束、简化(csr, ssr) 开箱即用
- 生态超级丰富
  - shadcn/ui
    ElementUI ANTD ...
    vibe coding 写组件，引入组件
  - tailwindcss
    原子类名，自带语义，特别适合AI 学习
    AI 语义理解能力
  - vercel 公司
    全球唯一一家JS 栈  AI coding Agent 以及AI生态的技术公司
    快捷发布 域名二级，绑定域名

## 创建项目