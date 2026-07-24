// 表单交互组件
import { useState } from 'react'

export default function Todoinput({ onAdd }) {
  console.log(onAdd)
  const [inputValue, setInputValue] = useState('')
  // 当需要报告父组件的时候，执行
  const handleSubmit = (e) => {
    e.preventDefault()
    onAdd(inputValue)
    setInputValue('')
  }
  return (
    <>
    <form className="todo-input" onSubmit={handleSubmit}>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="请输入待办事项"
        autoFocus
      />
      <button type="submit">添加</button>
    </form>
    </>
  )
}