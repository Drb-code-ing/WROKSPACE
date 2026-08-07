import { useTheme } from '../hooks/useTheme'

function Child() {
  const theme = useTheme()
  console.log(theme)

  return (
    <>
      <h1>Child</h1>
      <button className={theme}>按钮{theme}</button>
    </>
  )
}
export default Child