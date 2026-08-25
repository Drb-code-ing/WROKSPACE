# 博客后端的 SQL 表设计：主键、联合主键与外键级联的取舍，与 nginx 反代下的跨域解法

一个像掘金这样的博客后端，业务表就摆在那里——用户、文章、点赞、收藏、评论、头像。真正拉开差距的不是"会不会建表"，而是**每一张表的索引和约束是怎么取舍的**：为什么 `user` 表只留三个字段？为什么点赞表用 `(userId, postId)` 联合主键，却还要单独给 `postId` 建索引？为什么删文章时评论会跟着消失？这些答案藏在 MySQL 的索引结构里。第六十四天的笔记把一张完整的博客库拆开讲透，然后又顺着一个请求在网络上走的路——DNS 解析、nginx 反向代理、CDN 静态分发——落到一个 React + NestJS 全栈项目上，讲清了跨域为什么发生、nginx 反代和 `enableCors` 各管哪一段。这篇文章按这条线走：先讲表设计，再讲 DNS→nginx→CDN 的架构，最后落到跨域解法。

---

## 一、`user` 表：核心字段只留三个，小表才有大性能

笔记开篇先问：**后端业务有几张表？** 答案是一组典型的博客业务表——文章、点赞、收藏、评论、用户、头像。建表之前先想三件事：怎么建表、怎么建索引、怎么建约束。

第一张是用户表，它的设计思路是"**用户表最好只存储 id、username、password 核心字段**"：

```sql
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE 'utf8mb4_unicode_ci' NOT NULL,
  `password` varchar(255) COLLATE 'utf8mb4_unicode_ci' NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4_unicode_ci;
```

这张表有三个刻意为之的决定：

- **`id` 自增主键**：每行记录的唯一身份证，`/user/:id` 这种按 id 查的高频请求直接命中主键索引；
- **`name` 唯一键**：用户名不能重复，同时"按名字搜用户"的高频查询正好用上这个唯一索引；
- **`password` 不存明文**：密码必须加密存储，这是安全底线。

更关键的是**"user 表比较小，有利于分布式，有利于快速查询，有时候还有分表"**——用户表是所有表里被关联引用最多的一张（头像、文章、点赞、评论全都有外键指向它），把它压缩到最小，意味着：每一行更短，同样大小的内存/磁盘能装更多记录，索引更小、查询更快；未来要分表、要横向扩展时，核心字段的小表也更灵活。

而**头像、slogan 这类"身份之外"的信息，另外建表关联查询**。为什么？因为头像不是业务主链路上的高频查询，而且它有自己的特征——文件元数据。看 avatar 表：

```sql
CREATE TABLE `avatar` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mimetype` varchar(255) COLLATE 'utf8mb4_unicode_ci' NOT NULL,
  `filename` varchar(255) COLLATE 'utf8mb4_unicode_ci' NOT NULL,
  `size` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `avatar_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4_unicode_ci;
```

它存的是 `mimetype`、`filename`、`size` 这些**文件元数据**，而不是图片本身。笔记点出文件真正放哪：**头像图片服务器放在静态服务器上**，路径形如 `/public/avatar/:id/:filename`；云服务器场景则用 OSS 这种独立的静态资源服务器，返回的就是一个阿里云地址。**数据库只存"这个头像长什么样"的记录，文件本身交给静态资源体系**——这与后面要讲的 CDN 是同一个思路。

---

## 二、索引的取舍：联合主键为什么省掉了一个索引

笔记对索引的态度很务实：**"查询需求 → 高频查询 → 安排索引"**。索引不是越多越好，而是要跟着查询走——按 id 查用主键，按名字查用唯一键，按 userId 查头像就建普通索引 `KEY userId`。

最精彩的是点赞表。它的语义是"谁点了哪篇文章"，所以用**两个主键（联合主键）**：

```sql
CREATE TABLE `user_like_post` (
  `userId` int(11) NOT NULL,
  `postId` int(11) NOT NULL,
  PRIMARY KEY (`userId`,`postId`),
  KEY `postId` (`postId`),
  CONSTRAINT `user_like_post_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`),
  CONSTRAINT `user_like_post_ibfk_2` FOREIGN KEY (`postId`) REFERENCES `post` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4_unicode_ci;
```

`PRIMARY KEY (userId, postId)` 的意思是**"唯一性"由两个人共同决定**——同一个用户不能对同一篇文章点两次赞。这里有一个容易忽略的索引细节，笔记专门拎出来讲了：

> 不用单独建 userId key，因为联合主键 `userId postId`，已经覆盖了，浪费空间。

