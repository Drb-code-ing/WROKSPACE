import fs from 'node:fs/promises'
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
// 判断路径合法性 路径的拼接
import path from 'node:path' // node 内置path 模块
import { spawn } from 'node:child_process'

// I/O 工具
// 读文件工具 
const readFileTool = tool(
    async({ filePath }) => {   // 功能函数
        const content = await fs.readFile(filePath, 'utf-8');
        // 时刻反馈Agent 执行消息
        // Agent 任务可能很复杂,很耗时，需要给用户反馈 用户可能
        // 太久没有看到反馈， 退出
        console.log(`[工具调用] read_file(${filePath})
        成功读取 ${content.length} 字节`)
        return content;
    },
    {
        name: 'read_file',
        description: `用此工具来读取文件内容，当用户要求读取文件、
        查看代码、分析文件内容时，调用此工具。输入文件路径（
        可以是相对路径或绝对路径）`,
        schema: z.object({
            filePath: z.string().describe('要读取的文件路径')
        })
    }
)
// 写文件工具
const writeFileTool = tool(
  // path 模块 专门的路径模块 Agent执行正确范围
  // path 路径 /src/all-tools.mjs 路径模块
  async({ filePath, content }) => {
    // 1. 确认路径是否存在
    // 2. 写入文件 utf-8 编码
    // 3. 容错处理
    try {
      const dir = path.dirname(filePath)// 获取目录
      console.log(dir, '目录')
      // 已存在 目录不创建
      await fs.mkdir(dir, { recursive: true })// recursive 递归创建目录，解决目录不存在的问题
      await fs.writeFile(filePath, content, 'utf-8')
      console.log(`[工具调用] write_file(${filePath}, 成功写入 ${content.length} 字节`)

      return `成功写入文件 ${filePath}`
    } catch(err) {
      console.log(`[工具调用] write_file(${filePath}, 错误：${err.message}`)
      return `写入文件失败：${err.message}`
    }
  },
  {
    name: 'write_file',
    description: '向指定路径写入文件内容，自动创建目录',
    schema: z.object({
      filePath: z.string().describe('文件路径'),
      content: z.string().describe('要写入的文件内容')
    })
  }
)
// 列出目录内容工具
const listDirectoryTool = tool(
  async ({ directory }) => {
    // 后端以稳定工作为主
    try {
      const files = await fs.readdir(directory)// 读取目录下的所有文件和文件夹
      console.log(`[工具调用] list_directory(${directory})
      成功列出 ${files.length} 个文件和文件夹`)
      return `内容目录: \n${files.map(file => file.name).join('\n')}`
    } catch(err) {
      console.log(`[工具调用] list_directory(${directory})
      错误：${err.message}`)
      return `列出目录失败：${err.message}`
    }
  },
  {
    name: 'list_directory',
    description: '列出指定目录下的所有文件和文件夹',
    schema: z.object({
      directory: z.string().describe('目录路径')
    })
  }
)

// 执行命令工具（带实时输出）
const executeCommandTool = tool(
  async({ command, directoryPath }) => {
      const cwd = directoryPath || process.cwd()// 工作目录
      console.log(`[工具调用] execute_command(${command}), 工作目录：${cwd}`)

      return new Promise((resolve, reject) => {
        const [cmd, ...args] = command.split(' ')
        // 子进程执行命令
        const child = spawn(cmd, args, { 
          cwd,
          stdio: 'inherit',
          shell: true,
         })

         let errorMsg = ''
         child.on('error', (err) => {
           errorMsg = err.message
         })
         
         child.on('close', (code) => {
           if (code === 0) {
            console.log(`[工具调用] execute_command(${command}`)
            const cwdInfo = cwd ? `\n\n重要提示：命令在目录 ${cwd}执行成功` : ''
            resolve(`命令执行成功 ${command}\n${errorMsg}`)
           } else {
            console.log(`[工具调用] execute_command(${command})失败，退出码：${code}`)
            resolve(`命令执行失败，退出码：${code}，错误信息：${errorMsg}`)
           }
         })
      })
  },
  {
    name: 'execute_command',
    description: '执行系统命令，支持指定工作目录，实时显示输出',
    schema: z.object({
      command: z.string().describe('要执行的命令'),
      directoryPath: z.string().describe('工作目录')
    })
  }
)

export { executeCommandTool, readFileTool, writeFileTool, listDirectoryTool }