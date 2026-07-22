function formatBytes(size: number) {
  // 计算应该用哪个单位（0=B, 1=kB, 2=MB...），size为0时直接用B
  // 几次方 
  const i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  return (
    // 1024 的 i次方
    // 把字节数除以对应单位量级，保留两位小数后转回数字
    +(size / Math.pow(1024, i)).toFixed(2) * 1 +
    // 拼接上对应的单位字符串
    ["B", "kB", "MB", "GB", "TB"][i]
  );
}

// 返回jsx 的函数就是组件
// 函数接受参数，复用组件的时候，进度、文件、大小不一样
// 组件的属性 html 属性的方式传递进来的 props
function Progress({ text, percentage, total }) {
  // es12 编程风格 空值合并运算符 ??=
  // 当 percentage 为空时，使用默认值 0
  // 如果传入了 percentage，使用传入的值
  percentage ??= 0
  return (
    <div className="w-full bg-gray-100 text-left rounded-lg overflow-hidden mb-0.5">
      <div style={{width: `${percentage}%`}} className="bg-blue-400 whitespace-nowrap px-1 text-sm">
        {text}
        {percentage.toFixed(2)}%
        {isNaN(total) ? "" : `of${formatBytes(total)}`}
      </div>
    </div>
  )
}

export default Progress
