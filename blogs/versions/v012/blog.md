# 从 Python 到 Node.js：一个 AI Native 开发者的 JavaScript 调用 LLM 实战

## 引言

v011 学了 Prompt Engineering，用 Python 调 DeepSeek API，理解了"用自然语言编程"的规则。今天，v012，我做了一件"换壳"的事——**用 JavaScript 调同一个 DeepSeek API。**

为什么要在 JavaScript 里再调一次？因为 AI 项目不只是 Python 的天下。前端项目、Node.js 后端、全栈应用——JavaScript 随处可见。v009 说 Python 是 AI 工程的"母语"，今天我发现 JavaScript 也是"母语"之一。

学习来源是英伟达证书课程的 Generative AI 部分。和之前用 Python 写 Jupyter Notebook 不同，这次是在 Node.js 环境下，用工程化的方式搭建一个完整的 AI 项目。

这篇文章聊三个东西：① API Key 的安全管理 ② ESM 模块语法与 .mjs 后缀 ③ async/await 异步编程与 AIGC 工程化流程。

## 一、API Key 安全管理：从"裸奔"到"保险箱"

v001 做生日卡片时，API Key 直接写在代码里。那时候觉得"能跑就行"，没想过安全问题。今天学了"安全三件套"：**.env + .gitignore + dotenv**，才知道 API Key 应该怎么管理。

### .env 文件：敏感信息的"保险箱"

`.env` 文件的格式很简单，一行一个键值对：

```
DEEPSEEK_API_KEY=sk-xxxx
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
```

key 全大写，等号连接 value，没有引号，没有空格。这就是 API Key 的"家"。

### .gitignore：Git 的"过滤器"

v005 学 Git 时，我知道了 `.gitignore` 可以声明"哪些文件不提交到仓库"。今天第一次把它用在正经事上：

```
node_modules/
.env
```

两行配置，两个保护：`node_modules/` 不提交依赖目录（太大了），`.env` 不提交 API Key（太敏感了）。**API Key 一旦提交到公开仓库，几分钟内就会被扫描到，后果很严重。**

### dotenv：把"保险箱"里的钥匙取出来

光有 `.env` 文件还不够，Node.js 默认不认识它。需要 `dotenv` 库来帮忙：

```javascript
import dotenv from 'dotenv'
dotenv.config()
```

调用 `dotenv.config()` 后，`.env` 里的所有键值对会被注入到 `process.env` 对象中。之后就可以通过 `process.env.DEEPSEEK_API_KEY` 来读取了。

v009 用 Python 时，直接把 API Key 写在代码参数里。今天用 JavaScript，先存 `.env`，再用 `dotenv` 读取——多了一步，但安全了一个量级。**工程化的第一步，就是把敏感信息从代码里剥离出来。**

## 二、ESM 模块语法：.mjs 后缀与 import/export

v010 学了 JS 的底层基础——var/let/const、作用域、变量提升。今天第一次在"正经项目"里用 JavaScript，遇到了一个新概念：**ESM 模块语法**。

### 什么是 ESM？

ESM（ECMAScript Module）是 ES6 推出的模块系统。它让 JavaScript 有了"模块化"的能力——可以把代码拆成多个文件，每个文件负责一个功能，然后通过 `import` 和 `export` 把它们串起来。

```javascript
// 1.js
import { OpenAI } from 'openai'
```

这一行代码做了两件事：① 从 `openai` 包中引入 `OpenAI` 类 ② 用 ES6 的解构赋值语法 `{ OpenAI }` 提取出来。

### .mjs 后缀：告诉 Node.js "我用 ESM"

Node.js 默认用 CommonJS 模块系统（`require()` 语法）。想用 ESM 的 `import/export`，有两种方式：

1. **用 `.mjs` 后缀**：直接告诉 Node.js "这个文件用 ESM"
2. **在 `package.json` 中配置 `"type": "module"`**：让所有 `.js` 文件都用 ESM

我选择了 `.mjs` 后缀——简单直接，不需要改配置文件。v010 学 JS 语法时，这些还是"理论知识"。今天第一次在实际项目中使用，感觉"模块化"从概念变成了现实。

## 三、async/await：控制异步代码的执行顺序

这是今天最重要的知识点，也是 JavaScript 和 Python 最大的差异之一。

### 什么是异步？

v009 用 Python 调 API 时，代码是"阻塞"的——发出请求，等结果回来，再继续执行。但 JavaScript 不一样。JavaScript 是**单线程**语言，如果一个 API 请求要等 2 秒，整个程序就卡住 2 秒。

所以 JavaScript 用"异步"来解决这个问题：发出请求后，不等结果，先继续执行后面的代码。等结果回来了，再回调处理。

```javascript
// 同步思维：先等结果，再继续
const response = client.chat.completions.create(...)  // 等 2 秒
console.log(response)  // 2 秒后才执行

// 异步思维：不等结果，先继续
client.chat.completions.create(...)  // 发出请求，不等
console.log('程序结束')  // 立刻执行，但此时 response 还没回来
```

