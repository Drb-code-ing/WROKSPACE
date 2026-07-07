// node 主进程 agent 执行 js 单线程
// 调用工具去执行命令行任务（分离出去，独立的子进程）
// node 多进程架构
// child_process 做完后，IPC (Inner process communication, 进程间通信) 告诉主进程结果
import { spawn } from 'node:child_process'// 执行子进程
