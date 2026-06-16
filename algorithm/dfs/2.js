// 递归的升级版 迭代实现
function dfsPreOrderIter(root) {
  if(!root) return []
  const res = []
  const stack = [root]
  while(stack.length) {
    const node = stack.pop()
    res.push(node.val)
    // 后进先出，先入栈的后出 LIFO
    if(node.right) stack.push(node.right)
    if(node.left) stack.push(node.left)
  }
  return res
}