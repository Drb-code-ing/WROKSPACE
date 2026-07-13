# 从等待到流式：LLM 流式输出的原理、协议与工程实践

## 引言

打开任何一个 AI Chatbot——ChatGPT、Claude、DeepSeek——你输入一个问题，它不像传统网页那样转圈等 10 秒然后啪地一下弹出全部回答。相反，文字像打字机一样一个字一个字地往外蹦。

这不是动画效果。不是前端做了一个"打字机 CSS 动画"。

**这是 HTTP 协议层的一条水流：LLM 服务端每生成一个 token，就通过一条长连接推给客户端，客户端收到一段就渲染一段。**

第三十五天我们写了一个 Vue 前端来消费 DeepSeek 的流式 API。但本文不止于"怎么在前端调 stream 接口"——我们要从 HTTP 协议栈的最底层一路往上，把流式输出的完整技术链路拆解清楚。因为面试官不会只问你 `stream: true` 怎么写，他会追问：

> "SSE 和 WebSocket 有什么区别？为什么 ChatGPT 用 SSE 而不是 WebSocket？"
>
> "ReadableStream 的 reader 是怎么处理半截 JSON 的？"
>
> "如果流断了怎么办？你怎么做断点续传？"

这些问题，我们一个一个回答。

## 一、为什么需要流式输出：从 Transformer 推理说起

### 1.1 推理为什么慢

大语言模型的核心是 Transformer 架构。它在生成文本时采用**自回归解码（Autoregressive Decoding）**：每次预测下一个 token，然后把新 token 拼回输入，再预测下一个——像一个接龙游戏。

```
输入："今天的天气"
  → 预测下一个 token："真"
    → 把"真"拼回去："今天的天气真"
      → 预测下一个 token："好"
        → 把"好"拼回去："今天的天气真好"
          → ...直到预测出 <EOS>（结束标记）
```

一个 100 个 token 的回答，需要跑 100 次前向传播。每次前向传播又涉及数十亿参数的矩阵运算。这就是为什么 LLM 推理慢——**不是一次慢，而是要重复很多次**。

问题的复杂度（需要推理的深度）和生成长度（需要多少 token）共同决定了总耗时。

### 1.2 用户的等待容忍度

研究表明：
- **0.1 秒**：用户感觉"瞬间"
- **1 秒**：用户注意到延迟，但思维不会中断
- **10 秒**：用户开始分心、切 tab、怀疑是不是卡死了

如果不做流式输出，一个复杂问题可能要等 30 秒以上——这远超用户的耐心极限。

### 1.3 流式设计的核心洞察

**第一个 token 的出现时间（TTFT, Time To First Token）比总耗时重要得多。**

流式输出不减少总耗时，但它改变了**感知性能（Perceived Performance）**：用户在第 0.5 秒看到第一个字开始出现，大脑就知道"它在工作了"，等待的焦虑瞬间消除。

```
非流式：  [---------- 30s ----------] → 一次性返回全部文字
流式：    [0.5s] → 逐字流出 → [30s] → 结束
           ↑ 用户在这里就安心了
```

这就是为什么流式输出是 **AI 产品的第一个关键用户体验**——它不是锦上添花，而是决定用户会不会关掉 tab 的分水岭。

## 二、HTTP 协议层：流式传输的基建

### 2.1 Content-Length 的问题

传统的 HTTP 响应是这样的：

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 1527

{"choices": [{"message": {"content": "今天天气真好..."}}]}
```

服务端在**生成完整响应体之后**才能计算出 `Content-Length`，然后一次性发给客户端。客户端收到 `Content-Length` 后就知道要读多少字节，读完就结束。

**问题就在这里：LLM 需要边生成边发送，生成完之前根本不知道总长度是多少。**

### 2.2 Transfer-Encoding: chunked

HTTP/1.1 引入了 `Transfer-Encoding: chunked`，专门解决"不知道总长度但要逐步发送"的场景：

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Transfer-Encoding: chunked

5\r\n
Hello\r\n
7\r\n
 World!\r\n
0\r\n
\r\n
```

