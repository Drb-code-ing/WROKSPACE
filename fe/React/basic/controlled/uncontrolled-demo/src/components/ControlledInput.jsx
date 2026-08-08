import { useState } from 'react'

// 受控组件(响应式状态控制input)
function ControlledInput() {
  const [value, setValue] = useState('')

  return (
    <>
      Controlled Input
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
       />
    </>
  )
}

export default ControlledInput