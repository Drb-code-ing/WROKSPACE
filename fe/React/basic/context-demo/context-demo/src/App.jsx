import useMouse from './hooks/useMouse'

function App() {
  const {x, y} = useMouse()

  return (
    <>
      <div style={{height: "100vh", display: "flex", justifyContent: "center", alignItems: "center"}}>
        {x && y ? `鼠标坐标：${x}, ${y}` : "请移动鼠标"}
      </div>
    </>
  )
}

export default App