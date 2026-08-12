import { Link } from 'react-router-dom'

function Nav() {

  return (
    <nav style={{padding:10, borderBottom:'1px solid #ccc'}}>
      <Link to="/">Home</Link>
      <Link to="/todos">Todos</Link>
    </nav>
  )
}

export default Nav