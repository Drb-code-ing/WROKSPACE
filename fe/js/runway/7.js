function foo() {
  var a = 1
  var b = 2
  {
    // 词法环境里做块级作用域的文章
    let b = 3
    var c = 4
    let d = 5
    console.log(a, b)// 1 3
  }
  console.log(b)// 2
  console.log(c)
  console.log(d)
}
foo()
