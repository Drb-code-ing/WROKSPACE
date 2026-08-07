import {
  useState
} from 'react'
import type { Todo, FilterType } from '../types/todo'

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [filter] = useState<FilterType>("all")
  // 添加任务
  const addTodo = (text: string) => {
    if(!text.trim()) return
    const newTodo: Todo = {
      id: Date.now().toString(),
      title: text.trim(),
      completed: false
    }
    setTodos(todos => [...todos, newTodo])
  }
  // 切换任务状态
  const toggleTodo = (id: string) => {
    setTodos(
      todos => todos.map(todo => {
        return todo.id === id ? {
          ...todo,
          completed: !todo.completed
        } : todo
      })
    )
  }
  // 删除任务
  const deleteTodo = (id: string) => {
    setTodos(
      todos => todos.filter(todo => todo.id !== id)
    )
  }
  // 清除已完成任务
  const clearCompleted = () => {
    setTodos(todos => todos.filter(todo => !todo.completed))
  }
  // 过滤任务
  // const filteredTodos = () => {}

  return {
    todos,
    filter,
    addTodo,
    toggleTodo,
    deleteTodo,
    clearCompleted,
  }
}