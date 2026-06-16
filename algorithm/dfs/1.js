function dfs(root, res=[]) {
  if(!root) return res// 退出条件
  res.push(root.val)
  dfs(root.left, res)
  dfs(root.right, res)
  return res// 返回结果
}