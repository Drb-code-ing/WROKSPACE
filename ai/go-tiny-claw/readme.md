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
    

## Go 语言认识
Go 是谷歌推出的编译型静态语言，语法简洁，原生支持协程goroutine 与管道channel。
轻量高效，便于并发开发。自带GC 垃圾回收，编译产出单二进制文件，部署简单。
标准库强大，内置工具链完善，跨平台编译友好，适合微服务、云原生、中间件与后端服务开发。

线程是执行的最小单元 开启多线程 线程切换成本高。

Goroutine 是 go 语言原生的轻量级**协程**，由go 运行时(runtime)调度，而非操作系统内核管理。
它占用栈内存极小，创建成本低于系统线程，可轻松开启上万并发。
goroutine 基于channel 通信，遵循 以通信共享内存的思想，简化并发编程，适合高并发服务、任务异步处理场景
