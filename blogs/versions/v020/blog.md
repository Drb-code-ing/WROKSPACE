# JS 同步异步与 Promise：一个 AI Native 开发者的执行机制理解

## 引言

v019 学了数据结构——数组的底层原理、高阶函数、二维数组。那是计算机科学的基本功。

今天学另一个基本功：**JS 的执行机制**。为什么 `setTimeout` 不会卡住页面？为什么 `fetch` 要 `.then()`？什么是 Promise？这背后是 JS 最核心的设计哲学——**单线程 + 事件循环**。

理解了执行机制，才能写出正确的异步代码。而异步编程，是调用 LLM API、处理网络请求、操作文件的基础。

## 一、进程与线程：操作系统的视角

先跳出 JS，从操作系统层面理解：

```
┌─────────────────────────────┐
│          进程 (PID)          │
│  ┌─────────┐ ┌───────────┐  │
│  │ 主线程   │ │ 子线程    │  │
│  │ (TID 1)  │ │ (TID 2)   │  │
│  └─────────┘ └───────────┘  │
│       共享进程资源             │
└─────────────────────────────┘
```

| 概念 | 比喻 | 说明 |
|------|------|------|
| **进程** | 董事长 | 资源分配的最小单位，有独立内存空间 |
| **线程** | 经理 | CPU 调度的最小单位，共享进程资源 |

**C++ / Java** 是多线程架构——能同时干多件事，执行效率高，但开发复杂度也高（锁、竞态条件、死锁）。

**JavaScript 的设计哲学不同：** 简单优先。**JS 被设计为单线程**——一个主线程处理所有任务。写代码不需要考虑线程安全问题，代价是性能不如多线程。

## 二、同步 vs 异步：JS 怎么处理耗时任务

### 同步代码：一行一行，按顺序执行

```javascript
let a = 1
let b = 2
let c = 3
console.log(a + b + c)  // 6，按顺序执行
```

多线程可以 3 个线程分别声明 a、b、c 再并发执行 `console.log`。单线程就只能一步一步来——但大部分场景够用。

### 异步任务：不阻塞主线程

```javascript
console.log('start')

setTimeout(() => {
  console.log('222')
}, 1000)

console.log('end')

// 输出：
// start
// end
// 222（1秒后）
```

**执行过程：**
1. 主线程遇到 `console.log('start')` → 立刻执行
2. 遇到 `setTimeout` → 这是一个异步任务，JS 把它丢到 Event Loop，**不等待，继续往下**
3. 执行 `console.log('end')` → 立刻执行
4. 同步代码全部执行完毕
5. Event Loop 发现 1 秒到了 → 把回调 `() => console.log('222')` 取出来执行

### 哪些是异步任务？

- `setTimeout` / `setInterval` —— 定时器
- `fetch` / axios 请求 —— 网络请求
- 事件监听（click、keydown...）—— DOM 事件
- 文件读写（Node.js / Bun）—— I/O 操作

**这些任务如果同步执行，CPU 几十毫秒的时间片全被占用——页面会卡死。**

## 三、Event Loop：JS 的调度中心

```
同步代码（主线程）
    │
    ├─ setTimeout ──→ 进入宏任务队列（1秒后）
    ├─ fetch ──────→ 进入微任务队列（响应回来后）
    ├─ 继续执行同步代码...
    │
    ▼
同步代码执行完毕
    │
    ▼
Event Loop 从队列中取出异步回调 → 执行
```

**Event Loop 是 JS 的核心调度机制：**
1. 主线程先把同步代码快速执行完
2. 异步任务（定时器、网络请求、事件）被放入 Event Loop
3. 同步代码执行完毕，Event Loop 按优先级取出异步回调执行

**关键认知：** CPU 不能霸占——操作系统会给每个进程分配几十毫秒的时间片，轮询执行。JS 的异步机制让它在单线程下也能高效处理并发。

## 四、Promise：异步任务的控制器

`setTimeout` 只能延时，不能控制"什么时候完成"。实际开发中更复杂：

```
A: fetch 所有用户列表
B: fetch 每个用户的详细信息（依赖 A 的结果）
```

如何控制执行顺序？**Promise** 就是答案。

### Promise 的三要素

