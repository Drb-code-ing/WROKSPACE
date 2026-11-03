import Redis from 'ioredis'

const redis = new Redis({
  host: 'localhost',
  port: 6380, // 通过docker 映射到6379
  db: 0
})

redis.on('connect', () => {
  console.log('ioredis 连接成功')
})

redis.on('error', (err) => {
  console.error('ioredis 连接错误', err)
})

async function runRedisDemo() {
  // await redis.set('name', '文强')
  // await redis.set('code', '6666', 'EX', 300)
  // console.log('String name:', await redis.get('name'))

  // await redis.hset('user:1011', 'name', '李四', 'age', 28)
  // console.log('Hash user', await redis.hgetall('user:1011'))

  // await redis.lpush('task:list', '任务1', '任务2', '任务3')
  // await redis.rpush('task:list', '任务4')
  // console.log('List', await redis.lrange('task:list', 0, -1))

  // await redis.sadd('tag:set', 'redis', 'nest', 'node', 'nest')
  // console.log('Set', await redis.smembers('tag:set'))

  // await redis.zadd('score:rank', 99, '小明', 95, '小红')
  // console.log('ZSet', await redis.zrange('score:rank', 0, -1))

  const lockKey = 'lock:order:1011'
  const lockResult = await redis.set(lockKey, 'locked', 'NX', 'EX', 10)
  console.log('分布式锁：', lockResult ? '加锁成功' : '加锁失败')
}

runRedisDemo()
  .catch((err) => {
    console.error('demo 执行失败', err)
  })
  .finally(async () => {
    // 所有操作结束后释放连接，否则长连接会占着事件循环导致进程不退出
    await redis.quit()
    console.log('ioredis 连接已关闭')
  })
