// 连接
// sql 执行
import 'dotenv/config'
import pg from 'pg' // 驱动
// 服务器代码 node 数据库独立
// 瓶颈，同时能连接的服务是有限的
const { Pool } = pg

// 数据库连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// 执行 sql 查询语句
async function query(text, params) {
  return pool.query(text, params)
}

export { pool, query }
