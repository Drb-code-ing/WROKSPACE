<template>
  <!-- 会做数据绑定{{}} -->
  <div class="container">
    <div>
      <label>输入：</label>
      <!-- v-model 数据双向绑定 -->
      <input type="text" class = "input" v-model="question">
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
let count = ref(0)
setTimeout(() => {
  count.value = 100
}, 5000)

let question = ref('讲一个关于中国龙的故事')
</script>
<!-- scoped 会将样式作用域限制在当前组件中 -->
<style scoped>
.container {
  width: 100%;    
  height: 100%;
}
</style>
