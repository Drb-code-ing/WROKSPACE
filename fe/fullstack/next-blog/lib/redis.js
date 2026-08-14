// node redis 客户端
import Redis from 'ioredis'
// 连接redis数据库
const redis = new Redis()// 默认 NOSQL
// hash  key 字符串ID, 值 note 的序列化字符串
const initialData = {
  "1702459181837": '{"title":"sunt aut","content":"quia et suscipit suscipit recusandae","updateTime":"2023-12-13T09:19:48.837Z"}',
  "1702459182837": '{"title":"qui est","content":"est rerum tempore vitae sequi sint","updateTime":"2023-12-13T09:19:48.837Z"}',
  "1702459188837": '{"title":"ea molestias","content":"et iusto sed quo iure","updateTime":"2023-12-13T09:19:48.837Z"}'
}

export async function getAllNotes() {
  const data = await redis.hgetall('notes')
  if(Object.keys(data).length === 0) {// 获取到空数据，初始化数据
    await redis.hset('notes', initialData)
  }
  return await redis.hgetall('notes')
}