每个 chunk 的格式是：**十六进制长度 + \r\n + 数据 + \r\n**。最后一个 chunk 长度为 0，表示传输结束。

**关键理解：chunked encoding 是 HTTP 协议层的分块机制，和上层应用协议（如 SSE）是两层概念。** 可以理解为：

- **chunked encoding** = 快递公司允许你把一个大包裹拆成多个小包分批寄出
- **SSE** = 每个小包里装的东西按什么格式写（`data: ...`）

实际场景中，这两个通常一起出现：HTTP 层用 chunked 分块传输，应用层用 SSE 格式组织每个 chunk 里的内容。

### 2.3 从 curl 看原始流

用 curl 直接打 DeepSeek API 并开启 `stream: true`，你会看到原始 SSE 数据流：

```bash
curl -N -X POST https://api.deepseek.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DEEPSEEK_API_KEY" \
  -d '{
    "model": "deepseek-v4-flash",
    "messages": [{"role": "user", "content": "讲一个关于奶龙的故事"}],
    "stream": true
  }'
```

`-N` 参数很重要：它告诉 curl 不要缓冲响应，直接输出每个收到的 chunk。不加 `-N` 的话 curl 会等响应完整收到后再输出——那就和非流式没区别了。

你会看到类似这样的输出：

```
data: {"id":"...","choices":[{"delta":{"content":"在"},"index":0}]}

data: {"id":"...","choices":[{"delta":{"content":"一个"},"index":0}]}

data: {"id":"...","choices":[{"delta":{"content":"遥远"},"index":0}]}

data: [DONE]
```

每个 `data:` 行是一个 SSE 事件，里面是一个 JSON，`delta.content` 就是本次新增的一个或几个 token。`[DONE]` 是 DeepSeek（也是 OpenAI 兼容 API）的流结束标记。

## 三、SSE 协议深度解析

### 3.1 什么是 SSE

