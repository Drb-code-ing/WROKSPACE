export interface Todo {
  id: string
  title: string
  completed: boolean
}

// 类型别名用type 简单数据类型
export type FilterType = "all" | "completed" | "uncompleted"
