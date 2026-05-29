// 全局作用域
{
  // 代码块
  // 声明了变量，属于当前块级作用域
  const name = "张三"
  // console.log(name)
}
// 退出了循环，才是10
for (var i = 0; i < 10; i++) {
  // 同步代码
  console.log(i)
  // 异步代码
  setTimeout(() => {
    console.log(`This number is ${i}`)
  }, 1000)
}