**SSE（Server-Sent Events）** 是 HTML5 标准的一部分，定义在 [W3C Eventsource spec](https://html.spec.whatwg.org/multipage/server-sent-events.html) 中。它允许服务端通过 HTTP 连接持续向客户端推送数据。

SSE 不是新技术——它诞生于 2006 年（Opera 9 最先实现），比 WebSocket 更早。但直到 LLM 流式输出的兴起，它才真正走进大多数开发者的视野。

### 3.2 SSE 协议格式

SSE 的 MIME 类型必须是 `text/event-stream`。协议格式非常简洁：

```
data: 消息内容\n\n
```

几条核心规则：

| 规则 | 说明 |
|------|------|
| **每个字段以换行符 `\n` 分隔** | `data: ...\n` |
| **每个事件以双换行符 `\n\n` 结束** | 一个事件可以包含多个字段行 |
| **`data:` 前缀** | 事件的数据内容 |
| **`event:` 前缀（可选）** | 事件类型，客户端可以按类型监听 |
| **`id:` 前缀（可选）** | 事件 ID，用于断线重连 |
| **`retry:` 前缀（可选）** | 服务端建议的重连间隔（毫秒） |
| **空行（仅 `\n`）** | 注释，客户端忽略 |
| **`:` 开头** | 也是注释 |

一个完整的 SSE 事件示例：

```
id: 42
event: message
data: {"token": "你"}
data: {"token": "好"}

```

这个事件有两个 `data` 行，客户端会拼接为 `{"token": "你"}\n{"token": "好"}`。

### 3.3 LLM API 中的 SSE 格式

以 OpenAI/DeepSeek 兼容 API 为例，流式响应的每个 chunk 格式为：

```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion.chunk",
  "created": 1720000000,
  "model": "deepseek-v4-flash",
  "choices": [
    {
      "index": 0,
      "delta": {
        "content": "你"
      },
      "finish_reason": null
    }
  ]
}
```

关键字段：
- **`delta.content`**：本次增量文本。注意与 `message.content` 的区别——`message` 是完整消息（非流式用），`delta` 是增量（流式用）
- **`finish_reason`**：当值为 `"stop"` 时表示生成结束，通常与 `[DONE]` 同时出现
- **`index`**：当 n > 1（生成多个候选回答）时用于区分不同候选

### 3.4 为什么是 SSE 而不是 WebSocket

这是面试高频题。核心原因：**SSE 比 WebSocket 简单，且完全满足 LLM 流式输出的需求。**

| 维度 | SSE | WebSocket |
|------|-----|-----------|
| **通信方向** | 单向：服务端 → 客户端 | 双向：服务端 ↔ 客户端 |
| **协议** | 纯 HTTP，无需升级 | HTTP → WebSocket 协议升级 |
| **基础设施兼容** | 经过所有 HTTP 代理、CDN、负载均衡器 | 部分代理不支持，需要特殊配置 |
| **连接建立** | 普通 HTTP 请求 | 需要 101 Switching Protocols 握手 |
| **自动重连** | 浏览器原生 `EventSource` 自带 | 需要手动实现 |
| **实现复杂度** | 极低 | 较高 |
| **适用场景** | 实时推送、流式输出、通知 | 即时通讯、协作编辑、游戏 |

LLM 流式输出的特征是：
1. **客户端发一次请求，服务端持续推送**——天然的单向数据流
2. **不需要客户端频繁向服务端发消息**——对话是"一问一答"，不是"实时双向"
3. **需要兼容各种网络环境**——用户可能在公司防火墙后面、用移动网络、经过 CDN

SSE 完美匹配这三个特征。WebSocket 也能做，但属于**过度设计（over-engineering）**——多出来的双向通信能力和连接管理复杂度在这里是负担而不是优势。

> **面试要点**：如果你被问到"为什么 ChatGPT 用 SSE 而不是 WebSocket"，不要只说"单向就够了"，要展开说 HTTP 兼容性、代理友好、自动重连和实现简单这四个工程理由。

### 3.5 EventSource vs fetch + ReadableStream

浏览器提供了原生的 `EventSource` API 来消费 SSE：

```javascript
const es = new EventSource('/api/stream')
es.onmessage = (event) => {
  console.log(event.data) // 直接拿到解析好的 data 内容
}
```

但 LLM API 调用几乎不会用 `EventSource`，原因是：

1. **`EventSource` 只支持 GET 请求**——而 LLM API 需要 POST 发送 messages
2. **`EventSource` 不支持自定义请求头**——无法传 `Authorization: Bearer xxx`
3. **`EventSource` 的自动重连机制有时反而是问题**——LLM 对话的重连需要带上上下文

所以实际工程中，前端一律使用 **`fetch` + `ReadableStream`** 来手动消费 SSE 流。

## 四、服务端：LLM 如何 token-by-token 生成并推送

### 4.1 自回归解码与流式写入

在服务端，LLM 推理引擎（如 vLLM、TensorRT-LLM）在自回归解码的每一步生成一个 token 后，会通过回调或生成器（generator）把 token 交给上层应用。上层应用（通常是 Python FastAPI 或 Node.js Express）负责把每个 token 封装成 SSE 格式写入 HTTP 响应流。

以 Python FastAPI 为例：

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import json

app = FastAPI()

async def generate_tokens(prompt: str):
    """模拟 LLM 逐 token 生成"""
    # 实际场景中这里调用推理引擎
    for token in ["今", "天", "天", "气", "真", "好"]:
        chunk = {
            "choices": [{
                "delta": {"content": token},
                "index": 0
            }]
        }
        yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
        await asyncio.sleep(0.05)  # 模拟推理耗时
    yield "data: [DONE]\n\n"

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    return StreamingResponse(
        generate_tokens(request.prompt),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # 禁用 nginx 缓冲
        }
    )
