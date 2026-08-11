# TS 面试必考：interface 与 type 的四大差异，与 LLM Harness 的自动化择优

前端面试几乎必问一道题：`interface` 和 `type` 有什么区别？第五十五天的笔记把它拆到了底——从对象结构聊起，到继承、声明合并、非对象类型、函数类型四大差异，再落到 React 组件里的"面向接口编程"。

同一天，笔记还有一条更"工程"的线：**LLM Harness 工程**。单次调用大模型，结果总带随机性、还可能幻觉，怎么让它稳定落地？答案是让大模型并行生成多个候选，再让它自己当评委打分、择优——一条"生成 → 评测 → 择优"的闭合流水线。

两条线一个在编译期、一个在运行期，一个管"代码怎么约束"、一个管"结果怎么把关"。串起来是同一件事：**用结构化的方式减少不确定性**——类型把"变量的不确定性"在编译期锁死，Harness 把"生成结果的不确定性"在运行期筛掉。

---

## 一、同一个对象，两种描述

TS 的面试必考题开场永远是最朴素的一句：**`interface` 和 `type` 都能描述对象的结构**，用于函数参数、返回值，给对象和变量做类型约束。

笔记里两个东西写了完全一样的内容，一个用 `interface`，一个用 `type`：

```ts
interface User {
  name: string
  age: number
  avatarUrl: string
}
type UserType = {
  name: string
  age: number
  avatarUrl: string
}

const u1: User = {
  name: '张三',
  age: 18,
  avatarUrl: 'https://www.baidu.com',
}
const u2: UserType = {
  name: '李四',
  age: 20,
  avatarUrl: 'https://www.baidu.com',
}
```

- `interface User`：声明一个**接口**，描述对象长什么样；
- `type UserType = {...}`：定义一个**类型别名**，同样描述对象结构。

两种写法都能给 `u1`、`u2` 做类型约束，多一个字段、少一个字段都会报错。这是它们的**共同点**，也是面试官用来"先抛共识、再问差异"的起手式。真正拉开差距的是接下来的四点不同。

---

## 二、继承：`extends` 与 `&`

对象描述好之后，要复用怎么办？`interface` 用 `extends` 继承，`type` 用交叉类型 `&` 拼接：

```ts
interface Person {
  name: string
}
// 不从零开始，继承 Person
interface Employee extends Person {
  job: string
}

// 类型别名
type PersonType = { name: string }
type EmployeeType = PersonType & { job: string }

const e1: Employee = {
  name: '张三',
  job: '前端开发',
}
const e2: EmployeeType = {
  name: '廖昊',
  job: '马化腾女婿',
}
```

- `interface Employee extends Person`：**extends 继承**，像 OOP 里的类继承一样，"员工"在"人"的基础上多一个 `job` 字段；
- `type EmployeeType = PersonType & { job: string }`：**交叉类型**，把两个类型"与"在一起，同样得到"既有 name 又有 job"的结构。

`e1` 和 `e2` 结构上完全等价——都能给对象类型约束。这是它们表现差异的**第一个考点**：`interface` 是"继承"的语义，`type` 是"组合"的语义，一个像类的血统，一个像接口的拼装。

---

## 三、声明合并：interface 的"分头多次约束"

`interface` 有个非常独特的能力：**同一个名字可以声明多次，TS 会把它们合并成一个**。

```ts
// 接口属性可以分头多次约束，自动合并
interface Animal {
  name: string
}
interface Animal {
  age: number
}
const dog: Animal = { name: '三寸钉', age: 2 }

// 类型名相同会冲突
type AnimalType = { name: string }
// type AnimalType = { age: number }  // ❌ 不可以合并，会报重复声明
```

- 两个 `interface Animal`，一个给 `name`、一个给 `age`，最终 `Animal` 同时拥有这两个属性，`dog` 两个都填才合法；
- `type` 则不行：同一作用域里重复声明同一个类型名，直接冲突报错。

这是**声明合并（Declaration Merging）**。它为什么重要？因为第三方库、全局类型常常会"按需补充"：你不需要修改人家定义好的接口，自己再声明一次同名 `interface` 就能追加字段。而 `type` 是一次性定死的，想扩展只能重新定义或交叉拼接。这是**第二个考点**。

---

## 四、type 的用武之地：联合、元组与函数类型

`type` 虽然不能合并、不能继承，但它有一个 `interface` 永远做不到的能力：**表示非对象类型**。

```ts
type ID = string | number   // 联合类型
type Point = [number, number]  // 元组类型

// interface ID = string | number  ❌ 语法上就不支持
// interface ID {}                 ❌ interface 只能描述对象形状
```

