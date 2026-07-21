// 返回jsx 的函数就是组件
// 函数接受参数，复用组件的时候，进度、文件、大小不一样
// 组件的属性 html 属性的方式传递进来的 props
function Progress({ text, percentage, total }) {
  return (
    <div>
      <p>{text}</p>
      <p>{percentage}%</p>
      <p>{total}</p>
    </div>
  )
}

export default Progress
