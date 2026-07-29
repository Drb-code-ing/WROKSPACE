import './App.css'
import * as React from 'react'
import Hello from './components/Hello.tsx'
import NameEditComponent from './components/NameEditComponent2.tsx'

const App:React.FC = () => {
  const [username, setUsername] = React.useState('initialName')
  // const setUsernameState = (event) => {
    // setUsername(event.target.value)
  // }

  return (
    <>
      <Hello userName={username} />
      {/* <NameEditComponent username={username} onChange={setUsernameState} /> */}
      <NameEditComponent initialUsername={username} onNameUpdated={setUsername} />
    </>
  )
}

export default App
