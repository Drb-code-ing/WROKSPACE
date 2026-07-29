import './App.css'
import * as React from 'react'
import HellowComponent from './components/Hello'

// 写js一样写ts
const App:React.FC = () => {
  const [name, setName] = React.useState('defaultUserName')
  const [editingName, setEditingName] = React.useState('defaultUserName')

  const loadUserName = () => {
    setTimeout(() => {
      setName('name from async call')
    }, 2000)
  }

  React.useEffect(() => {
    // 组件挂载后
    // 组件第一要素是赶快显示出来，让用户觉得快
    loadUserName()
  }, [])

  const setUsernameState = () => {
    setName(editingName)
  }
   return (
    <>
      <HellowComponent userName={name}/>
    </>
  )
}

export default App
