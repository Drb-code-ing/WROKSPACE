# 浏览历史
## 路由 Route
- navigate 对象
- 浏览器 url
  - url 浏览器 访问代理
  - http 协议 server 发起请求
  - server 伺服状态 给予响应 text/html
  - 浏览器拿到响应数据并且渲染页面
  - 浏览历史插入一条记录

## 链接
万物互联靠的是链接
<a href="">跳转</a>
多了点什么？
传统的，每次都得渲染整个页面  PC时代
慢，没有必要重新渲染整个页面
移动时代，APP的体验是不一样的
单页应用 Single Page Application
SPA

传统多页面 每次都需要重新渲染
移动端时代有点没必要 页面会白一下(网速慢一点)

访问体验上提升
怎么把丰富的内容在一个网页里显示？
DOM 编程？
根据相应的url
/ index.html  content DOM 放到
#container
/about about.html content DOM 放到
#container

## 单页应用
- 点击链接跳转
  - url 和资源一一对应关系
  不只是DOM 编程
  怎么改变url
  hash 方式可以做到
  改变hash ，url 改变了，不会跳转

## Hash 路由
http(s)://www.baidu.com/u/123?a=1&b=2#/page1
protocol   host         path      queryString
url 中 hash 部分 # 开始
- url 一定要变，不同的url 对应不同的资源
- 监听变化 根据hash 部分 渲染不同内容
优点是url 改变了(局部)，页面不会重新刷新
锚链接
hash 作为url 一部分，标记传统的PC 长页面某一部分，坐电梯一样直达
做前端路由  #/  #/about 不会重新渲染，又能满足url和资源的一一对应关系，前端路由
当hash 部分改变时，会触发hash change 事件，dom 或组件替换