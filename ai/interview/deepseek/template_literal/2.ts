// 模版字面量类型
type GetId<T extends string> = T extends `user-${infer Id}` ? Id : never

type A = GetId<'user-12345'>
type B = GetId<'admin-67890'>

const a: A = '12345'
const b: B = '67890' // never