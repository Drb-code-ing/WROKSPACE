// todos 状态的子仓 大型项目
// 中小型还是用传统的状态共享
import { create } from 'zustand'
// create 是一个高阶函数，接收一个函数作为参数
// 返回值也是一个函数
export const useTodosStore = create(set => ({
  todos: [],
  // actions
  setTodos: ({todos}) => {
    set({todos})
  }
}))