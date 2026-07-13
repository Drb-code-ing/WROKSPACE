<template>
  <!-- 会做数据绑定{{}} -->
  <div class="container">
    <div>
      <label>输入：</label>
      <!-- v-model 数据双向绑定 -->
       <input type="text" class="input" v-model="question">
       <!-- 属性绑定 :value 绑定到input 的value 属性上 -->
        <!-- <input type="text" class="input" :value="question"> -->
        <button @click="update">提交</button>
    </div>
    <div>

      <div class="output">
        <div>
          <label>Streaming</label>
          <input type="checkbox" v-model="stream" />
          <div v-if="stream">
            <label>Streaming</label>
          </div>
        </div>
        <div>
          输出：{{ content }}
        </div>
      </div>

    </div>
    <div>当前计数: {{ count }}</div>
    <button @click="count++">增加</button>
  </div>
</template>
<!-- setup 语法糖, 会自动引入vue, 会自动解构出script setup 中的变量 -->
<script setup>
// vue 前端第二框架 react 第一
// vue & react 都是具有组件化思想、数据绑定（data binding）、响应式（reactive）等现代前端开发框架
// 组件化思想，构成页面的最小单位不再是html标签，而是组件
// html 标签是元素，太多了，不好作为一个工作的单元
// css 也一样，css rule
// js dom
// 将一堆html css js 组合在一起，形成一个可复用、好维护的特定业务工作单元 .vue
// 数据绑定思想 template 绑定数据 不需要dom 编程
// fetch 数据，dom innerHTML 渲染数据
// 响应式数据 数据改变了，页面自动更新 reactive
import { ref } from 'vue'
const stream = ref(false)
const content = ref('')// llm response 内容


let count = ref(0)
setTimeout(() => {
  count.value = 100
}, 5000)

let question = ref('讲一个关于奶龙的故事')
// 点击提交按钮，更新question
// console.log(import.meta.env.VITE_DEEPSEEK_API_KEY)

const update = async () => {
  // console.log(question.value)
  if(!question.value) return // 不能为空
  content.value = '思考中...'

  const endpoint = 'https://api.deepseek.com/v1/chat/completions'
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`
  }

  const response = await fetch(endpoint, {
    method: 'POST',// 加密，更安全 请求体
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
    content.value = ''// 流式输出，清空内容
    // 响应体对象，一批批的token 流式输出
    // 流式读取相应体 读取器reader
    console.log(response.body)// readable stream
    // 二进制流 可读的流
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
    // 非流式输出
    const data = await response.json()
    content.value = data.choices[0].message.content
  }
}
</script>
<!-- scoped 会将样式作用域限制在当前组件中 -->
<style scoped>
.container {
  width: 100%;    
  height: 100%;
}
</style>