- `type ID = string | number`：联合类型，ID 要么是字符串、要么是数字；
- `type Point = [number, number]`：元组类型，固定长度的数组。

`interface` 从设计上就只能描述**对象**，既不能做联合、也不能做元组——这是**第三个考点**。

函数类型也都能表达，但 `type` 更顺手：

```ts
interface AddFn {
  (a: number, b: number): number
}
const add1: AddFn = (x, y) => x + y
add1(1, 2)

type AddType = (a: number, b: number) => number
const add2: AddType = (x, y) => x + y
```

- `interface AddFn { (a, b): number }`：用"调用签名"描述函数类型，写法像描述一个"可被调用的对象"；
- `type AddType = (a, b) => number`：直接写箭头函数类型，**和日常写函数一模一样**，更直观、更简洁。

两者都能约束 `add1`、`add2` 这样的函数，但 `type` 的写法就是平时写函数的语法，记忆成本更低。这是**第四个考点**：函数类型都用得上，`type` 更方便。

---

## 五、React 实战：面向接口的编程

聊完"纸上"的区别，笔记立刻把 `interface` 用进了 React 组件——这才是它最熟悉的战场。

`UserCard.tsx` 里先立了两个接口，一个描述数据（User）、一个描述组件契约（UserCardProps）：

```tsx
// 接口 OOP 核心概念：抽象
// js 原型式，函数是一等对象
// ts 大型企业级开发强类型语言，类 java 传统的 OOP 思路
// class extends implements interface
// 面向接口的编程，父子组件数据接口
interface User {
  name: string
  age: number
  avatarUrl: string
}
interface UserCardProps {
  user: User
  onEdit: (id: number) => void
}

function UserCard ({ user, onEdit }: UserCardProps) {
  // ...
}

export default UserCard
```

笔记在这里点破了一个背景：JS 是**原型式**的语言、函数是一等对象；而 TS 是**大型企业级开发的强类型语言**，走的是类 Java 的传统 OOP 思路——`class extends implements interface`。于是组件之间的"数据契约"也顺理成章地用 `interface` 来定：

- `UserCardProps` 就是**父子组件之间的接口**：父组件必须传一个符合 `User` 的 `user`，一个签名是 `(id: number) => void` 的 `onEdit`；
- 子组件只需要声明"我要接收什么样的数据"，剩下的交给编译器检查。

App.tsx 里按契约传值，字段一多一少编译器都会拦下来：

```tsx
import UserCard from './cpmponents/UserCard'

function App() {
  return (
    <>
      <UserCard user={
        {
          name: '张三',
          age: 18,
          avatarUrl: 'https://example.com/avatar.jpg'
        }
      } onEdit={() => {}} />
    </>
  )
}
```

这就是**面向接口的编程（Program to an interface）**：不依赖具体实现，只依赖双方约定的接口。在前端里，最朴素的表现就是"组件的 props 就是它的接口"，`interface` 则是给这个接口上类型。

到这里，"面试必考题"这条线收尾。用一个表格把四大差异钉死：

```text
                 interface         type
继承             extends           & 交叉类型
声明合并          ✓ 可重复声明合并   ✗ 重复即冲突
非对象类型        ✗ 只能描述对象     ✓ 联合 / 元组
函数类型          ✓ 调用签名        ✓ 箭头函数，更简洁
```

---

## 六、Harness 工程：把 LLM 输出变成可控的流水线

类型管住的是编译期的变量，那 LLM 输出这种"运行期的不确定性"怎么管？这就是第二条线——**Harness 工程**。

笔记开篇就给了定义：用工程化手段，进一步解决 LLM 的**幻觉**和**落地**问题。`harness` 是一种将"LLM 生成 → 自动评测 → 择优筛选"串联成闭合流水线的编排框架。名字很形象：**像被马具（harness）驾驭的马一样，在结构化流程中自动产出更高质量的结果**。

一句话概括它的野心：单次调用大模型，结果看运气；给它套上 harness，结果就变成"批量生成、自动打分、择优挑选"的确定流程。核心是一套 **LLM as Judge + Best of N Sampling** 的组合模式。

---

## 七、核心思想：Best of N + LLM as Judge + 抽象

笔记把这套模式的三点核心思想记得清清楚楚：

```text
1. Best of N Sampling
   并行生成多个候选，通过随机性覆盖更多可能性

2. LLM as Judge
   用 LLM 充当自动化评分器，代替人工评测，实现闭环自动化

3. Harness 抽象
   将生成、评测、择优三阶段解耦为流水线
```