为什么？因为 MySQL 的联合索引遵循**最左前缀原则**：联合索引 `(userId, postId)` 在 B+ 树里先按 `userId` 排序、再按 `postId` 排序，所以"按 userId 查"（我要看某个人赞过哪些文章）天然能命中这个索引的左侧。既然联合主键已经覆盖了 `userId` 这一维，再单独建一个 `KEY userId` 就是重复造索引、白白浪费磁盘和写入开销。

那为什么还要补一个 `KEY postId`？**正是因为最左前缀原则**——单独按 `postId` 查（我要看一篇文章被哪些人赞过）时，联合索引的右侧用不上，必须单独建一个 `postId` 索引。这一个"加不加"的思考过程，就是索引设计的核心：**每一维查询路径都要有索引支撑，但联合索引能覆盖的左侧维度绝不重复建。**

---

## 三、外键与级联：评论怎么做到"删文章自动删评论"

文章表指向用户，是典型的一对多：

```sql
CREATE TABLE `post` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE 'utf8mb4_unicode_ci' NOT NULL,
  `content` longtext COLLATE 'utf8mb4_unicode_ci',
  `userId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `post_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4_unicode_ci;
```

评论表是最能体现"外键 + 级联"设计意图的一张。它有一个**自引用外键** `parentId` 指向自己——用来实现"评论的评论"，也就是楼中楼：

```sql
CREATE TABLE `comment` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `content` longtext COLLATE 'utf8mb4_unicode_ci' NOT NULL,
  `postId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `parentId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `postId` (`postId`),
  KEY `userId` (`userId`),
  KEY `parentId` (`parentId`),
  CONSTRAINT `comment_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`),
  CONSTRAINT `comment_ibfk_2` FOREIGN KEY (`parentId`) REFERENCES `comment` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comment_ibfk_3` FOREIGN KEY (`postId`) REFERENCES `post` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4_unicode_ci;
