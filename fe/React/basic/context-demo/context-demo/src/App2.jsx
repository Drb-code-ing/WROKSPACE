import { useState } from 'react'
import { ThemeContext } from './ThemeContext'
import Page from './components/Page'

function App() {
  const [theme, setTheme] = useState("light")

  return (
    // <>
    //   <Parent>
    //     <Child>
    //       <GrandChild>
    //         <GreatGrandChild />
    //       </GrandChild>
    //     </Child>
    //   </Parent>
    // </>
    
    // 上下文提供者 容器
    // 并不是需要全局，任何地方作为容器使用
    // 默认light, 可以通过value属性自定义
    <ThemeContext.Provider value={theme}>
      <Page />
      <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>切换主题</button>
    </ThemeContext.Provider>
  )
}

export default App
