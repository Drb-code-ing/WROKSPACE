/* JavaScript 执行机制对开发者至关重要。
 * 代码是怎么执行的
*/
showName('李四')
console.log(myname)

var myname = '张三'
function showName(name) {
  var b = 1
  console.log('函数 showName 执行', name)
}
