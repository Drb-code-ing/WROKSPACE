import {
  useState,
  memo
} from 'react';

function RegularChild({name}) {
  console.log('渲染了RegularChild');
  return (
    <>
      <h1>{name}</h1>
    </>
  )
}
// memo 高阶函数
const MemoChild = memo(({name}) => {
  console.log('渲染了MemoChild')
  return (
    <>
      <h1>Hello {name}</h1>
    </>
  )
})

function App() {
  const [count, setCount] = useState(0);
  console.log('App 组件渲染');
  const [name, setName] = useState('少林队');
  return (
    <>
      <button onClick={()=>setCount(count+1)}>点击计数{count}</button>
      <button onClick={()=>setName("峨眉队")}>改变名字</button>
      <RegularChild name={name}/>
      <MemoChild name={name}/>
    </>
  )
}
export default App