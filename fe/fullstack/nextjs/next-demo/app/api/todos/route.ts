// next.js 除了use client，都是后端
// /api 数据接口，仍然满足app router 约定
// route.ts 返回json 数据接口
import type { Todo } from '../../todos/types'

const todos: Todo[] = [
  {id: 1, content: '学习AppRouter', completed: true},
  {id: 2, content: 'next.js 个人官网开发', completed: false},
]
// api/todos get 请求 restful api
export async function GET() {
  return Response.json(todos)
}

export async function POST(req: Request) {
  const body = await req.json()
  const newTodo = {
    id: +Date.now(),
    content: body.content,
    completed: false,
  }
  todos.push(newTodo)
  return Response.json(newTodo)
}