# 全栈项目部署全流程
- 运维
加分项
-vercel 云端部署
- 比较固定
nextjs supabase 项目
java ， go ， python 部署自由度
-国内支持
腾讯云

## 使命
-理解部署全流程
- nginx 用**宝塔面板**搭建生产环境
- 前后端分离项目
    -react + ts 产出？
    组件，
    npm run dev
    npm run build dist/静态资源文件
    -node
      /api 接口 json 

## 部署全流程
- 得花钱买服务器
  35， 
- 买域名，备案 10-20 天
- 配置HTTPS 更安全的http ssl
-nginx
- 反向代理
  前后端 api 通信？
  跨域？
  不存在
  ：5173  /api/todos vite 配置 mocks 拦截/api todos
  前端发送请求， vite 基础设施 拦截？
  ：5173 /api/todos  nginx ？ 拦截前端请求 反向代理 server
-服务器安全      

## 购买服务器
轻量云服务器， linux
全量的liunx 部署，命令行成本高，难度
宝塔（BT Panel），是一套服务器管理面板
可视化的， 点击操作，完成服务器的部署
给服务器装了一个控制台/操作系统后台
得到了有个公网IP

## 宝塔的优势
/www/wwwroot
服务器内置了宝塔：8888
-可视化 
-自由度高
    想怎么部署就这么部署

## 用户访问网站到底发生了什么
1.Browser -》 DNS （Domain Name System）先找到服务器 Server IP
  DNS 返回 服务器公网IP
  先查地址，再去敲门
  DNS 查询会缓存在本地
  -browser
  -上网设备系统
  -局域网
  -城域网
  -根服务器
-安全组，防火墙
 看门人，放不放行
 -ip 限流，恶意ip，
 -尽量的少开放端口
  80 http 默认端口 
  443 https 默认端口
  3306 Mysql 可选择的访问
  只开放给一些IP dev ， production

  安全组
    位置： 云厂商网络层（比如腾讯云）
    作用？  控制这台云服务器哪些端口被外网范围访问
    类比：小区大门保安 不让进 
  防火墙
    位置： 服务器操作系统内部
    作用？  控制这台服务器哪些端口被外网范围访问
    类比：小区大门保安 不让进 

3.Nginx 真正的入口（分流）
-静态资源
  react + ts 打包的
  route，static route，返回静态资源
-动态资源
  route 走服务器路由
Nginx 是一个高性能的web服务器
三件事： 接收请求，返回静态文件，或者把请求转发给后端
http://119.45.34.88/ index.html
    http://119.45.34.88/api/todos
    vite mock
    跨域 5173：80 ->3001
    nginx 配置 /api -> 反向代理
    http://119.45.34.88:3000/todos
    json -> nginx 返回前端调用

        node ->mysql mvc

## 服务器准备
- 网站 -》 node项目
    Node。js 版本管理器 nvm 同时容纳多个node版本，指针，当前是哪个版本
    node 版本需求不一样， 项目以来哦不同的node 版本，
- html项目 装 nginx 
-安装MySQL
    -建 dev/prod 两个库
    -开发和线上互相不影响
    dev   GXMamz7cin7XWGpS
    prod  RJSjrRkK4jG53LbH

## 项目现在本地跑起