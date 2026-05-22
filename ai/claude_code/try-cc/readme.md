# Claude Code
 前两节课:
 - AIGC 代码生成
   豆包复杂代码
 - vscode + cc 插件
   Ai Coding Agent
   手和脚 直接干活，生成代码直接写入文件

 现在:
 - cc 的命令行工具
   - 基于node.js 实现
   - npm config set registry https://registry.npmmirror.com/
     npm node package manager
     包的来源设置为淘宝镜像，国内，速度快
     - npm install -g @anthropic-ai/claude-code
      全局安装 claude-code 命令行工具
      claude --version 查看版本号 安装成功

  ## cc 开发网页 jima
   - claude
   是否信任文件夹
   就像你请了一个程序员来帮你改项目，得先把办公室门禁给他，他才能去看代码，该文件，跑命令
   但权限也仅限于你授权的文件夹

   这体现了Anthropic 在Claude Code 里强调的最小权限 + 安全边界 思想

  ## Vibe coding
   - 不要直接将任务交给llm
   - 先思考
     五个构建块，
     llm 擅长执行准确详细的任务
     Prompt 设计是关键

  ## cc 提供了plan 模式
     通过询问一些问题，cc 会根据你的回答，生成一个计划，帮助你完成任务
     代替prompt
  
  ## plan 模式
   - 不是直接执行任务
   - 先规划一下，再执行
     /plan 开启plan 模式
   - 新的工作模式
     当我们不太了解行业或领域，/plan 可以降低难度
     cc 可以思考，规划，建议并执行 对新手友好

  ## 使用 cc 维护一个已有项目
   - 先思考，了解项目
     运行起来，按模块看代码
   - cc
     - 如果之前就是用cc 开发的项目，直接查看项目根目录的claude.md 文件(项目说明)
      - 如果是新项目，先初始化项目
        /init 初始化项目 添加claude.md 文件
        将项目都分析一遍