```

几个关键细节：

1. **`StreamingResponse`**：FastAPI 的特殊响应类，接受一个生成器，每个 `yield` 立即写入响应流
2. **`Cache-Control: no-cache`**：告诉中间代理不要缓存流式响应
3. **`X-Accel-Buffering: no`**：专门针对 nginx 的头部，禁用 nginx 的代理缓冲。没有这个头，nginx 会等响应积攒到一定大小再转发给客户端——流式就白做了
4. **`Connection: keep-alive`**：保持 HTTP 连接不断开

### 4.2 Node.js 服务端的流式写入

Node.js 侧，可以直接操作 `res` 对象：

```javascript
app.post('/chat/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  // 实际场景中这里调用 LLM SDK 的 stream 方法
  for (const token of ['今', '天', '天', '气', '真', '好']) {
    const chunk = JSON.stringify({
      choices: [{ delta: { content: token }, index: 0 }]
    })
    res.write(`data: ${chunk}\n\n`)
    await sleep(50)
  }

  res.write('data: [DONE]\n\n')
  res.end()
})
```

### 4.3 stream: true 到底改变了什么

当客户端传 `stream: true` 时，LLM API 服务端的行为发生了根本变化：

| | stream: false | stream: true |
|---|---|---|
| **响应头** | `Content-Type: application/json` | `Content-Type: text/event-stream` |
| **HTTP Body** | 一个完整的 JSON 对象 | 连续的 SSE 事件流 |
| **传输方式** | 一次性发送 | chunked 分块传输 |
| **客户端处理** | `response.json()` | `response.body.getReader()` |
| **TTFB** | 必须等全部 token 生成完 | 第一个 token 生成完就开始发 |

## 五、客户端：ReadableStream 的工程化消费

这部分是第三十五天代码实践的核心。

### 5.1 核心 API 链路

```javascript
const response = await fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
  body: JSON.stringify({ model: 'deepseek-v4-flash', messages: [...], stream: true })
})

// 第一步：获取响应体的可读流
const reader = response.body.getReader()
// 第二步：创建文本解码器
const decoder = new TextDecoder()
// 第三步：循环读取
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  // value 是 Uint8Array，需要解码为文本
  const text = decoder.decode(value, { stream: true })
  // 第四步：解析 SSE 事件
  // ...
}
```

**`stream: true` 在两个层面出现，含义不同，不要混淆：**

| 出现位置 | 含义 |
|----------|------|
| `body: JSON.stringify({ stream: true })` | 告诉 LLM API 开启流式模式 |
| `decoder.decode(value, { stream: true })` | 告诉 TextDecoder 这是流式解码，保留不完整的多字节字符 |

### 5.2 buffer 管理：为什么要手动拼

流式数据**不一定按完整 SSE 事件边界到达**。网络层的 TCP 分段可能在任意位置切断数据：

```
chunk 1: "data: {\"choices\":[{\"delta\":{\"content\":\"今"
chunk 2: "天\"}}]}\n\ndata: {\"choic"
chunk 3: "es\":[{\"delta\":{\"content\":\"天\"}}]}\n\n"
```

如果不做 buffer 管理，直接用 `JSON.parse(chunk)`，要么解析失败，要么丢失数据。

正确的做法是维护一个 buffer：

```javascript
let buffer = ''

