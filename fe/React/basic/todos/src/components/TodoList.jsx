// 列表组件
export default function TodoList({ todos, onToggle, onDelete }) {
  return (
    <>
    <ul className="todo-list">
      {
        todos.length === 0 ? <li className="empty">暂无待办事项</li> 
        : todos.map(todo => (
          <li 
          key={todo.id}
          className={todo.completed ? 'completed' : ''}>
          <label>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => onToggle(todo.id)}
            />
            <span>{todo.text}</span>
          </label>
          <button onClick={() => onDelete(todo.id)}>删除</button>
          </li>
        ))
      }
    </ul>
    </>
  )
}
