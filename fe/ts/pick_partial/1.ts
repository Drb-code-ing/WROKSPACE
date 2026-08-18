interface User {
  id: number
  name: string
  age: number
  email: string
}
// 有什么特性 一个类型挑选一些你需要的字段，形成新的类型？
// 负责项目，区分度
// 大型项目类型消费比较大

// Pick 从类型中挑选一些字段，形成新的类型
type UserPreview = Pick<User, 'id' | 'name'>
const u: UserPreview = {
  id: 1,
  name: '张三',
  // age: 18,
}

// Omit 从类型中排除一些字段，形成新的类型
type UserSafe = Omit<User, 'email'>
const uSafe: UserSafe = {
  id: 2,
  name: '廖昊',
  age: 19,
}

// Partial 所有字段全部可选
type PartialUser = Partial<User>
// patch 修改 对象属性很多
const patchUser: PartialUser = {
  name: '廖昊',
  age: 19,
}

// json key:value  Record<键类型, 值类型>
type Dict = Record<string, number>
const obj: Dict = {a: 1, b: 2}
type ErrorMsgMap = Record<number, string>
// http status code
// 5XX 服务器错误
// 4XX 客户端错误
// 3XX 重定向错误
// 2XX 成功
// 1XX 执行中
const errorMsgMap: ErrorMsgMap = {
  400: '请求参数错误',
  401: '未登录，需要先登录',
  403: '权限不足，禁止访问',
  404: '资源不存在',
  500: '服务器内部错误',
}

function getErrorMsg(code: number) {
  return errorMsgMap[code] ?? '未知错误'
}

function fn() {return {x:1, y:2}}
// ReturnType<函数类型> 函数返回值类型
type fnReturn = ReturnType<typeof fn>
// 联合类型
type All = "id" | "name" | "age" | "email"
// Exclude<联合类型, 排除的类型> 排除联合类型中的指定类型
type AfterExclude = Exclude<All, "email"> // "id" | "name" | "age"
// Omit 处理对象接口 | Exclude 处理联合类型