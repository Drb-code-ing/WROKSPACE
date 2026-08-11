// 接口 OOP 核心概念
// 抽象
// js 原型式，函数是一等对象
// ts 大型企业级开发强类型语言，类java 传统的OOP思路
// class extends implements interface
// 面向接口的编程 父子组件数据接口
interface User {
  name: string
  age: number
  avatarUrl: string
}
interface UserCardProps {
  user: User
  onEdit: (id: number) => void
}


function UserCard ({ user, onEdit }: UserCardProps) {

  return (
    <>
      
    </>
  )
}

export default UserCard
