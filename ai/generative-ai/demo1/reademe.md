# Generative AI
 英伟达证书

 - apiKey
   - gitignore + .env
 - npm init -y
   初始化node 项目 ，生成package.json
 - npm i openai
   安装openai sdk
   - 安装要花时间，消耗空间
   - pnpm 安装依赖
     只用安装一次，不同项目间软链接
     npm i -g pnpm

 - .gitignore
   git 提交可以忽略的文件声明
   - node_modules/ 忽略node_modules目录
   apiKey 不能提交到git仓库
   留在本地
   - .env 忽略.env文件
   写在.env文件中，.gitignore 中忽略.env文件 不提交到git仓库
   - apiKey 读取流程
     dotenv库，默认读取根目录下.env文件
     .env 文件格式要求：key=value
     key(大写)=value 换行
     - 1. 安装dotenv
     - 2. 引入dotenv
     - 3. 调用dotenv.config() 读取到process 进程对象
     - 4. 读取环境变量 process.env.key
   - mjs 后缀
      js 后缀
      es6 才推出的模块语法 module js
      1. 支持import 语法
      2. 支持export 语法
      3. 支持import/export 语法
      如果使用js 后缀想使用模块语法，需要在package.json 中配置type: "module"
  
  ## async/await 关键字
   es8 新增的异步编程语法
   js 代码的编程顺序和执行顺序是不同的
   变量申明/异步任务(setTimeout, api请求)
   api 返回结果后，继续执行后续代码

  ## AIGC 工程化流程
   - AI项目/Agent项目 交互都是后端项目
   - npm init -y 为后端项目
   - pnpm i openai/dotenv
   - 实例化client
   - main.mjs 单点入口文件
   - main 单点入口函数
   - 调用 chat completions api 方法
       同步按顺序执行
       异步代码 执行慢,等下执行，耗时长
       控制异步代码的执行顺序
       async await 代码可读性高，控制异步代码的执行流程