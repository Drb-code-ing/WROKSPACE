 import { useRef } from 'react'

// useRef(创建一个Ref对象)
function UncontrolledInput() {
  const inputRef = useRef(null)
  const handleClick = () => {
    console.log(inputRef.current.value)
  }

  return (
    <>
      Uncontrolled Input
      <input
        type="text"
        ref={inputRef}
      />
      <button onClick={handleClick}>获取输入值</button>
    </>
  )
}

export default UncontrolledInput