import { useState, useEffect } from 'react'

function useMouse() {
  const [x, setX] = useState(null)
  const [y, setY] = useState(null)
  
  const handleMouseMove = (e) => {
    setX(e.clientX)
    setY(e.clientY)
  }
  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove)
    return () => {
      // 函数组件卸载后，不会主动回收
      // 定时器、事件监听器
      document.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return {x, y}
}

export default useMouse