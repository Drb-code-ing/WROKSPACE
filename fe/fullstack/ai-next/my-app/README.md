1. 文件系统的路由映射
   page.tsx
   layout.tsx 布局，共享的
   loading.tsx 加载UI
   not-found.tsx 404 页面
   error.tsx 错误UI

2. 目录映射 目录名直接映射到URL 路径

3. Link 组件
   - 它是客户端导航，无需刷新页面(前端路由)
     Hash, HistoryRouter 局部刷新
     还是要请求后端的，只是不整页刷新(白一下)
     前端导航时，next.js 会自动发一个RSC payload(React Server Component 序列化)，
     数据是后端拿的，只是走Ajax 请求，不是浏览器传统的整页导航
    
   - 预加载可连接的页面，提升速度
     <link data-n-head="ssr" rel="dns-prefetch" href="/about" />
     浏览器空闲时就会提前下载目标页的数据，“秒开”
     dns domain system  key:value 分布式数据库
     domain -> ip 查询(电信服务商)，解析时间