<script setup>
// 一次性 -> 流式  前端 -> bff -> llm 请求
fetch('/api/stream')
 .then(res => res.json())
 .then(data => console.log(data))

// 简洁
import { ref } from 'vue'

const question = ref('')
const stream = ref(false)
const content = ref('')

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
