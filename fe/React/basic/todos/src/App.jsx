import './App.css'
import { useState } from 'react'
import Todoinput from './components/Todoinput'
import TodoList from './components/TodoList'
import TodoStates from './components/TodoStates'

function App() {
  const [todos, setTodos] = useState([
    {
      id: 1,
      text: '吃饭',
      completed: false
    },
    {
      id: 2,
      text: '睡觉',
      completed: false
    }
  ])

  // 添加todo 对方法
  const addTodo = (text) => {
    if(text.trim() === '') return
    // 全新的状态
    setTodos([
      {
        id: +Date.now(),
        text,
        completed: false
      },
      ...todos
    ])
  }

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id
      ? {...todo, completed: !todo.completed}
      : todo
    ))
  }

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  const activeCount = todos.filter(todo => !todo.completed).length
  const completedCount = todos.length - activeCount

  const clearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed))
  }

  return (
    <>
    <div>
      <h1>My Todo List</h1>
      {/* 自定义事件 */}
      <Todoinput onAdd={addTodo} />
      <TodoList todos={todos} onToggle={toggleTodo} onDelete={deleteTodo} />
      <TodoStates 
      total={todos.length} 
      active={activeCount} 
      completed={completedCount} 
      onClearCompleted={clearCompleted} 
      />
    </div>
    </>
  )
}

export default App
