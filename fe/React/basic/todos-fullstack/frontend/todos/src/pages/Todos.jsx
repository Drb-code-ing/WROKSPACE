import { getTodos } from '../api/todos'
import { useState, useEffect } from 'react'

function Todos() {
  const [todos, setTodos] = useState([])
  useEffect(() => {
    // 立即执行函数
    (
      async () => {
        const data = await getTodos()
        setTodos(data)
      }
    )();
  }, [])

  return (
    <>
      <h1>Todos</h1>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </>
  )
}

export default Todos