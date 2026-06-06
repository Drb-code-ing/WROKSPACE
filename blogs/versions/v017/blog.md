# 用 Prompt 做 NLP：解构赋值与 AI 全栈的第一次实战

## 引言

v016 学的是底层——执行上下文、调用栈、原型链，都是 JS 引擎在背后干的事。今天换个方向，学点能直接干活的东西：**用 ES6 的解构赋值写代码，用 Prompt 调 LLM 做 NLP 任务**。

简单说就是：从"理解语言怎么运行"变成"用语言去解决问题"。

## 一、解构赋值：从对象和数组里快速取值

以前从对象里取值，得这么写：

```javascript
let obj = {"name": "姚明", "city": "北京"}
let name1 = obj.name
let city1 = obj.city
```

ES6 的解构赋值可以一步到位：

```javascript
let {name, city} = {"name": "姚明", "city": "北京"}
console.log(name)  // 姚明
console.log(city)  // 北京
```

**为什么要用解构赋值？** 简洁，性能也好。直接从对象中提取属性值变成变量，代码更优雅。

数组也能解构，而且是按顺序来的：

```javascript
let [coach, ...players] = ['范甘迪', '姚明', '麦迪', '穆托姆博', '弗朗西斯']
console.log(coach)   // 范甘迪
console.log(players) // ['姚明', '麦迪', '穆托姆博', '弗朗西斯']
```

注意那个 `...`，叫 **rest 操作符**，意思是"剩下的全部打包给我"。

还有个反向的，叫 **spread 操作符**，用来展开数组：

```javascript
let [hrplayer, ...hrplayers] = ['杰克逊', '科比', '詹姆斯', '加索尔']
let allplayers = [...players, ...hrplayers]
console.log(allplayers)
// ['姚明', '麦迪', '穆托姆博', '弗朗西斯', '科比', '詹姆斯', '加索尔']
```

一个 `...`，两种用法：打包叫 rest，展开叫 spread。记住这个就行。

## 二、NLP 四大任务：让 LLM 帮你读文本

学完解构赋值，进入今天的重头戏——**用 Prompt 做 NLP 任务**。

NLP（自然语言处理）说白了就是让机器"读懂"人话。有了 LLM，不用训练模型，写个 Prompt 就能干。

### 1. 情感分类（Sentiment Analysis）

最基础的任务：这段话是正面、负面还是中性？

电商行业特别需要这个——用户评论一进来，自动判断好评差评，客服预警、产品质检都能用。

Prompt 可以这么写：

```
以下用三个反引号分隔的产品评论的情感是什么？
用一个词回答：正面 | 负面 | 中性
评论文本：```{评论内容}```
```

甚至可以更细一点，识别具体情感：

```
识别以下评论作者表达的情感。
包含不超过5个项目。
将答案格式化为以逗号分隔的单词列表。
```

还能判断是否包含某种情绪：

```
以下评论是否表达了愤怒？给出是或否
```

### 2. 信息提取（Information Extraction）

从文本中"抠"出关键信息。比如从评论里提取商品名和品牌名：

```
从评论文本中识别以下任务：
- 评论者购买的商品
- 制造该商品的公司
评论文本用三个反引号分隔。将你的响应格式以"物品(product)"和"品牌(brand)"为键的JSON对象。
如果信息不存在，就用"未知"作为值。
```

这个任务的关键是**格式化输出**——让 LLM 返回 JSON，方便程序直接处理。

### 3. 文本总结（Summarization）

老板、小编的刚需：长文变短文。

但不是简单压缩，可以**聚焦不同维度**：

```
你的任务是从电子商务网站上生成一个产品评论的简短摘要
请对以下产品评论进行概括，最多30个词汇，并且聚焦在产品运输上。
```

换个 Prompt 就能聚焦价格：

```
请对以下产品评论进行概括，最多30个词汇，并且聚焦在产品价格和质量上。
```

**同一个文本，不同 Prompt，得到不同角度的总结。** 这就是 Prompt Engineering 的威力。

## 三、实战：批量处理多个评论

项目里写了四条评论，用循环批量处理：

```javascript
const reviews = [review_1, review_2, review_3, review_4]
for(const review of reviews) {
  const prompt = `
  你的任务是从电子商务网站上的产品评论中提取出相关信息。
  请对3个反引号之间的文本进行概括，最多20个字。
  评论文本：\`\`\`${review}\`\`\`
  `
  const response = await getCompletion(prompt)
  console.log(response, '\n')
}
```

四条评论，一个循环，批量提取信息。**代码重复的部分抽成变量，变化的部分用模板字符串填充。**

## 四、模块化：把项目拆清楚

代码多了就要拆，不然乱成一锅粥。项目分三个文件：

### client.mjs —— 封装 LLM 客户端

```javascript
import { OpenAI } from 'openai'
import dotenv from 'dotenv'
dotenv.config()

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_API_BASE_URL,
})

export default client
```

环境变量、API 配置全放这里，其他文件不用管。

### completion.mjs —— 通用的调用函数

```javascript
import client from './client.mjs'

export async function getCompletion(prompt) {
  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
  })
  return response.choices[0].message.content
}
```

一个函数搞定所有任务，传 Prompt 进去，拿结果出来。

### main.mjs —— 入口文件

```javascript
import { getCompletion } from './completion.mjs'
```

只管写 Prompt、跑任务，不管底层怎么调 API。

**模块化的好处：** 维护性强（改 client 不影响 main）、可读性高（一眼看出职责）、复用性好（completion 函数哪里都能用）。

注意 `import` 的两种写法：
- `import client from './client.mjs'` —— 默认导出，只能有一个
- `import { getCompletion } from './completion.mjs'` —— 命名导出，可以有多个

## 结语

今天干了三件事：

1. **解构赋值** —— 从对象和数组里快速取值，rest 打包，spread 展开
2. **NLP 四大任务** —— 情感分类、信息提取、主题推断、文本总结，用 Prompt 就能让 LLM 干活
3. **模块化** —— client / completion / main 三层拆开，各管各的

v016 学的是"JS 怎么运行"，v017 学的是"用 JS 去解决问题"。从底层到应用，这才是 AI Native 开发者的路子。

下篇见。