# v012 大纲

## 标题
从 Python 到 Node.js：一个 AI Native 开发者的 JavaScript 调用 LLM 实战

## 结构

### 引言
- v011 学了 Prompt Engineering（用 Python 调 DeepSeek API），今天 v012 换一个语言——用 JavaScript 调同一个 API
- 核心转变：AI 工程不是"Python 专属"，JavaScript 同样是调用 LLM 的利器
- 学习来源：英伟达证书课程 Generative AI 部分
- 三个主题：① API Key 安全管理（.env + .gitignore） ② ESM 模块语法与 .mjs 后缀 ③ async/await 异步编程与 AIGC 工程化流程

### 一、API Key 安全管理：从"裸奔"到"保险箱"
- 回顾 v001 做生日卡片时，API Key 直接写在代码里（"裸奔"状态）
- 今天学到的安全三件套：.env + .gitignore + dotenv
  - .env 文件：key=value 格式，存储敏感信息
  - .gitignore：声明 git 提交时忽略的文件（node_modules/、.env）
  - dotenv 库：读取 .env 文件，注入到 process.env 对象
- 读取流程：安装 dotenv → 引入 dotenv → 调用 dotenv.config() → process.env.KEY
- 呼应 v005 Git：.gitignore 是 Git 的"过滤器"，敏感文件永远不进仓库

### 二、ESM 模块语法：.mjs 后缀与 import/export
- 什么是 ESM？ES6 推出的模块语法（ECMAScript Module）
- .mjs 后缀的意义：告诉 Node.js "这个文件用 ESM 语法"
  - 支持 import 语法（引入模块）
  - 支持 export 语法（导出模块）
- 对比 .js 后缀：如果用 .js 想用 ESM，需要在 package.json 中配置 "type": "module"
- 代码示例：import { OpenAI } from 'openai'
- 呼应 v010：v010 学了 JS 的 var/let/const 和作用域，今天是 ES6 模块语法的实战应用

### 三、async/await：控制异步代码的执行顺序
- 什么是异步？JS 代码的编程顺序和执行顺序不同
  - 同步代码：按顺序执行，一行一行来
  - 异步代码：setTimeout、API 请求等，耗时长，先跳过，等结果回来再继续
- async 关键字：修饰函数，表示是异步函数
- await 关键字：在 async 函数体内使用，等待异步操作完成后再继续
- 代码示例：const main = async () => { await client.chat.completions.create(...) }
- 核心价值：async/await 让异步代码看起来像同步代码，可读性高，执行流程可控
- 呼应 v009 Python：Python 也有 async/await，JavaScript 的写法几乎一样

### 四、AIGC 工程化流程：从"脚本"到"项目"
- AI 项目 / Agent 项目的本质是后端项目
- 标准工程化流程：
  1. npm init -y → 生成 package.json（项目配置文件）
  2. pnpm i openai dotenv → 安装依赖
  3. 创建 .env → 存储 API Key
  4. 创建 .gitignore → 忽略 node_modules/ 和 .env
  5. 创建 index.mjs → 单点入口文件
  6. 编写 main 函数 → 单点入口函数
  7. 调用 chat.completions.create → 与 LLM 交互
- pnpm vs npm：pnpm 用软链接共享依赖，不同项目间只安装一次，节省空间和时间
- 呼应 v006 模块化：工程化就是"把散装代码变成结构化项目"

### 五、Python vs JavaScript：双语言调用 LLM 的对比
- v009 用 Python 调 DeepSeek API（OpenAI Python SDK）
- v012 用 JavaScript 调 DeepSeek API（OpenAI Node.js SDK）
- 对比：
  - Python：from openai import OpenAI → client = OpenAI(...)
  - JavaScript：import { OpenAI } from 'openai' → client = new OpenAI({...})
  - Python：直接传 api_key 参数
  - JavaScript：通过 dotenv + process.env 读取环境变量
  - Python：不需要 async/await 也能直接调用
  - JavaScript：必须用 async/await 包裹异步调用
- 核心认知：API 是统一的（chat.completions.create），语言只是"外壳"

### 结语
- 三件事：① API Key 安全是工程化的第一步 ② async/await 是 JS 异步编程的核心 ③ Python 和 JS 都能调 LLM，API 是统一的
- 十二篇文章的完整路径
  - v001-v004：AI 工具链（OPC → Prompt → Agent → CLI）
  - v005-v006：工程基本功（Git → 模块化）
  - v007：业务视角（FDE）
  - v008-v010：编程基本功 + 语言扩展（数组去重 → Python + API → JS 底层）
  - v011：Prompt Engineering（从写代码到写提示词）
  - v012：JavaScript 调用 LLM（双语言能力）
- 从 Python 到 JavaScript，从"一门语言"到"双语切换"，AI Native 开发者的工具箱又多了一把钥匙
- 下篇见。
