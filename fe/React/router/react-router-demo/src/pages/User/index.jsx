import { useParams } from 'react-router-dom'

function User() {
  // useParams 必须在 Router 内部的组件中调用
  let { id } = useParams()
  return (
    <div>
      <h1>User {id}</h1>
    </div>
  )
}

export default User