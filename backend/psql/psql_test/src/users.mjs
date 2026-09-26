import { query } from './db.mjs'

// user 模块 创建用户
async function createUser(user) {
  // MYSQL 使用的标准SQL ?
  // pg 有些自己的规则 $1
  // RETURNING * 返回插入字段
  const { rows } = await query(
    "INSERT INTO users (name) VALUES ($1) RETURNING *",
    [user.name,]
  )

  return rows[0]
}

// 根据 id 查询用户
async function getUserById(id) {
  const { rows } = await query("SELECT * FROM users WHERE id = $1", [id])
  return rows[0] ?? null
}

// 查询所有用户
async function getAllUsers() {
  const { rows } = await query("SELECT * FROM users ORDER BY id")
  return rows
}

// 更新用户
async function updateUser(id, name) {
  const { rows } = await query(
    "UPDATE users SET name = $1 WHERE id=$2 RETURNING *",
    [name, id]
  )
  return rows[0] ?? null
}

// 删除用户
async function deleteUser(id) {
  const { rows } = await query(
    "DELETE FROM users WHERE id=$1",
    [id]
  )
  return rowCount > 0
}

export { createUser, getUserById, getAllUsers, updateUser, deleteUser }
