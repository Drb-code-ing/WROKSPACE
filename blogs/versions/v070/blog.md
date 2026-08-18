# Docker 初探：镜像与容器的关系，与 nginx 反向代理的部署链路

Docker 要解决的问题，一句话就能说清楚：**"我的电脑能跑，你的电脑怎么跑？"** 一个应用除了代码本身，还依托一堆有版本要求的运行环境——node、redis、mysql、react、next……换台机器、换个人接手，环境版本不一致，代码就跑不起来。Docker 的解法是把"应用 + 运行环境"打包成一个隔离的容器，部署到任何地方都能一致地跑。

笔记里有一句特别精辟的类比，直接点透了 Docker 的本质：

```text
Agent  = LLM + Harness（tool + mcp + rag + skill + ...）
Docker = 应用 + 运行环境
```

理解了这条等式，Docker 的骨架就清楚了：它不是一个"虚拟机"，而是把应用和它依赖的环境绑在一起的一种打包方式。

---

## 一、Docker 解决什么问题：环境一致性

笔记开篇给了一个非常真实的场景：

> 你到公司接手一个 n 年前的 Vue2 项目，要求使用 Node16 + npm8。你的电脑装的是 node22，跑不起来。没必要重配电脑，可以用容器化（docker 虚拟化技术），把各个依赖隔离化安装。

这就是 Docker 的第一性价值——**环境一致性**。一个项目跑不起来，往往不是代码错了，而是运行环境对不上。传统做法是"换环境"：卸掉 node22、装回 node16、对齐 npm 版本，折腾一圈还可能带崩别的项目。

Docker 的答案是**隔离化**：把这个项目需要的 node16、npm8 连同代码一起，打包进一个独立的容器。容器之间互不干扰，你本机的 node22 该是几就是几，项目跑在自己的容器里，谁也不用迁就谁。

所以 Docker 的定位是**应用容器化工具**，它打包的单元是"应用 + 运行环境"这个整体。

---

## 二、镜像与容器：光盘与 DVD

Docker 有两个绕不开的基本概念，笔记用了一个特别形象的比喻：

```text
image     —— 光盘     应用程序 + 环境，隔离的
container —— DVD      运行起来的实例
```

- **镜像（image）** 是静态的"安装盘"，装着应用代码和它需要的完整环境，本身不运行；
- **容器（container）** 是镜像"跑起来"之后的实例，是一个正在运行的进程。

要拿到一个镜像，就像下载一张光盘：`docker pull image`。镜像拿到手后，用 `docker run` 把它启动成一个运行中的容器。

这个"镜像 / 容器"的区分，是理解后面所有 docker 命令的前提——**pull 拉的是镜像，run 启动出来的是容器**。

---

## 三、一个 Web 应用：1314 端口与 nginx 反代

笔记用一个最小的 Node 服务 `demo/index.js` 演示了完整的链路。先看这个服务：

```js
// node 早期的commonjs 模块规范
const http = require('http');
const server = http.createServer((req, res) => {
  res.end('hello world');
 })
server.listen(1314, '0.0.0.0', () => {
  console.log('server is running on port 1314');
})
```

这就是一个监听 **1314 端口**、返回 `hello world` 的 HTTP 服务。到这里，浏览器访问 `http://localhost:1314` 就能直接看到结果。

但笔记紧接着抛出一个运维知识点：**`:80 是默认端口号**。用户习惯在地址栏直接输入 `http://localhost`，而浏览器默认请求的就是 80 端口。如果服务直接跑在 1314，用户每次都得手动加上 `:1314`，既不优雅也不符合直觉。

于是就有了**服务器软件**这个角色：**把所有 80 端口产生的请求，代理给 1314 端口。** 这个"服务器软件"就是 nginx。

---

## 四、nginx 服务器与反向代理

为什么是 nginx？笔记点得很直白：**高并发、代理转发，需要 nginx**。它监听 80 端口的访问，并通过配置文件把请求转发给 1314 端口。

`demo/nginx.conf` 就是这份配置：

```nginx
# nginx.conf
# events 块是 nginx 必需的，配置网络事件模型
# 缺了它 nginx 直接报 "no events section" 启动失败
events {
  worker_connections 1024;  # 每个 worker 进程最大连接数
}

http {
  server {
    listen 80;
    location / {
      proxy_pass http://host.docker.internal:1314;
      proxy_set_header Host $host;
    }
  }
}
```

几个关键点，笔记都标出来了：

