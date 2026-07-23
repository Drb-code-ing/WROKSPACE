import { useState } from 'react'

function TodoInput({ onAdd }) {
  const [text, setText] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const taskText = text.trim()

    if (!taskText) return

    onAdd(taskText)
    setText('')
  }

  return (
    <form className="flex gap-3" onSubmit={handleSubmit}>
      <input
        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:bg-white"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="写下一件要完成的事"
        aria-label="新的待办事项"
      />
      <button
        className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        type="submit"
        disabled={!text.trim()}
      >
        添加
      </button>
    </form>
  )
}

export default TodoInput