while (!done && reader) {
  const { done: isDone, value } = await reader.read()
  done = isDone
  buffer += decoder.decode(value, { stream: !done })

  const lines = buffer.split('\n')
  buffer = lines.pop() || ''  // 最后一段可能不完整，留到下次

  for (const line of lines) {
    if (!line.startsWith('data:')) continue
    const data = line.slice(5).trim()
    if (data === '[DONE]') { done = true; break }
    const chunk = JSON.parse(data)
    content += chunk.choices[0]?.delta?.content || ''
  }
}
```

完整流程：

```
1. reader.read() 拿到 Uint8Array
2. decoder.decode() 将二进制转为文本
3. 追加到 buffer
4. buffer.split('\n') 按行切分
5. lines.pop() 把最后可能不完整的行存回 buffer
6. 遍历完整行，过滤 data: 前缀
7. JSON.parse 解析，提取 delta.content
8. 累加到展示内容中
```

**为什么 `decoder.decode(value, { stream: true })` 的 `stream` 参数很重要？**

`TextDecoder` 处理多字节字符（如中文、emoji）时，一个字符可能跨越两个 UTF-8 字节序列。如果 TCP 分片刚好把一个 3 字节中文字符切成"前 2 字节 + 后 1 字节"，`{ stream: false }` 会输出乱码替换字符 `�`，而 `{ stream: true }` 会保留不完整序列，等下次解码时拼接。

```javascript
// 模拟：一个中文字符的 UTF-8 编码被切成两段
const encoder = new TextEncoder()
const bytes = encoder.encode('好') // [229, 165, 189]，3 字节

const part1 = bytes.slice(0, 2)    // [229, 165] —— 不完整
const part2 = bytes.slice(2)       // [189]

const decoder = new TextDecoder()
decoder.decode(part1, { stream: true })  // → "" 保留不完整序列
decoder.decode(part2, { stream: false }) // → "好" 拼回完整字符
```

### 5.3 最后一段数据的处理

循环结束时 `reader.read()` 返回 `done: true`，但 `value` 可能还包含最后一段数据（`done: true` 不意味着 `value` 为空）。所以需要在循环退出后处理 buffer 中剩余的内容：

```javascript
// 循环结束后处理 buffer 中剩余的内容
if (buffer) {
  const line = buffer.trim()
  if (line.startsWith('data:')) {
    const data = line.slice(5).trim()
    if (data !== '[DONE]') {
      const chunk = JSON.parse(data)
      content += chunk.choices[0]?.delta?.content || ''
    }
  }
}
```

## 六、生产级进阶

第三十五天的 Demo 是"能跑"级别。生产环境要考虑更多。

### 6.1 AbortController：用户可以中途取消

用户等得不耐烦了，或者发现问错了问题，应该能随时中断流式输出：

```javascript
const abortController = new AbortController()

const response = await fetch(endpoint, {
  method: 'POST',
  headers,
  body: JSON.stringify({ model: '...', messages: [...], stream: true }),
  signal: abortController.signal  // 绑定取消信号
})