- **Best of N**：同一个问题，让大模型并行生成 N 份候选答案。大模型采样本身有随机性，同一 prompt 会得到不同的结果——那就别赌单次，多生成几份，让随机性"覆盖更多可能性"；
- **LLM as Judge**：人工评测太慢、没法闭环。那就让 LLM 自己当评委，按规则给每份候选打分。于是"生成—评测—择优"全部自动化，不需要人盯着；
- **Harness 抽象**：生成、评测、择优三个环节互不耦合，像流水线一样各司其职。想换评分标准？只改 judge。想多生成几个？只改 N。

这就是把 LLM 从"单次调用的碰运气"变成"批量生成后的确定性择优"。

---

## 八、代码拆解：生成、评测、择优三阶段

笔记里的 `q1/index.mjs` 把整条流水线落成了真实可跑的代码。先看最底层，一次 LLM 调用：

```js
import OpenAI from 'openai'
import 'dotenv/config'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KE,
  baseURL: process.env.BASE_URL,
})

const askLLM = async (prompt) => {
  const res = await client.chat.completions.create({
    model: process.env.MODEL_NAME,
    messages: [
      { role: 'user', content: prompt }
    ]
  })
  return res.choices[0].message.content
}
```

`askLLM` 用 `openai` SDK 调一次聊天补全，把模型的回答原样返回。这是整条流水线的"原料入口"。

**评委 `judge`**：让 LLM 给一段代码打分：

```js
async function judge(code) {
  const prompt = `
  你是一个严格的代码评审，请判断下面的代码是否正确实现"数组去重函数"

  要求：
  - 只返回一个数字评分(0-10)
  - 不要解释

  代码：${code}
  `
  const res = await askLLM(prompt)
  const score = parseFloat(res)  // string -> number
  return isNaN(score) ? 0 : score
}
```

注意这里的**容错**：LLM 说好"只返回数字"，但谁也不能保证它真照做。所以 `parseFloat(res)` 解析出数字，解析失败（`isNaN`）就按 0 分兜底——**评委不靠谱，流水线也要能跑下去**。

**评测 `evaluateAll`**：逐个打分，把"代码 + 分数"打包存起来：

```js
async function evaluateAll(candidates) {
  const results = []
  for (const code of candidates) {
    const score = await judge(code)
    results.push({ code, score })
  }
  return results
}
```

**生成 `generateCandidates`**：并行发起 N 次独立调用：

```js
const generateCandidates = (prompt, n) => {
  // 创建 n 个 Promise（每个是一次独立的 LLM 调用）
  const tasks = Array.from({ length: n }, () => askLLM(prompt))
  // 并发执行所有任务，等全部完成
  return Promise.all(tasks)
}
```

`Array.from({length: n}, () => askLLM(prompt))` 一口气建 n 个 Promise，`Promise.all` 并发执行——**同一 prompt 生成 n 份不同的候选**，这就是 Best of N 的"并行"。

**择优 `pickBest`**：分数降序排，取第一：

```js
function pickBest(results) {
  return results.sort((a, b) => b.score - a.score)[0]
}
```

**流水线 `harness`**：把三阶段串起来，全流程驱动：

```js
async function harness(prompt) {
  console.log('生成多个候选者...\n')
  // 生成多个候选者
  const candidates = await generateCandidates(prompt, 3)
  console.log('候选结果:')
  candidates.forEach((c, i) => {
    console.log(`\n---- Candidate ${i + 1}----\n ${c}`)
  })
  // 打分
  console.log(`\n Evaluate Candidates...\n`)
  const evaluated = await evaluateAll(candidates)
  evaluated.forEach((e, i) => {
    console.log(`\n---- Candidate ${i + 1}---- 评分: ${e.score}`)
  })

  const best = pickBest(evaluated)
  return best.code
}

const bestCode = await harness("请使用javascript 实现数组去重")
console.log(bestCode)
```

跑起来就是一条清晰的流水线：

```text
生成多个候选者（n=3）          →  生成阶段
打印 3 份候选
LLM 逐个打分（0-10）           →  评测阶段
打印 3 份评分
排序取最高分                   →  择优阶段
返回最佳代码
```

问"数组去重"这样的问题，它会并行生成 3 份实现，让 LLM 评委逐份打分，最后把分数最高的那一段代码交给你。**单次调用可能给到幻觉，三次生成 + 自动择优，大概率把幻觉筛掉**——这就是用工程化手段解决 LLM 落地问题的最小闭环。