- **`events` 块是必需的**——它配置网络事件模型，缺了它 nginx 会直接报 `no events section` 启动失败；
- **`listen 80`**——nginx 监听 80 端口；
- **`proxy_pass http://host.docker.internal:1314`**——把请求转发到 1314 端口，其中 `host.docker.internal` 是容器访问宿主机（本机）的特殊域名，因为 Node 服务跑在本机而不是容器里，nginx 要跨过容器边界去找它；
- **`proxy_set_header Host $host`**——转发时保留原始的 Host 头。

这样一条链路就通了：用户访问 `http://localhost:80` → nginx 监听 80 → 通过配置转发给 `host.docker.internal:1314` → Node 服务返回结果。用户完全不需要知道后端真正跑在 1314 端口，这就是"反向代理"的意义。

---

## 五、`docker run` 命令拆解

有了 nginx 镜像和配置文件，笔记给出了把 nginx 跑起来的完整命令：

```bash
docker run --name my-nginx-demo -p 80:80 -v E:/WROKSPACE/backend/docker/demo/nginx.conf:/etc/nginx/nginx.conf -d nginx
```

`docker run` 的作用是**启动一个镜像，成为可运行的容器**。后面每一个参数笔记都拆过：

| 参数 | 含义 |
| --- | --- |
| `--name my-nginx-demo` | 给容器起名，方便后续操作 |
| `-p 80:80` | 端口映射：`本机 80 端口 : 容器 80 端口`，把宿主机 80 映射到容器 80 |
| `-v <本机配置文件>:<容器内路径>` | 挂载：把本机的 `nginx.conf` 挂到容器的 `/etc/nginx/nginx.conf`，实现"配置在容器外、容器内读取" |
| `-d nginx` | 后台运行 nginx 镜像 |

拆开看，`docker run` 其实是 `pull + 启动` 的一体化动作：镜像 `nginx` 如果本地没有，会先自动拉取，再启动成容器。而 `-p` 和 `-v` 是 docker 最常用的两个"打通容器内外"的开关——`-p` 打通端口，`-v` 打通文件。

---

## 六、运维考点：反向代理链路与 docker 常用命令

笔记把这条链路的"代理"概念讲得很透，值得单独拎出来。先说**正向代理 vs 反向代理**：

```text
用户上网 intent
  -> browser（chrome）  （正向代理）
  -> localhost:80
  -> docker -p(ort) : container(80)
  -> -v 映射 配置文件 (local:/etc/nginx/nginx.conf)
  -> -d 后台运行 nginx(image)
  -> nginx:80  <- :1314 （反向代理）
```

- **正向代理**是站在"用户"这一侧：浏览器把用户的请求代理出去，用户是发起方；
- **反向代理**是站在"服务器"这一侧：nginx 站在服务器前面，把外部的 80 请求转给内部的 1314，**localhost 的我们是不知道后端具体在哪个端口的**——这正是反向代理的价值：隐藏后端真实端口，统一入口。

再看 docker 的常用命令，笔记列了一组"运维套餐"：

```bash
docker pull <镜像>           # 拉取想要的镜像
docker run <镜像>            # 运行镜像
docker stop $(docker ps -q)  # 停止所有运行中的容器
docker rm $(docker ps -aq)   # 删除所有容器
docker images                # 查看镜像
docker rmi <镜像>            # 删除镜像
```

这里有个容易混的点：`ps` 管的是**容器**，`images` 管的是**镜像**；`stop/rm` 针对容器，`rmi`（remove image）针对镜像。删容器用 `rm`，删镜像用 `rmi`，别搞反。

---

## 七、mysql 容器化：一个真实的落地例子

笔记最后用一个真实的中间件演练了容器化：把 mysql 装进容器。

```bash
docker pull mysql:8.0
docker run -d --name mysql-demo -p 3307:3306 -e MYSQL_ROOT_PASSWORD=123456 mysql:8.0
docker exec -it mysql-demo /bin/bash   # 进入容器 linux 终端
mysql -uroot -p123456
```

几个新知识点：

- **`docker pull mysql:8.0`** 指定版本号拉取——笔记特别提醒"docker pull mysql 版本不一样"，不带 tag 默认拉 latest，生产环境要显式指定版本；
- **`-e MYSQL_ROOT_PASSWORD=123456`**——`-e` 全称 `--env`，用于设置环境变量，这里通过环境变量给 mysql 的 root 设初始密码（mysql 镜像约定用这个环境变量初始化密码）；
- **`-p 3307:3306`**——本机 3307 映射容器 3306，因为本机 3306 可能已被本地 mysql 占用（笔记开头就提到"本地安装了 mysql"），所以映射到 3307 避开冲突；
- **`docker exec -it mysql-demo /bin/bash`**——`exec` 是进入一个**已运行容器**的终端，`-it` 分配交互式终端，进去后就是一个 linux 环境，再 `mysql -uroot -p123456` 登录。

