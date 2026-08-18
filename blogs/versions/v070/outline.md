# v070 博客大纲

**标题**：Docker 初探：镜像与容器的关系，与 nginx 反向代理的部署链路
**日期**：2026-08-18
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源 |
| --- | --- | --- |
| 引言 | 开门见山：Docker 解决"我的电脑能跑，你的电脑怎么跑"；Agent=LLM+Harness 与 Docker=应用+环境 类比 | readme.md |
| 一、Docker 解决什么问题 | 环境一致性；Vue2 项目 Node16+npm8 场景；隔离化安装 | readme.md |
| 二、镜像与容器 | image=光盘 / container=DVD；pull 拉镜像、run 启动容器 | readme.md |
| 三、一个 Web 应用 | node 服务监听 1314；:80 默认端口；服务器软件代理 | readme.md + index.js |
| 四、nginx 与反向代理 | nginx 高并发/代理转发；events 块必需；listen 80 + proxy_pass host.docker.internal:1314 | readme.md + nginx.conf |
| 五、docker run 拆解 | --name / -p / -v / -d 各自作用；完整命令 | readme.md |
| 六、运维考点 | 正向代理 vs 反向代理；完整链路图；docker 常用命令（pull/run/stop/rm/images/rmi） | readme.md |
| 七、mysql 容器化 | pull mysql:8.0；run mysql-demo；-e 环境变量；exec 进入容器 | readme.md |
| 面试问答 | 核心问题/镜像容器/正反向代理/docker 命令/exec | 综合 |
| 结语 | 打包→部署→反代三层递进；检查清单 | 综合 |

## 核心结论

- **Docker 解决环境一致性问题**："我的电脑能跑，你的电脑怎么跑"；应用依赖一堆有版本要求的运行环境，Docker 把"应用+环境"打包成隔离容器到处部署；
- **镜像 vs 容器**：image=光盘（应用+环境，隔离的，不运行），container=DVD（跑起来的实例）；`pull` 拉镜像、`run` 启动容器；
- **nginx 反向代理**：监听 80 端口，通过配置转发给 1314；`events` 块必需（缺了报 no events section）；`proxy_pass http://host.docker.internal:1314` 跨容器边界找宿主机 Node 服务；
- **docker run 参数**：`--name` 命名、`-p 本机:容器` 端口映射、`-v 本机:容器` 文件挂载、`-d` 后台运行、`-e`（--env）设环境变量；
- **正向代理（用户侧 browser）vs 反向代理（服务器侧 nginx）**：localhost 用户不知道后端真实端口；
- **docker 常用命令**：`ps` 管容器 / `images` 管镜像；`stop/rm` 针对容器、`rmi` 针对镜像；
- **mysql 容器化**：`pull mysql:8.0` 显式版本、`-e MYSQL_ROOT_PASSWORD` 初始化 root 密码、`-p 3307:3306` 避开本机 3306 冲突、`exec -it` 进入已运行容器。

## 引用说明

- 全部基于第六十天提交 `2686134`（"第六十天 docker初步，pull了nginx"）：
  - `backend/docker/readme.md`（Docker 定位、镜像/容器、nginx 反代、docker run 拆解、运维考点、mysql）；
  - `backend/docker/demo/index.js`（Node http 服务监听 1314）；
  - `backend/docker/demo/nginx.conf`（events 块、listen 80、proxy_pass 反代 1314）。
- 备注：`backend/docker/demo/package.json` 仅声明 `type: commonjs`，按规则跳过不登记。
