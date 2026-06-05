function varTest() {
  var x = 1// 全局变量,var在变量环境
  if(true) {
    let x = 2// let支持块级作用域，在词法环境
    console.log(x)
  }
  console.log(x)
}
varTest()// 2 1