到这里，Docker 的完整能力就串起来了：**代码（node）、中间件（nginx）、数据库（mysql）都能容器化**，每个都通过 `pull → run → (exec)` 这条固定流程落地。

---

## 面试问答

**问：Docker 解决的核心问题是什么？镜像和容器有什么区别？**

> Docker 解决"我的电脑能跑，你的电脑怎么跑"的环境一致性问题——应用依赖一堆有版本要求的运行环境，换机器就跑不起来，Docker 把"应用 + 运行环境"打包成隔离的容器到处部署。镜像（image）是静态的"光盘"，装着应用和环境，不运行；容器（container）是镜像跑起来的实例，是一个运行中的进程。`docker pull` 拉镜像，`docker run` 把镜像启动成容器。

**问：什么是正向代理和反向代理？nginx 在这里扮演什么角色？**

> 正向代理站在用户侧，浏览器把用户的请求代理出去，用户是发起方；反向代理站在服务器侧，nginx 挡在服务器前面，把外部的 80 请求转给内部的 1314，隐藏后端真实端口、统一入口。这里的 nginx 监听 80 端口，通过 `proxy_pass http://host.docker.internal:1314` 把请求反代给本机的 Node 服务，用户不需要知道后端跑在哪个端口。

**问：`docker run` 里 `-p`、`-v`、`-d`、`-e` 分别是什么意思？**

> `-p 本机:容器` 是端口映射，打通宿主机和容器的端口；`-v 本机:容器` 是文件挂载，把本机文件挂到容器内路径（如把 nginx.conf 挂到 /etc/nginx/nginx.conf）；`-d` 是后台运行；`-e` 全称 `--env`，设置环境变量（如 mysql 镜像用 `MYSQL_ROOT_PASSWORD` 初始化 root 密码）。`-p` 打通端口、`-v` 打通文件，是 docker 最常用的两个"连通容器内外"的开关。

**问：docker 常用命令里，`stop/rm` 和 `rmi` 有什么区别？**

> `ps` 管容器、`images` 管镜像；`stop/rm` 针对容器，`rmi`（remove image）针对镜像。删容器用 `rm`，删镜像用 `rmi`。`docker stop $(docker ps -q)` 停止所有运行中容器，`docker rm $(docker ps -aq)` 删除所有容器。

**问：`docker exec` 是做什么的？`-it` 是什么？**

> `docker exec` 是进入一个**已运行容器**的终端，`-it` 分配一个交互式终端（interactive + tty）。比如 `docker exec -it mysql-demo /bin/bash` 进入 mysql 容器的 linux 环境，进去后再 `mysql -uroot -p123456` 登录数据库。它和 `docker run` 的区别是：`run` 启动一个新容器，`exec` 进入一个已经在跑的容器。

---

## 结语：一条"打包 → 部署 → 反代"的链路

第六十天没有写多少业务代码，却把"应用怎么稳定地跑起来"这条运维链路搭清楚了。回看整条线，其实是三层递进：

```text
打包       image 光盘 → container DVD        应用 + 环境 隔离化
启动       docker run -p -v -d -e            打通端口、文件、后台、环境变量
反代       nginx 监听 80 → 转发 1314         隐藏后端端口、统一入口
```

落到具体场景：一个 Node 服务跑在 1314，用 nginx 反代统一成 80 入口，用 `docker run` 把 nginx 和配置文件一起容器化，再用同样的套路把 mysql 也装进容器——**代码、中间件、数据库，都走 `pull → run → exec` 的同一条流程。**

动手前，拿这份清单自检：

- [ ] 能否说清 Docker 解决"环境一致性"问题，以及 `Agent = LLM + Harness` 与 `Docker = 应用 + 环境` 的类比？
- [ ] 能否讲出镜像（光盘）和容器（DVD）的区别？
- [ ] 能否解释 nginx 为什么需要 `events` 块，以及 `proxy_pass` 如何把 80 反代到 1314？
- [ ] 能否拆解 `docker run` 里 `--name / -p / -v / -d / -e` 各自的作用？
- [ ] 能否画出"浏览器 → localhost:80 → docker -p → nginx:80 → :1314"的完整链路？
- [ ] 能否分清正向代理（用户侧）和反向代理（服务器侧）？
- [ ] 能否区分 `stop/rm`（容器）和 `rmi`（镜像），以及 `docker exec -it` 的用途？
- [ ] 能否说清 `docker pull mysql:8.0` 里显式版本号、`-e MYSQL_ROOT_PASSWORD`、`-p 3307:3306` 各解决什么问题？

理解这条链路，就拿到了容器化部署的第一把钥匙——**环境一致靠镜像，流量入口靠反代，落地靠 `docker run`。**
