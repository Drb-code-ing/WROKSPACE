type Greeting = `Hello, ${string}`

const a: Greeting = 'Hello, TypeScript'
const b: Greeting = 'Hi, TypeScript' // 错误

type B = `id-${number}`
const b1: B = 'id-123'
const b2: B = 'id-abc' // 错误
