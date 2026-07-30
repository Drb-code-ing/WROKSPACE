import {
  useState,
  useEffect
} from 'react';
import TodoInput from "./components/TodoInput";
import TodoList from "./components/TodoList";
import TodoStats from "./components/TodoStats";
import './App.css';

const  Demo = () => {
  useEffect(() => {
     const interval = setInterval(() => {
       console.log('interval, is here');
     }, 1000)
     return () => {
       console.log('组件卸载前执行，做内存清理工作');
       clearInterval(interval)
     }
  }, [])
  return (
    <>
    Demo
    </>
  )
}

const App = () => {
  const [count, setCount] = useState(0);
  const [todos, setTodos] = useState(() => {
    return JSON.parse(localStorage.getItem('todos')) || []
  }) 
  // 副作用 生命周期
  useEffect(() => {
    // 响应式状态改变，组件要热更新， 将函数重新执行一遍
    // 挂载后， 更新
    console.log('挂载后执行');
    console.log('count改变也会执行');
  }, [count]);
  useEffect(() => {
    // 响应式状态改变，组件要热更新， 将函数重新执行一遍
    // 挂载后， 更新
    console.log('挂载后执行');
    console.log('每次更新都执行');
  });
  useEffect(() => {
    // 响应式状态改变，组件要热更新， 将函数重新执行一遍
    // 挂载后
    console.log('只会在挂载后执行');
  }, []); // 依赖项数组
  useEffect(() => {
    // 响应式状态改变，组件要热更新， 将函数重新执行一遍
    // 挂载后， 更新
    console.log('挂载后执行');
    console.log('todos 更新后执行');
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos]);
  console.log('组件函数运行，组件准备渲染');
  

  const countBy = () => {
    setCount(count+1);
  }
  

  // 添加todo的方法 父组件管理 
  const addTodo = (text) => {
    if (text.trim() === '') return 
    // 全新的状态
    setTodos([
      {id: + Date.now(), text, completed: false },
      ...todos
    ])
    localStorage.setItem('todos', JSON.stringify(todos))
  }

  const toggleTodo = (id) => {
    // 全新的状态
    setTodos(todos.map(todo => 
      todo.id === id 
        ? { ...todo, completed: !todo.completed}
        : todo
    ))
  }

  const deleteTodo = (id) => {
    setTodos(
      todos.filter(todo => todo.id !== id)
    )
  }

  const clearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed));
  }

  const activeCount = todos.filter(t => !t.completed).length;
  const completedCount = todos.length - activeCount;
  
  return (
    <div>
      Count: {count}
      <button onClick={countBy}>count++</button>
      {count % 2 === 0 && <Demo />}
      <h1>My Todo List</h1>
      {/* 自定义事件，   */}
      <TodoInput onAdd={addTodo}/>
      <TodoList 
        todos={todos} 
        onToggle={toggleTodo}
        onDelete={deleteTodo}
      />
      <TodoStats 
        total={todos.length}
        active={activeCount}
        completed={completedCount}
        onClearCompleted={clearCompleted}
      />
    </div>
  )
}

export default App