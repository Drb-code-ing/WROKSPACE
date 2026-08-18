interface User {
  id: number
  name: string
  age: number
  email: string
}
// keyof 类型获取对象的所有属性名
type UserKeys = keyof User
type KeepKeys = Exclude<UserKeys, 'email'> // "id" | "name" | "age"
type MyOmitUser = Pick<User, KeepKeys> // {id: number, name: string, age: number}

