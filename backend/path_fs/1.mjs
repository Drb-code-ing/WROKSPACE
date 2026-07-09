// node 的内置模块 join, resolve 区别
import path from 'path'

// join 是路径拼接 简陋
console.log(path.join('a', 'b', 'c'))
// 根目录，src/, assets/ 静态资源
console.log(path.join(process.cwd(), '/hello', 'world'))
console.log(path.resolve('a', 'b', 'c'))// 绝对路径
console.log(path.resolve('/hello', 'world', './a', 'b'))// E:\hello\world\a\b 如果传入了绝对路径，则已传入的绝对路径为准
console.log(path.join('/hello', 'world', './a', 'b'))// \hello\world\a\b
console.log(path.resolve('/hello', 'world', '../a', 'b'))// E:\hello\a\b