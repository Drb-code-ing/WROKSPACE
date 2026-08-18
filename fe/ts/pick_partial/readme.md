# Docker
- 本地安装了mysql
- docker pull mysql 版本不一样
docker run -d --name mysql-demo -p 3307:3306 -e MYSQL_ROOT_PASSWORD=123456 mysql:8.0
-e 全称 -env，用于设置环境变量
 docker exec -it mysql-demo /bin/bash
 进入容器 linux 终端
 mysql -uroot -p123456

## TS 高级类型
- Pick<T, 选取类型的联合字符串>
- Omit<T, 排除类型的联合字符串>

Omit<T, K> 等价于 Pick<T, Exclude<keyof T, K>> 怎么理解？？
- keyof T 拿到所有键的联合类型
- Exclude 把要剔除的K 键删除，剩下需要保留的键
- 再用Pick 把剩下需要保留的键从 T 中提取出来
- 最后得到 Omit<T, K> 类型
TS 内部Omit 类型实现原理

## 工具类型
Pick、Omit、Partial、Exclude、keyof、Record、ReturnType