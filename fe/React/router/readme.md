# 路由
- restful 一切皆资源
- 前端路由负责切换页面
  以前是要后端路由支持，传统，慢，会白一下，体验不好
  前后端分离、SPA hashRouter
  hash 锚链接 改变url hash部分，不会刷新页面
  hashchange 事件

## React 集成前端路由
react 开发全家桶
- react 组件开发，响应式，UI界面等
- react-router-dom 给应用添加路由(前端) SPA
- zustand pinia 状态管理
  hashRouter

## 各种路由
- 基本配置
- 路由懒加载
  首页/页面加载速度
- 动态路由
- 404 NotFound
- 嵌套路由
- 鉴权路由
  - http 无状态的
  - 有状态？
    - 请求头 token Authorization
    - Cookie
    - localStorage 存储 login 状态
    user  admin
    password  123456
- 组件内部的子组件
  props.children 拿到组件申明的内部所有的子节点
  model 弹窗组件   mask 蒙层
  窗体 头部，尾部 主体部分children 传入
  定制性
  <Modal>
    {children 定制}
  </Modal>

## 路由对象
- SPA 需要前端路由
- url 改变，对应不同的资源 restful 设计理念
  hash #/pay  browserRouter history
- navigate 导航栏
- location 地址栏
- history 历史记录
- Link 组件
  to
  replace