---

## 九、面试问答

**问：`interface` 和 `type` 有什么区别？**

> 都是给对象/变量做类型约束的手段，都能描述对象结构。四大差异：① 继承——`interface` 用 `extends`，`type` 用交叉类型 `&`；② 声明合并——`interface` 可以重复声明自动合并，`type` 重复声明会冲突；③ 非对象类型——`type` 能表示联合类型、元组类型，`interface` 只能描述对象；④ 函数类型——两者都能表达，`type` 的箭头函数写法更简洁。

**问：什么时候用 `interface`，什么时候用 `type`？**

> 需要描述对象、需要继承扩展、或者需要利用声明合并（比如给第三方库补类型）时优先 `interface`；需要表示联合类型、元组、或写简洁的函数类型时用 `type`。社区常规偏好是"能用 `interface` 描述对象就用 `interface`，`type` 用来表达它表达不了的"。

**问：什么是声明合并？有什么用？**

> 同名的 `interface` 可以声明多次，TS 会把所有声明合并成一个，属性取并集。用处是扩展别人定义的接口：不用改原文件，自己再声明一次同名 `interface` 就能追加字段。`type` 没有这个能力，重复声明直接报错。

**问：`interface` 能表示联合类型或元组吗？**

> 不能。`interface` 只能描述对象形状。联合类型（`string | number`）、元组（`[number, number]`）这类非对象类型只能用 `type`。

**问：什么是 LLM Harness？它解决什么问题？**

> Harness 是把"LLM 生成 → 自动评测 → 择优筛选"串成闭合流水线的编排框架，用工程化手段解决 LLM 的幻觉和落地问题。单次调用结果不可控，harness 通过批量生成 + 自动评分 + 择优，把"碰运气"变成"结构化流程中产出更高质量的结果"。

**问：什么是 Best of N Sampling？**

> 同一个 prompt 并行生成 N 份候选。大模型采样有随机性，同一问题会得到不同结果，多生成几份就能覆盖更多可能性，再从中择优，比单次生成更稳。

**问：什么是 LLM as Judge？**

> 让 LLM 充当自动化评分器，按规则给候选结果打分（如"只返回 0-10 的评分"），代替人工评测。这样生成—评测—择优全链路自动化，不用人盯着。注意对解析失败要兜底（如 `isNaN` 记为 0 分），保证流水线健壮。

**问：这套 harness 的流水线分哪几个阶段？**

> 三阶段：① 生成（`generateCandidates` 用 `Promise.all` 并行发起 N 次 LLM 调用）；② 评测（`evaluateAll` 让 judge 逐个打分）；③ 择优（`pickBest` 按分数排序取最高）。三阶段解耦，各自可替换。

---

## 结语：不确定性，终要交给结构

这一天把两条线摆在一起，答案其实殊途同归：

```text
编译期   interface 与 type        → 用类型约束，锁死变量的不确定性
运行期   LLM Harness 工程         → 用流水线筛选，筛掉生成的不确定性
```

- TypeScript 的面试必考题，背会四句口诀就够了：**interface 能继承能合并、只描述对象；type 能联合能元组、函数更顺手**；
- 而 Harness 工程，则把"驾驭 AI"落成了可运行的代码：**Best of N 并行生成，LLM as Judge 自动打分，三阶段解耦择优**。

前端面试常问的"interface vs type"，背后是一种工程态度：**能早发现的问题，绝不留到运行时**。Harness 把同样的态度带到了 AI 时代——能自动筛选的结果，绝不留给人肉返工。

动手前，拿这份清单自检：

- [ ] 描述对象结构时，能说出 `interface` 与 `type` 的四大差异（继承、合并、非对象类型、函数类型）？
- [ ] 需要联合类型、元组、简洁函数类型时，是否知道 `type` 更合适？
- [ ] 给第三方库补类型、扩展对象结构时，是否想起 `interface` 的声明合并？
- [ ] React 组件之间，是否用 `interface` 定义 props 契约，实现"面向接口的编程"？
- [ ] 单次 LLM 调用不可控时，是否想到 Best of N Sampling 并行生成多个候选？
- [ ] 是否用 LLM as Judge 自动打分，并对评分解析失败做兜底（如 `isNaN` → 0 分）？
- [ ] 生成—评测—择优三阶段是否解耦，可以独立替换？

类型让代码"说什么就是什么"，Harness 让模型"选出来的就是最好的"。面试考的是前者，工程考验的是后者——两样都拿下，才算真正站稳。