```

`parentId` 指向 `comment` 自己，这就是"评论的评论"——一条评论可以回复另一条评论，靠同一张表里的自引用完成，不需要再开一张"回复表"。这里外键带上了 `ON DELETE CASCADE`，含义是：**删除被引用的行时，级联删除所有引用它的行**。

- `comment_ibfk_3`：`postId` 指向 `post`，`ON DELETE CASCADE ON UPDATE CASCADE`——删文章，这篇文章下所有评论自动删光；文章的 id 变化，评论里的 `postId` 跟着更新；
- `comment_ibfk_2`：`parentId` 指向自身，`ON DELETE CASCADE`——删掉一条父评论，它的所有子回复一起消失。

这就是"评论跟着文章走、楼中楼跟着父评论走"的数据库级保证。业务代码里删一篇文章，不用手动去清评论，数据库自己把这条链路的孤儿数据清干净。

多对多关系再补一块：`tag`（标签）和 `post`（文章）之间通过中间表 `post_tag` 关联。中间表的精髓同样是联合主键：

```sql
CREATE TABLE `post_tag` (
  `postId` int(11) NOT NULL,
  `tagId` int(11) NOT NULL,
  PRIMARY KEY (`postId`,`tagId`),
  KEY `tagId` (`tagId`),
  CONSTRAINT `post_tag_ibfk_1` FOREIGN KEY (`postId`) REFERENCES `post` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `post_tag_ibfk_2` FOREIGN KEY (`tagId`) REFERENCES `tag` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4_unicode_ci;
```

`(postId, tagId)` 联合主键保证"一篇文章不会重复打同一个标签"，两侧外键都带级联——删文章或删标签，中间表里的关联记录自动清理。整个博客库就是由这一张张"主键定唯一、外键定关系、级联定清理"的表搭起来的。

---

## 四、DNS 解析：一个域名怎么一步步找到最近的服务器

表设计是"数据怎么存"，接下来看"请求怎么走"。笔记以 juejin.cn 为例，把**输入域名回车之后**发生的事讲了一遍，起点是 DNS 解析：

```text
浏览器/本地缓存 → 局域网/校园网 DNS 服务器 → 网络服务商的 DNS 服务器（账本）
→ 国家服务器 → 根服务器（.com 在美国）
```

这是一个**逐级递归查找**的过程：先看本地有没有缓存（浏览器、本地缓存）；没有就逐级往上——局域网、校园网的 DNS 服务器，网络服务商的 DNS 服务器（笔记比喻成"账本"），国家服务器，最后到存放顶级域名的根服务器（`.com` 这类顶级域在根上）。

最终把域名解析成 **IP 地址**，然后三次握手建立连接。但这里有个关键细节：**返回给我们的，是"根据我们所在的位置，最近的服务器 IP 地址"——而这个 IP 是 nginx 服务器地址，不是后端业务服务器地址。**

为什么？因为大型网站不会把后端业务服务器直接暴露在公网。掘金这样的站点由 nginx 反向代理的一批服务器集群提供服务，DNS 把用户引导到**离他最近的 nginx 节点**，真正的后端躲在这层网关后面。

---

## 五、nginx 反向代理：不写业务代码，只做负载均衡

笔记点出了 nginx 的定位，一句话："**nginx 不做具体代码，只做负载均衡，挑选出集群中健康的服务器，代理之**"。

架构是这样的：

```text
多个服务区，每个服务区配置 nginx 负载均衡
     ↓ 流量分发
后端服务器集群：独立 IP、都要 web 程序、都能提供服务
```

- 后端不是一台机器，而是一个**集群**：每台服务器都有独立 IP、都运行着完整的 web 程序，单台挂了不影响整体；
- nginx 挡在集群前面做**负载均衡**：把进来的流量分发到集群里不同的服务器上，并**挑选出健康的服务器**代理之——某台服务器挂了，nginx 就不会再把流量分给它；
- nginx 自己**不做具体业务代码**，它只管"把请求转发给谁"。

**反向代理**的价值正在于此：对外，用户只知道一个域名、一个 IP（nginx）；对内，nginx 知道整个集群的拓扑。后端服务器的真实地址被隐藏，流量被均匀摊到多台机器上，某台机器故障能被自动绕开——这就是一个"统一入口 + 健康检查 + 流量分发"的网关。

---

## 六、静态资源与 CDN：图片为什么"就近获取"

后端处理的是动态业务，但页面上还有大量静态资源——`img`、`css`、`js`。笔记把它们归为一类：**"静态服务器，img、css、js 静态资源，简单，有自己的特征"**。

静态资源的特点是：内容不变、体积大、请求频繁，不适合每次都由后端业务服务器动态生成。于是有了 **CDN（Content Delivery Network，内容分发网络）**：

> 网络公司，很多的网络节点购买一些 cdn 服务器，用户就近获取静态资源。

CDN 的原理是**把静态资源复制到遍布各地的节点上**，用户请求时从**离自己最近的节点**拿文件，而不是每次都绕回源站。所以头像放静态服务器、放 OSS，最终靠 CDN 就近分发——用户在哪个城市，就从哪个城市最近的 CDN 节点拿图片，这就是"快"的来源。

到这里，一个请求的完整路径就串起来了：**DNS 把用户带到最近的 nginx → nginx 负载均衡到健康的业务服务器 → 业务数据查 MySQL → 静态资源（图片/CSS/JS）从 CDN 就近拿**。

---

## 七、Dockerfile：发布项目的标准配方

静态资源和后端都讲完了，笔记回到部署本身，用了一个非常形象的比喻讲 Dockerfile——**蜜雪冰城的"标准操作手册 SOP"**：

> 写清楚"先加奶茶，再加奶，放 3 勺糖，摇匀"，任何人照着做，出来的味道都一样，就成了连锁店。

Dockerfile 就是这样一个**文本配方文件**，它定义了如何构建一个 Docker 镜像。看这个最小例子：

```dockerfile
FROM docker.m.daocloud.io/library/node:20-alpine
WORKDIR /app
COPY index.js .
CMD ["node", "index.js"]
```

- `FROM`：选一个基础镜像（笔记用国内镜像加速器，避免 Docker Hub 连接超时）；
- `WORKDIR /app`：在容器里切到 `/app` 作为工作目录；
- `COPY index.js .`：把本机的文件复制进容器；
- `CMD ["node", "index.js"]`：容器启动时执行的命令。

构建和发布是一条固定流程：`docker build -t` 构建镜像 → `docker login` 登录 Docker Hub → `docker push` 上传 → 别人 `docker pull` 拉取。**Dockerfile 是发布项目的标准方式之一**——任何机器拿到这个配方，都能构建出味道一样的镜像，这正是 SOP 的意义。

---

## 八、跨域：8080 调 3000 为什么报错，nginx 反代与 enableCors 各管哪一段

第六十四天把 SQL 和网络架构串成一个**全栈 todos 项目**，它同时是跨域问题的真实载体：

- 前端：React + TypeScript + zustand；
- 后端：NestJS；
- nginx：80 端口 → 3000 端口；
- 要解决的问题：**跨域**。

**先搞清楚跨域是什么。** 浏览器有**同源策略**：只有当请求的协议、域名、端口三者和当前页面完全一致时，才允许读取响应。前端跑在 8080（或 nginx 的 80），后端跑在 3000——**端口不同，就是不同源**，浏览器会拦下跨域的响应，控制台报 CORS 错误。这是浏览器的安全机制，不是后端"坏"了。

解决跨域有两条路，笔记的项目里正好各用了其中一条：

**解法一：后端开 CORS（HTTP 头层面）。** NestJS 的入口 `main.ts` 一行搞定：

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 启用 CORS：允许跨域请求（前端和 Nginx 在不同端口/域名时可访问本后端）
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

`enableCors()` 会让 NestJS 在响应里带上 `Access-Control-Allow-Origin` 之类的 CORS 响应头。浏览器看到"后端明确允许跨域"，就不再拦截。这条路解决的是"**不同源的响应读不读**"——靠后端声明。

**解法二：nginx 反向代理（网络层面）。** 让前端发**相对路径**的请求，由 nginx 在服务端把请求转发到后端，浏览器看到的始终是同一个源，**根本不触发跨域**。看前端的 axios 封装 `config.ts`：

```ts
const service = axios.create({
  baseURL: '/api', // 统一请求前缀，配合 Nginx 反向代理
  timeout: 10000,  // 全局超时时间设置
});
```

`baseURL: '/api'` 是关键——前端请求的是**同源的 `/api` 前缀**（比如 `localhost/api/todos`），而不是直接写 `localhost:3000/api/todos`。zustand 的 store 里保持一致，用相对路径：

```ts
const res = await fetch('/api/todos'); // 请求通过 Nginx 代理
```

这个 `/api` 由 nginx 在 80 端口接住，反代到后端的 3000 端口（即笔记里"80 -> 3000"）。站在浏览器的视角：页面源是 `localhost:80`，请求的也是 `localhost:80/api/...`——**同源，不需要 CORS**。nginx 的 `config.ts` 注释把意图写得很明白："统一请求前缀，配合 Nginx 反向代理"。

这两条路的本质区别是：

- **`enableCors`**：承认"确实跨域了"，但由后端显式放行，浏览器放行读取；
- **nginx 反代**：让跨域"不发生"，浏览器层面永远同源，`/api` 的转发在服务器之间完成。

生产环境通常两者配合：nginx 反代作为统一入口解决大部分同源请求，`enableCors` 兜底放行那些确实直连后端的场景。**分清"哪一段由谁解决"，是理解跨域体系的关键。**

---

## 面试问答

**问：主键、唯一键、普通索引有什么区别？**

> 主键（Primary Key）唯一标识一行，且不允许为空，一张表只能有一个；唯一键（Unique Key）保证列值不重复，但可以是 NULL；普通索引（KEY）不对唯一性做任何要求，只为加速查询。建表时三者按查询需求搭配：按 id 查用主键，按用户名查用唯一键，按 userId 查头像这种高频外键关联就建普通索引。索引跟着高频查询走，不是越多越好。

**问：点赞表为什么要用 `(userId, postId)` 联合主键？为什么不需要再单独建 `userId` 索引？**

> 因为"点赞"的唯一性由两个人共同决定——同一个用户不能对同一篇文章点两次赞，所以用联合主键。由于 MySQL 联合索引遵循最左前缀原则，联合主键 `(userId, postId)` 天然覆盖"按 userId 查"这条路径（左侧维度），再单独建 `KEY userId` 就是重复、浪费空间。但单独按 `postId` 查用不上联合索引右侧，所以要补一个 `KEY postId`。一句话：**联合索引能覆盖的左侧维度不重复建，覆盖不到的右侧维度单独建。**

**问：外键的 `ON DELETE CASCADE` 是干什么的？评论表里的自引用 `parentId` 解决了什么问题？**

> `ON DELETE CASCADE` 表示删除被引用的行时，级联删除所有引用它的行，保证数据不会出现孤儿记录。评论表用 `parentId` 指向自己，实现"评论的评论"（楼中楼）而不需要额外的回复表；配上 `ON DELETE CASCADE`，删掉父评论，它的所有子回复一起消失；`postId` 外键也带级联，删文章时这篇文章下的所有评论自动清空。

**问：`user` 表为什么刻意保持"小"？头像为什么要单独建表、甚至放到静态服务器/OSS？**

> 用户表是所有表里被外键引用最多的一张，把它压缩到只存 id、username、password 核心字段，行更短、索引更小、查询更快，也更利于分布式和未来的分表扩展。头像这类"身份之外"的信息单独建表，因为它是文件，数据库只存 mimetype、filename、size 等元数据，文件本身放静态服务器或 OSS，返回的只是一个阿里云地址——这既减轻了数据库压力，也为静态资源走 CDN 就近分发做准备。

**问：DNS 解析的过程是怎样的？为什么最后拿到的是 nginx 的地址而不是后端地址？**

> 输入域名后，DNS 逐级递归查找：先看浏览器/本地缓存，再依次找局域网（校园网）DNS、网络服务商 DNS、国家服务器，最后到存放顶级域的根服务器，把域名解析成 IP。返回的是根据用户所在位置计算的**最近的 nginx 服务器 IP**，而不是后端业务服务器地址——因为大型站点由 nginx 反向代理的一批服务器集群提供服务，后端被网关隐藏，用户只需要知道一个统一入口。

**问：nginx 反向代理和负载均衡是什么关系？**

> nginx 不做具体业务代码，只做负载均衡：后端是一个服务器集群，每台都有独立 IP、都跑着完整 web 程序，nginx 把进来的流量分发到集群的不同服务器上，并挑选健康的服务器代理之——某台挂了就不会再往它分发流量。对外隐藏后端真实地址，对内统一入口、健康检查、流量分发，这就是反向代理 + 负载均衡。

**问：CDN 为什么能让静态资源加载更快？**

> CDN（内容分发网络）把 img、css、js 这类静态资源复制到遍布各地的网络节点上，用户请求时从离自己最近的节点就近获取，而不是每次都绕回源站。静态资源"内容不变、请求频繁"的特征正好适合这种多点复制、就近分发的模型。

**问：什么是跨域？为什么前端 8080 调后端 3000 会报错？**

> 浏览器有同源策略，只有协议、域名、端口三者完全一致才算同源，才允许读取响应。前端跑在 8080、后端跑在 3000，端口不同就是不同源，浏览器会拦下跨域响应并报 CORS 错误。这是浏览器层面的安全机制，后端本身并没有拒绝请求。

**问：`app.enableCors()` 和 nginx 反向代理解决跨域的区别是什么？**

> `enableCors()` 是在 HTTP 头层面解决：后端承认跨域存在，但在响应里带上 `Access-Control-Allow-Origin` 等 CORS 头，浏览器看到后端显式放行就不再拦截。nginx 反代是在网络层面解决：前端发同源的 `/api` 相对路径，由 nginx 在服务端转发到后端 3000，浏览器始终看到同一个源，跨域"根本不发生"。前者靠后端声明放行，后者让跨域不出现，生产环境通常两者配合。

---

## 结语：从一张库到一次访问的完整链路

第六十四天把"后端的一整套基础设施"串成了一条完整的线：

```text
数据怎么存    SQL 表设计：主键/唯一键/联合主键 + 外键级联 → 博客库 9 张表
域名怎么找    DNS 递归解析 → 最近的 nginx IP
流量怎么分    nginx 反向代理 → 负载均衡到健康的后端集群
静态怎么发    CDN 就近分发 img/css/js
部署怎么定    Dockerfile 配方 → build/login/push/pull
跨域怎么解    nginx 反代（同源） + enableCors（放行）
```

动手前，拿这份清单自检：

- [ ] 能否说出 `user` 表只留核心字段的原因，以及头像为什么单独建表、文件放静态服务器/OSS？
- [ ] 能否讲清主键、唯一键、普通索引的区别，以及"索引跟着高频查询走"的原则？
- [ ] 能否解释点赞表 `(userId, postId)` 联合主键 + 最左前缀原则，为什么省掉 `userId` 索引、却补 `postId` 索引？
- [ ] 能否讲出外键 `ON DELETE CASCADE` 的语义，以及评论表 `parentId` 自引用实现的"楼中楼"？
- [ ] 能否画出一条访问链路：DNS 逐级解析 → 最近的 nginx → 负载均衡到健康服务器 → 静态资源 CDN 就近分发？
- [ ] 能否说明 nginx"不做具体代码，只做负载均衡、挑健康服务器代理"的定位？
- [ ] 能否解释 Dockerfile 的 SOP 配方类比，以及 build/login/push/pull 的发布流程？
- [ ] 能否分清 `enableCors`（HTTP 头放行）和 nginx 反代（让跨域不发生）两条跨域解法的区别？

表设计决定数据怎么存、索引决定查得多快、DNS/nginx/CDN 决定请求怎么走、跨域决定前后端怎么对接——把这条链路每一环的原理打通，才是理解一个线上后端的关键。
