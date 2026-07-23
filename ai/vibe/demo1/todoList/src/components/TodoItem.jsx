import { useSortable } from '@dnd-kit/react/sortable'

function TodoItem({ task, index, onToggle, onDelete }) {
  const { ref, isDragging } = useSortable({ id: task.id, index })

  return (
    <li
      ref={ref}
      className={`group flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-4 shadow-sm transition hover:border-slate-200 hover:shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <input
        className="h-5 w-5 shrink-0 accent-slate-900"
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        aria-label={`标记“${task.text}”完成`}
      />
      <span
        className={`min-w-0 flex-1 break-words ${
          task.completed ? 'text-slate-400 line-through' : 'text-slate-800'
        }`}
      >
        {task.text}
      </span>
      <button
        className="rounded-lg px-3 py-2 text-sm font-medium text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
        type="button"
        onClick={() => onDelete(task.id)}
      >
        删除
      </button>
    </li>
  )
}

export default TodoItem
