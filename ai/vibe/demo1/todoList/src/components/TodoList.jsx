import { DragDropProvider } from '@dnd-kit/react'
import TodoItem from './TodoItem.jsx'

function TodoList({ tasks, onToggle, onDelete, onReorder }) {
  if (tasks.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-slate-400">
        暂无待办，添加第一项吧。
      </p>
    )
  }

  function handleDragEnd(event) {
    if (event.canceled) return

    const activeId = event.operation.source?.id
    const overId = event.operation.target?.id

    if (activeId && overId) {
      onReorder(activeId, overId)
    }
  }

  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      <ul className="space-y-3">
        {tasks.map((task, index) => (
          <TodoItem
            key={task.id}
            task={task}
            index={index}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </DragDropProvider>
  )
}

export default TodoList
