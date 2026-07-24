export default function TodoStates({ total, active, completed, onClearCompleted }) {
  return (
    <>
    <div className="todo-status">
      <p>Total: {total} | Active: {active} | Completed: {completed}</p>
      {
        completed > 0 && (
          <button
          onclick={onClearCompleted}
          className="clear-btn"
          >
          Clear Completed
          </button>
        )
      }
    </div>
    </>
  )
}