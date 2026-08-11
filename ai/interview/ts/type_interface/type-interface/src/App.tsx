import UserCard from './cpmponents/UserCard'


function App() {

  return (
    <>
      <UserCard user={
        {
          name: '张三',
          age: 18,
          avatarUrl: 'https://example.com/avatar.jpg'
        }
      } onEdit={() => {}} />
    </>
  )
}

export default App
