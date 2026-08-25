# 1. 选一个镜像（走国内镜像加速器，避免 Docker Hub 连接超时）
FROM docker.m.daocloud.io/library/node:20-alpine
# 2. 在容器里切到/app 文件夹作为工作目录
WORKDIR /app
# 3. 把当前目录下的 index.js 复制到容器的/app 目录下
COPY index.js .
CMD ["node", "index.js"]
