# Git

 - 开发目录
   - 多人协作，如何分布式存储
     gitee 码云
     github
     gitlab
     中央仓库 A/B/C...
 - 操作的冲突
     文件的版本
     一个文件，多个版本时
     git: 文件系统 -> 版本控制系统
     回溯项目工程，更安全，好评估

## Learn_git
  目前是一个空的项目文件夹 
     代码文件(硬盘坏了，改了忘了)
     本地文件 分布式 版本管理

     让git 管理项目，成为代码仓库
      - github 中央仓库
      - git init 初始化项目 本地仓库(文件 --> 版本(快照))

 - git init
    项目 -> 仓库 转变
    .git 隐藏目录 安全，不能随便操作 按照git 规范操作
    git bash 微型的 linux bash 环境
    shell 脚本 ls 命令
    关系：
    文件 : 文件版本(快照) === 1 : n
 - git status
    常用，做任何git 操作前
    明确仓库当前的状态
 - git add 文件名/ .
    文件 untracked -> tracked
    将一个**未追踪的文件**添加到**暂存区(stage area)**中
    to be commited 待提交
 - git commit -m "write a readme file"
    存储到了.git 仓库中，有了第一个版本(快照)
    2 insertions 内容新增了2 行
 - git 配置
    git config --global user.name "your name"
    git config --global user.email "your email"
    配置全局的用户名和邮箱
    gitee 证件

## repo 仓库
 - remote origin 远程源
 - git push origin main/master