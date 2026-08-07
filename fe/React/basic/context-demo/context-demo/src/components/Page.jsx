import Child from './Child'
// 如果不封装hooks
import { ThemeContext } from '../ThemeContext'
import { useContext } from 'react'

function Page() {
  const theme = useContext(ThemeContext)// 又写了一遍

  return (
    <>
      <h2>Page {theme}</h2>
      <Child />
    </>
  )
}

export default Page
