import './App.css'
import { useState } from 'react'
import type { Color } from './model/color'
import ColorBrowser from './components/ColorBrowser'
import ColorPicker from './components/ColorPicker'
import MemberTable from './components/MemberTable'


function App() {
  const [color, setColor] = useState<Color>({
    red: 20,
    green: 240,
    blue: 180,
  })

  return (
    <>
      <ColorBrowser color={color} />
      <ColorPicker color={color} onColorUpdated={setColor} />
      <MemberTable />
    </>
  )
}

export default App
