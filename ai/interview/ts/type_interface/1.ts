interface User {
  name: string
  age: number
  avatarUrl: string
}
type UserType = {
  name: string
  age: number
  avatarUrl: string
}

const u1:User = {
  name: '张三',
  age: 18,
  avatarUrl: 'https://www.baidu.com',
}
const u2:UserType = {
  name: '李四',
  age: 20,
  avatarUrl: 'https://www.baidu.com',
}

interface Person {
  name: string
}
// 不从零开始 继承Person
interface Employee extends Person {
  job: string
}
// 类型别名
type PersonType = {name: string}
type EmployeeType = PersonType & {job: string}
const e1:Employee = {
  name: '张三',
  job: '前端开发',
}
const e2:EmployeeType = {
  name: '廖昊',
  job: '马化腾女婿',
}