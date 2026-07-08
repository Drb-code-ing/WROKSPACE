// node 主进程 agent 执行 js 单线程
// 调用工具去执行命令行任务（分离出去，独立的子进程）
// node 多进程架构
// child_process 做完后，IPC (Inner process communication, 进程间通信) 告诉主进程结果
import { spawn } from 'node:child_process'// 执行子进程
// mini cursor I/O，命令行
// agent tool，自动化
// const command = 'ls -la'// 列出所有文件，包括隐藏文件 linux命令
const command = 'pnpm vite react-todo-app --template react-ts'

// 切一下，第一项cmd，rest运算符 所有的参数数组s
const [cmd, ...args] = command.split(' ')
const cwd = process.cwd()// 当前工作目录
// 开启子进程
const client = spawn(cmd, args, {
  cwd, // 工作目录
  // node、bash 运行会申请这个资源
  stdio: 'inherit', // 子进程继承父进程的 stdio 标准输入输出，直接显示在当前控制台
  shell: true
})

let errorMsg = ''
client.on('error', (err) => {
  errorMsg = err.message
})

client.on('close', (code) => {
  if (code === 0) {
    process.exit(0)// 成功 退出码为0
  } else {
    if(errorMsg) {
      console.error(`错误：${errorMsg}`)
    }
    process.exit(1 || code)// 失败 退出码为1或错误码
  }
})