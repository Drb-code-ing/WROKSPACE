import { useState } from 'react'
import TodoInput from './components/TodoInput.jsx'
import TodoList from './components/TodoList.jsx'

function App() {
  const [tasks, setTasks] = useState([])

  function addTask(text) {
    setTasks((currentTasks) => [
      ...currentTasks,
      { id: crypto.randomUUID(), text, completed: false },
    ])
  }

  function toggleTask(id) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    )
  }

  function deleteTask(id) {
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== id),
    )
  }

  function reorderTasks(activeId, overId) {
    if (!overId || activeId === overId) return

    setTasks((currentTasks) => {
      const activeIndex = currentTasks.findIndex((task) => task.id === activeId)
      const overIndex = currentTasks.findIndex((task) => task.id === overId)

      if (activeIndex === -1 || overIndex === -1) return currentTasks

      const nextTasks = [...currentTasks]
      const [movedTask] = nextTasks.splice(activeIndex, 1)
      nextTasks.splice(overIndex, 0, movedTask)
      return nextTasks
    })
  }

  const completedCount = tasks.filter((task) => task.completed).length

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-12 text-slate-900 sm:py-20">
      <section className="mx-auto w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-10">
        <header className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold tracking-[0.2em] text-slate-400">
              TODAY
            </p>
            <h1 className="text-4xl font-bold tracking-tight">我的待办</h1>
          </div>
          <p className="pb-1 text-sm text-slate-400">
            已完成 {completedCount} / {tasks.length}
          </p>
        </header>

        <TodoInput onAdd={addTask} />

        <div className="my-8 h-px bg-slate-100" />

        <TodoList
          tasks={tasks}
          onToggle={toggleTask}
          onDelete={deleteTask}
          onReorder={reorderTasks}
        />
      </section>
    </main>
  )
}

export default App
