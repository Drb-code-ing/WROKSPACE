// v8 引擎执行眼里

var myname// 变量提升
// 函数提升(声明提升)
function showName() {
    console.log('函数 showName 执行')
}

showName()
console.log(myname)
myname = '李四'
