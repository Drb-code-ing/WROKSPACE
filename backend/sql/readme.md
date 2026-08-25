# SQL

## 后端业务有几张表
文章、点赞、收藏、评论、用户、头像
- 怎么建表
- 怎么建索引
- 怎么建约束

## 用户表
- 用户规模  性能
  用户得登录，用户表最好只存储id, username, password 核心字段
  user 表比较小，有利于分布式，有利于快速查询，有时候还有分表
  id 自增 Primary Key
  username 唯一 Unique Key 不能重复
  password 密码存储，不能明文存储
  头像、slogan 可以另外建表，关联查询

索引？ Index，多少类索引，为什么建立？
查询需求 高频查询 安排索引
- 小家 /user/:id  id Primary Key
- 搜索用户 unique Key
```

CREATE TABLE 'user' (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE 'utf8mb4_unicode_ci' NOT NULL,
  `password` varchar(255) COLLATE 'utf8mb4_unicode_ci' NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4_unicode_ci;
```

## 头像表
头像图片服务器放在静态服务器上
/public/avatar/:id/:filename
云服务器，OSS 独立的静态资源服务器 存放，返回就是一个阿里云地址

```

CREATE TABLE 'avatar' (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mimetype` varchar(255) COLLATE 'utf8mb4_unicode_ci' NOT NULL,
  `filename` varchar(255) COLLATE 'utf8mb4_unicode_ci' NOT NULL,
  `size` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  <!-- 普通索引 根据用户id 查询头像 -->
  KEY `userId` (`userId`),
  CONSTRAINT `avatar_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4_unicode_ci;
```

nest.js，数据库 后端业务 部署在中央机房 强关联的
如 juejin.cn 由nginx 反向代理的一批服务器集群中

juejin.cn 域名
**dns 解析**，分布式数据库 逐级递归查找
先看本地有没有缓存(浏览器、本地缓存)
局域网  校园网dns 服务器
网络服务商  一些dns 服务器 账本 双11
国家服务器
根服务器 .com .org 美国

将域名解析为 ip 地址  三次握手，建立连接
根据我们的所在，将最近的服务器ip 地址返回给我们(nginx 服务器地址，不是后端业务服务器地址)
好几个服务区，每个服务区配置nginx 负载均衡，将流量分发到不同的服务器上
nginx 不做具体代码，只做负载均衡，挑选出集群中健康的服务器，代理之
服务器集群，独立IP，都要web 程序，都能提供服务 
由一台负载均衡服务器nginx 来反向代理

**静态服务器**，img, css, js 静态资源，简单，有自己的特征

cdn 服务器 content delivery network 专门发布静态资源
网络公司，很多的网络节点购买一些cdn服务器，用户就近获取静态资源

## 文章表
```
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

## 点赞表
```
CREATE TABLE `user_like_post` (
  <!-- 两个主键，谁点了谁 -->
  `userId` int(11) NOT NULL,
  `postId` int(11) NOT NULL,
  PRIMARY KEY (`userId`,`postId`),
  KEY `postId` (`postId`),
  CONSTRAINT `user_like_post_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`),
  CONSTRAINT `user_like_post_ibfk_2` FOREIGN KEY (`postId`) REFERENCES `post` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4_unicode_ci;
```
索引的认识：举这个例子
不用单独建userId key，因为联合主键 userId postId，已经覆盖了，浪费空间

## 收藏表
## 评论表
```
CREATE TABLE `comment` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `content` longtext COLLATE 'utf8mb4_unicode_ci',
  `postId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  <!-- 评论的评论 -->
  `parentId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `postId` (`postId`),
)
```