### async/await：让异步代码"看起来"像同步

异步代码的可读性很差——回调函数嵌套回调函数，形成"回调地狱"。ES2017（ES8）引入了 `async/await` 语法，让异步代码看起来像同步代码：

```javascript
const main = async () => {
  console.log('程序开始运行')
  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'user',
        content: '你好',
      },
    ],
  })
  console.log(response.choices[0].message.content)
  console.log('程序结束')
}
main()
```

- `async` 修饰函数，表示这是一个异步函数
- `await` 等待异步操作完成，再继续执行下一行
- 整个 `main` 函数的执行顺序和代码书写顺序一致

**这就是 async/await 的核心价值：让异步代码拥有同步代码的可读性。** v009 用 Python 时，`client.chat.completions.create()` 直接调用就行，Python 默认是同步的。JavaScript 必须用 `async/await` 包裹，但写出来的代码反而更清晰——每一步都在"等待"结果，逻辑一目了然。

## 四、AIGC 工程化流程：从"脚本"到"项目"

v011 用 Python 调 API 时，是在 Jupyter Notebook 里写几行代码，能跑就行。今天用 JavaScript，是按照"工程化流程"搭建的完整项目。

标准流程七步走：

```bash
# 1. 初始化项目
npm init -y                    # 生成 package.json

# 2. 安装依赖
pnpm i openai dotenv           # OpenAI SDK + 环境变量管理

# 3. 创建 .env 文件
# DEEPSEEK_API_KEY=sk-xxxx
# DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# 4. 创建 .gitignore
# node_modules/
# .env

# 5. 创建 index.mjs（入口文件）

# 6. 编写 main 函数（入口函数）

# 7. 调用 chat.completions.create 与 LLM 交互
```

和 v009 的 Python 对比，JavaScript 的工程化更"重"——需要 `package.json`、`node_modules`、`.gitignore`、`.env`、`dotenv`。但这种"重"是有意义的：**项目结构清晰，依赖管理规范，敏感信息安全。**

v006 聊模块化时说"工程化就是把散装代码变成结构化项目"。今天用 Node.js 搭建 AI 项目，就是这个理念的实践——从"写几行能跑的脚本"到"搭建一个可维护的工程"。

## 五、Python vs JavaScript：双语言调用 LLM 的对比

v009 用 Python，v012 用 JavaScript，两次调用的是同一个 DeepSeek API。把它们放在一起对比：

| 维度 | Python (v009) | JavaScript (v012) |
|------|---------------|-------------------|
| 引入 SDK | `from openai import OpenAI` | `import { OpenAI } from 'openai'` |
| 实例化 | `client = OpenAI(api_key=..., base_url=...)` | `const client = new OpenAI({apiKey: ..., baseURL: ...})` |
| API Key 管理 | 直接写在代码参数里 | .env + dotenv + process.env |
| 调用方式 | `client.chat.completions.create(...)` | `await client.chat.completions.create(...)` |
| 异步处理 | 默认同步，不需要额外处理 | 必须用 async/await |
| 入口文件 | Jupyter Notebook (.ipynb) | index.mjs |

最让我惊讶的是：**API 接口几乎一模一样。** `client.chat.completions.create(model=..., messages=[...])`——Python 和 JavaScript 的写法几乎相同。语言是"外壳"，API 是"内核"。掌握了一种语言的调用方式，切换到另一种语言几乎零成本。

这就是 SDK（软件开发工具包）的价值——OpenAI 为 Python 和 JavaScript 提供了统一的接口，开发者不需要关心底层的 HTTP 请求细节，只需要调用封装好的方法。

## 结语

今天学到的不只是"怎么用 JavaScript 调 API"。是三件事：

**第一，API Key 安全是工程化的第一步。** .env + .gitignore + dotenv，三件套缺一不可。v001 的"裸奔"状态，到今天的"保险箱"管理，这是从"能跑就行"到"规范开发"的转变。

**第二，async/await 是 JavaScript 异步编程的核心。** 同步代码和异步代码的执行顺序不同，async/await 让异步代码拥有同步代码的可读性。v009 用 Python 时不需要关心异步，今天用 JavaScript 才真正理解了"异步"的含义。

**第三，Python 和 JavaScript 都能调 LLM，API 是统一的。** 语言只是"外壳"，SDK 提供了统一的接口。AI Native 开发者不需要纠结"用哪种语言"，而是要理解"API 的设计模式"。

回顾十二篇文章的完整路径：

- v001-v004：AI 工具链（OPC → Prompt → Agent → CLI）
- v005-v006：工程基本功（Git → 模块化）
- v007：业务视角（FDE）
- v008-v010：编程基本功 + 语言扩展（数组去重 → Python + API → JS 底层）
- v011：Prompt Engineering（从写代码到写提示词）
- **v012：JavaScript 调用 LLM（双语言能力）**

v009 用 Python 打开了 AI 工程的大门，v012 用 JavaScript 再次推开同一扇门。从"一门语言"到"双语切换"，AI Native 开发者的工具箱又多了一把钥匙。

下篇见。
