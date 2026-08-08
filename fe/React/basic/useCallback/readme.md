# useCallback & useMemo
性能优化而生的hook

## 问题
- 父组件重新渲染，子组件也会重新渲染
  更新
  带来性能的浪费
  希望不相关的属性发生改变时，拒绝重新渲染
  memo  memorize 缓存