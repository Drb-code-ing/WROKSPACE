# go-tiny-claw

## go

google 推出的云原生语言 性能好
- AI 全栈
  - 快手、滴滴、阿里 java
  - 字节、腾讯  go 语言
- muse、personal agent
  openclaw  2.0
- AI Agent 测试工程师
  - AI Agent 自动测试流程
  - Agent 性能测试 LangFuse LangSmith
  - 测试案例
    harness 测试集
- AI infra 基建
  go、rust + 算法
- jev、rea、Agent 自进化

## 需求
以Personal Agent 的初代 openclaw 为蓝本，从0开始构建Agent **Harness**，
如果不用langchain、langgraph、DeepAgents，一个原生、能稳定运行于工业环境的Agent到底如何设计?
借鉴openclaw 顶级开源引擎，底层架构思想？

## Agentic loop ?
- npm init -y
  为当前项目安装依赖
- go 项目的初始化
  - go mod init github.com/yourusername/projectname
  初始化go 模块，模块路径为 github.com/
  让别人可以直接通过git 引用

  go.mod 相当于 package.json
  帮我们管好项目要用的第三方代码，保证在哪都能正常编译运行、
  xxx.weibo.com
- go 语言号称现代c 语言

## 项目结构
  - cmd/claw/main.go 程序入口
    harness 模块
    