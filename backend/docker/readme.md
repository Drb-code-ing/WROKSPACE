# Docker
容器
Docker 是一个应用化容器工具，解决我的电脑能跑，你的电脑怎么跑？的问题。
- node
- redis
- next
- react
- mysql
...
除了代码，依托一堆的，有版本要求的运行环境
docker 帮我们打包成一个整体的容器，非常方便的部署在任何地方。

Agent = LLM + Harness(tool+mcp+rag+skill+...)
Docker = 应用 + 运行环境

## 举例
你到公司接手一个n 年前Vue2 的项目，要求使用Node16 + npm8
你的电脑装的是node22，跑不起来
没必要配置电脑，可以容器化docker 虚拟化技术，将各个依赖隔离化安装

## Docker 基本概念
image 光盘
应用程序 + 环境  隔离的
git pull image
container  DVD

## Web 简单应用
http://localhost:1314
:80  默认端口号
运维知识
服务器软件 把所有80 端口产生的请求，代理给1314 端口

## nginx 服务器
高并发、代理转发，需要nginx
监听80 端口的访问
并通过配置文件帮我们转发给1314 端口

### 启动
docker run
  启动一个镜像，成为可运行的容器
  --name my-nginx-demo
  容器的名字
  -p 80:80
  本机的80 端口:容器的80
  80是nginx 的监视端口
  http://localhost:80 用户的浏览器输入
  转给、映射给container 80
  -v
  nginx.conf 配置文件(本机)
  80 代理1314 端口
  -d nginx
  后台运行 nginx

  docker run --name my-nginx-demo -p 80:80 -v E:/WROKSPACE/backend/docker/demo/nginx.conf:/etc/nginx/nginx.conf -d nginx

## 运维考点
- nginx
  反向代理

  用户上网intent -> browser(chrome)(正向代理) -> local:80 -> docker -p(ort) : container(80)
  -> -v 映射 配置文件(local:/etc/nginx/nginx.conf) -> -d 后台运行 nginx(image) -> nginx:80 <- :1314(反向代理)
  localhost 我们是不知道后端具体在哪个端口的

- docker
  pull 如何想要的镜像
  run 运行镜像
  docker stop $(docker ps -q) 停止容器
  docker rm $(docker ps -aq)  删除容器
  images 查看镜像
  rmi 删除镜像

## mysql
  docker pull mysql:8.0
