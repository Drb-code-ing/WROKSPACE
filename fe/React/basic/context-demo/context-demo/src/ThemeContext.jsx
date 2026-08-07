// 将创建一个Theme 上下文，为深层次的组件树提供主题共享数据
import {
  createContext, // 创建上下文
} from 'react'

export const ThemeContext = createContext("light")