// 用户点击"停止生成"按钮
stopButton.onclick = () => {
  abortController.abort()
  reader.cancel()  // 关闭 ReadableStream
}
```

`abortController.abort()` 会让 `fetch` 抛出 `AbortError`，需要用 try/catch 处理：

```javascript
try {
  const response = await fetch(endpoint, { /* ... */, signal: abortController.signal })
  // ...
} catch (err) {
  if (err.name === 'AbortError') {
    console.log('用户取消了请求')
  } else {
    throw err
  }
}
```

### 6.2 错误处理：三种错误类型

流式输出的错误有三类：

| 错误类型 | 发生时机 | 处理方式 |
|----------|----------|----------|
| **HTTP 错误** | fetch 返回非 2xx | 检查 `response.ok`，读取错误信息 |
| **网络中断** | reader.read() 抛出异常 | try/catch，提示用户重试 |
| **SSE 解析错误** | JSON.parse 失败 | 跳过当前 chunk 继续，不要中断整个流 |

稳健的错误处理：

```javascript
async function streamChat(question, apiKey) {
  let reader = null
  try {
    const response = await fetch(endpoint, { /* ... */ })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`API 错误 ${response.status}: ${errorBody}`)
    }

    reader = response.body.getReader()
    // ... 流式读取逻辑
  } catch (err) {
    if (err.name === 'AbortError') return
    console.error('流式请求失败:', err.message)
    throw err
  } finally {
    reader?.releaseLock()  // 确保释放 reader
  }
}
```

### 6.3 断点续传与重连

如果网络中断了，SSE 协议本身支持通过 `id` 字段做断点续传。但 LLM API 通常不这么做——因为 LLM 生成是有状态的，中断后不能从中间续上。

更务实的做法是：

1. **短回答**：直接重试整个请求
2. **长回答**：缓存已生成的内容，重试时把历史内容放入 `messages`，让模型"继续写"

```javascript
// 重试时带上已有的部分回答
const messages = [
  { role: 'user', content: question },
  ...(previousContent ? [{ role: 'assistant', content: previousContent }] : [])
]
```

但要注意：这样做会**消耗额外的 token**（之前的回答会重新计入 context），而且模型不一定能从断点精确续写。

### 6.4 Backpressure（背压）

如果客户端处理速度跟不上服务端生成速度（比如渲染复杂的 Markdown 格式），ReadableStream 内置的背压机制会自动减缓数据读取：

```javascript
// reader.read() 返回的是 Promise
// 如果客户端处理慢，下次 read() 调用就晚
// 浏览器内部的流缓冲区满了就会通知服务端降速（TCP 流控）
```

大多数情况下不需要手动处理背压——HTTP 层的 TCP 流控已经帮我们做了。但如果你的客户端做了大量同步处理（比如实时渲染复杂的富文本），考虑用 Web Worker 把解析和渲染分离。

### 6.5 HTTP/2 与 HTTP/3 的影响

HTTP/2 引入了**多路复用（Multiplexing）**——一个 TCP 连接上可以同时跑多个请求/响应流。这对 SSE 的影响是：

- **好消息**：不再受 HTTP/1.1 的"一个连接一个请求"限制，流式请求不会阻塞其他 API 调用
- **坏消息**：HTTP/2 的流控制更复杂，某些代理可能不完全支持长连接的 SSE 流

HTTP/3（基于 QUIC）进一步降低了连接建立的延迟，对移动网络环境下的流式体验有明显改善。

### 6.6 服务端超时配置

很多反向代理（nginx、AWS ALB、Cloudflare）有默认的超时设置，可能在 LLM 生成完成之前就断开连接：

| 组件 | 默认超时 | 建议值 |
|------|----------|--------|
| nginx `proxy_read_timeout` | 60s | 300s 或更长 |
| AWS ALB `idle_timeout` | 60s | 300s |
| Cloudflare | 100s | Enterprise 可调整 |

如果你的 LLM API 可能生成超过 60 秒（比如长文生成），确保整条链路的超时配置都够大。

## 七、流式输出在 AI 应用架构中的位置

流式输出不只属于 Chatbot。在整个 AI 应用架构中，流式模式可以出现在多个环节：

### 7.1 Agent 工具调用的流式反馈

当一个 Agent 调用工具链（比如：搜索 → 阅读 → 总结），每个步骤都可以流式推送给用户：

```
data: {"type": "thinking", "content": "正在搜索相关文档..."}
data: {"type": "tool_call", "tool": "search", "args": {"query": "..."}}
data: {"type": "tool_result", "tool": "search", "result": "找到 3 条结果"}
data: {"type": "thinking", "content": "正在分析搜索结果..."}
data: {"type": "message", "content": "根据搜索结果..."}
```

这种**过程透明化**不仅能消除等待焦虑，还能让用户在 Agent 走偏时及时介入纠正。

### 7.2 RAG 检索与流式输出的结合

v038 讲了 RAG 的检索增强。在工程上，RAG 的检索阶段（向量搜索）通常很快，可以等检索完成后再开始流式生成：

```
用户提问 → 向量检索（一次性，很快） → 拼接 Prompt → 流式生成（耗时长，需要流式）
```

但也可以反过来——不等检索完成，先把模型生成的第一个 token 推出去，同时在后台做检索。这叫 **Speculative Streaming（推测性流式）**，目前还在研究阶段。

### 7.3 MCP 通信中的流式语义

MCP 协议本身不强制流式传输（它基于 JSON-RPC over stdio/HTTP），但你可以在 MCP Tool 的返回中使用流式语义——比如一个大文件读取工具，可以分批返回内容而不是一次性加载到内存。

## 八、面试要点汇总

### 基础层

1. **为什么要用流式输出？** —— 自回归解码的总耗时长，用户不能忍 30 秒的空白等待。流式不减少总耗时，但 TTFT 让用户立刻感知到"在工作了"。

2. **HTTP 协议层怎么实现流式？** —— `Transfer-Encoding: chunked` 替代 `Content-Length`，每个 chunk 是"长度 + 数据"格式。

3. **SSE 协议是什么？格式是怎样的？** —— Server-Sent Events，`text/event-stream`，`data: ...\n\n` 格式，`[DONE]` 终止。支持 `id`、`event`、`retry` 字段。

### 对比层

4. **SSE vs WebSocket 怎么选？** —— LLM 流式输出是单向数据流（服务端→客户端），用 SSE 更合适：协议更简单、HTTP 代理兼容、浏览器原生自动重连。WebSocket 的双向能力在这里是过度设计。

5. **EventSource vs fetch + ReadableStream？** —— EventSource 只支持 GET、不能自定义请求头。LLM API 需要 POST + Authorization header，所以必须用 fetch + ReadableStream。

### 实现层

6. **ReadableStream 怎么用？** —— `response.body.getReader()` → `reader.read()` 循环 → `TextDecoder` 解码 → buffer 管理 → SSE 行解析 → JSON 增量提取。

7. **为什么要做 buffer 管理？** —— TCP 分段可能在任意位置截断数据。不 buffer 的话，一个 JSON 对象可能被切成两半，`JSON.parse` 直接报错。

8. **`TextDecoder.decode(value, { stream: true })` 的 `stream: true` 是干什么的？** —— 告诉解码器这是流式输入，遇到不完整的多字节字符（如中文 UTF-8 被打断）先保留，等下次解码时拼接。

### 进阶层

9. **怎么取消一个正在进行的流式请求？** —— AbortController + reader.cancel()，用 try/catch 捕获 AbortError。

10. **流断了怎么做重连？** —— 短回答直接重试；长回答可以把已有内容放入 messages 让模型续写，但会额外消耗 token 且不保证精确续写。

11. **nginx 反代 SSE 要注意什么？** —— `proxy_buffering off` 或 `X-Accel-Buffering: no`，`proxy_read_timeout` 设大，否则代理会在超时后断开连接。

12. **说了这么多流式的好处，有没有不适合用流式的场景？** —— 有。需要严格事务性的操作（比如数据库写入确认）、一次性返回的数据量很小（流式的 chunk overhead 反而亏）、或者客户端不支持流式处理（IoT 设备、部分小程序环境）。

## 结语

第三十五天表面上是写了一个 Vue 前端页面来调 DeepSeek 的流式 API。但拆开来看，它触及的问题远远超出了"前端调接口"的范畴：

1. **用户体验层**：TTFT（首 token 延迟）是 AI 产品留存率的命门
2. **应用协议层**：SSE 的 `data:` 格式和 `[DONE]` 终止约定
3. **HTTP 协议层**：chunked transfer encoding 才是流式传输的真正基建
4. **客户端实现层**：ReadableStream + TextDecoder + buffer 管理
5. **生产运维层**：AbortController 取消、代理缓冲禁用、超时配置

在 AI 产品中，流式输出是**第一个 token 的体验**——它决定了用户是觉得"AI 好慢"还是"AI 在思考"。这两种感受对应的用户行为和留存率，天差地别。

如果面试官问："你做过 LLM 流式输出吗？"——

不要只说"我调过 DeepSeek 的 stream 接口"。

你要说："我从 HTTP chunked transfer encoding 到 SSE 协议解析，从 ReadableStream 的 buffer 管理到生产环境的 AbortController 取消和代理缓冲配置，都做过完整的工程链路。"

这一句话，足够面试官在"流式输出"这个考点上打勾。

---

*本篇内容基于第三十五天学习笔记整理，从 HTTP 协议层到应用层，系统性梳理了 LLM 流式输出的原理、设计与工程实践。*