```javascript
const p = new Promise((resolve, reject) => {
  console.log('许诺')  // executor 立即执行！

  // 异步任务
  setTimeout(() => {
    resolve(666)       // 成功：调用 resolve，传递数据
    // reject('网络错误')  // 失败：调用 reject，传递原因
  }, 2000)
})

p.then((data) => {
  console.log('成功', data)   // resolve 后执行，data = 666
}).catch((error) => {
  console.log('失败', error)  // reject 后执行
}).finally(() => {
  console.log('无论如何都执行')
})
```

### Promise 的三个状态

```
         pending（进行中）
        /               \
   resolve()        reject()
      ↓                  ↓
 fulfilled（成功）   rejected（失败）
```

**关键点：**
- `new Promise(executor)` —— executor **立即同步执行**，是异步任务的容器
- `resolve(data)` —— 异步任务成功，data 可以传任意类型，通过 `.then()` 接收
- `reject(error)` —— 异步任务失败，error 通过 `.catch()` 接收
- `.then()` / `.catch()` / `.finally()` 都是 Promise 的**实例方法**，在 `Promise.prototype` 上
- **状态不可逆**：一旦从 pending 变成 fulfilled 或 rejected，就不能再变

## 五、fetch：Promise 的实际应用

fetch 调 LLM API 的底层就是 Promise：

```javascript
console.log('start')

fetch('https://api.deepseek.cn/v1/chat/completions', {
  method: 'POST',
})
  .then((res) => {
    console.log(res)  // 响应回来后执行
  })
  .catch((error) => {
    console.log(error) // 网络错误时执行
  })

console.log('end')

// 输出顺序：start → end → res（异步响应）
```

**fetch 不会阻塞代码**——请求发出去后，主线程继续往下走，响应回来后才执行 `.then()`。这正是 Promise 的价值。

## 六、sleep 函数：用 Promise 封装 setTimeout

面试高频题：封装一个 sleep 函数，让代码"等一会儿"再执行。

```javascript
function sleep(t) {
  const p = new Promise((resolve) => {
    setTimeout(() => {
      resolve()  // t 毫秒后兑现诺言
    }, t)
  })
  return p
}

// 使用
sleep(2000).then(() => {
  console.log('2秒后执行')
})
```

**执行流程：**
1. `sleep(2000)` 返回一个 Promise
2. Promise 的 executor 里启动一个 `setTimeout`
3. 2000ms 后 `resolve()` 被调用
4. `.then()` 里的回调执行

用 async/await 还能更优雅：

```javascript
async function main() {
  console.log('开始')
  await sleep(2000)   // 等待 2 秒
  console.log('2秒后执行')
}
main()
```

`await` 让异步代码看起来像同步代码一样写——这就是现代 JS 异步编程的最佳实践。

## 七、单线程的哲学：简单 vs 性能

回到最初的问题：**为什么 JS 选择单线程？**

| | 单线程（JS） | 多线程（C++/Java） |
|---|---|---|
| **开发复杂度** | 低，不用管锁 | 高，竞态条件、死锁 |
| **执行效率** | 受限于单核 | 充分利用多核 |
| **适用场景** | Web 交互、I/O 密集 | 计算密集、游戏引擎 |
| **并发策略** | Event Loop 异步 | 多线程并行 |

JS 用**单线程 + 异步 Event Loop**换来了开发简单性。对于 Web 开发、API 调用、文件读写这些 I/O 密集型场景，足够用——而且更好写。

**但高并发确实有瓶颈。** 所以 JS 有 Web Worker（浏览器）、Worker Threads（Node.js）——给需要多线程的场景留了后路。

## 结语

今天从操作系统到 Promise，搞懂了 JS 的执行机制：

1. **进程与线程** —— 进程是资源单位，线程是执行单位。JS 选择单线程 = 简单
2. **同步 vs 异步** —— 同步代码顺序执行，异步任务丢到 Event Loop，不阻塞主线程
3. **Event Loop** —— JS 的调度中心，同步优先，异步回调排队等通知
4. **Promise** —— 异步任务控制器：executor 立即执行 → resolve/reject 改变状态 → then/catch 处理结果
5. **fetch** —— Promise 的实际应用，调 LLM API 不阻塞页面
6. **sleep** —— Promise + setTimeout 封装，面试高频题，async/await 让异步代码像同步

v017 用 OpenAI SDK 调 LLM，v018 手写 HTTP 请求调 LLM——两次的代码都依赖 Promise。**今天终于把这层"异步胶水"搞明白了。**

**异步编程是 JS 开发者的必修课，Promise 是这堂课的核心。**

下篇见。
