<script setup>
// vue3 组合式 API
// 把相关逻辑放一起
import { ref } from 'vue'

const count = ref(0)// 变量 -> 数据 -> 数据状态(相应式) -> 页面状态(反应在页面上)
const question = ref('以抖音上的奶蛙形象为标准，讲一个关于奶蛙们一起讨论“看到大狗吓得叫”是否合乎周礼的故事')
const content = ref('')
const stream = ref(true)

const update = async () => {
  if (!question.value) return
  content.value = '思考中...'

  const endpoint = 'https://api.deepseek.com/v1/chat/completions'
  const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      messages: [
        {
          role: 'user',
          content: question.value
        }
      ],
      stream: stream.value// llm 接收参数，是否开启流式输出
    })
  })

  if(stream.value) {
    content.value = ''
    // llm 服务器streamAble 对象 数据流
    // response.body 服务端响应体 二进制流 是一个 ReadableStream 对象
    const reader = response.body?.getReader()// 读取器
    const decoder = new TextDecoder()// 文本解码器 二进制流 转换为文本
    let done = false
    let buffer = ''
    // 每次 read() 获取一段二进制数据，done 为 true 表示服务端已关闭流
    while(!done && reader) {
      // 读取到的是二进制流unit8Array 十进制数
      const result = await reader.read()
      done = result.done
      // 流数据可能把一个 JSON 从中间截断，先累积到 buffer 中
      buffer += decoder.decode(result.value, { stream: !done })
      // SSE 事件以换行分隔；最后一段可能不完整，留到下次读取后再解析
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for(const line of lines) {
        // 忽略 SSE 的空行和非 data 消息
        if(!line.startsWith('data:')) continue
        // 去掉前面的data: 前缀，去掉空格，只保留 JSON 字符串
        const data = line.slice(5).trim()
        // DeepSeek 用 [DONE] 表示流式响应完成
        if(data === '[DONE]') {
          done = true
          break
        }
        // 每个 data 行是一个增量 JSON，只追加本次新增的文本
        const chunk = JSON.parse(data)
        content.value += chunk.choices[0]?.delta?.content || ''
      }
    }
  } else {
    const data = await response.json()
    content.value = data.choices[0].message.content
  }
}

// RefImpl 响应式对象，值是count.value
// count.value 改变的时候，页面上绑定了count的地方会局部热更新
// console.log(count, count.value)
</script>

<template>
  <div class="container">
    <div>
      <label>输入：</label><input class="input" v-model="question" />
      <button @click="update">提交</button>
    </div>
    <div class="output">
      <div><label>Streaming</label><input type="checkbox" v-model="stream"/></div>
      <div>{{ content }}</div>
    </div>
  </div>
</template>

<style scoped>
/* 文档流 是页面布局的基础
   从上到下，从左到右，流式布局
   每个盒子在文档流有自己的位置和大小
   开启新的格式化上下文
*/
.container {
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: start;
  height: 100vh;
  font-size: 0.85rem;/* 移动端适配，等比例  相对html 标签 */
}

.input {
  width: 200px;
}

.output {
  margin-top: 10px;
  min-height: 300px;
  width: 100%;
  text-align: left;
}

button {
  padding: 0 10px;
  margin: 6px 0 0 6px;
}
</style>
