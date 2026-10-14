// 调用生成器函数不执行函数体 ，只返回“取号器”（AsyncGenerator 对象）
async function* produce() {
  yield '第一段'
  await new Promise(resolve => setTimeout(resolve, 1000));
  yield '第二段'
  await new Promise(resolve => setTimeout(resolve, 1000));
  yield '第三段'
}

(async () => {
  // 得到一个可迭代的生成器对象
  console.log(produce());
  console.log(produce().next()); // Promise {<pending>}
  console.log(await produce().next());
  for await (const chunk of produce()) {
    console.log(chunk); // 每次循环取一个 yield 的值
  }
})();