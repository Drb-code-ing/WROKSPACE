// 自定义hooks
// 比普通函数的封装多的地方是可以将react 响应式，副作用业务等封装进去
// 在Provider 里面任何层级的组件 多个地方消费数据，模块化抽离放到hooks
import {
  ThemeContext
} from '../ThemeContext'
import { useContext } from 'react'

// 约定已use开头
export function useTheme() {
  return useContext(ThemeContext)// 消费上下文
}
