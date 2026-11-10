import { connect } from '../config.mjs'
// 交换机名称，Producer 只往Exchange 发消息，从不直接写某个Queue
const EXCHANGE = 'doc.parse.direct'
// direct 行为，把消息发送到指定的Queue，根据routing key 匹配Queue。
async function main() {
  const { connection, channel } = await connect()
  // 声明交换机，指定类型为 direct
  // durable: true 表示交换机在RabbitMQ 重启后会持久化
  await channel.assertExchange(EXCHANGE, 'direct', { durable: true })
  const tasks = [
    {
      routingKey: 'info',
      body: {
        level: 'info',
        text: '文档解析完成'
      }
    },
    {
      routingKey: 'warning',
      body: {
        level: 'warning',
        text: '文档页数过多，耗时较长'
      }
    },
    {
      routingKey: 'error',
      body: {
        level: 'error',
        text: '文档解析失败'
      }
    }
  ]

  for(const task of tasks) {
    channel.publish(
      EXCHANGE,
      task.routingKey,
      Buffer.from(JSON.stringify(task.body)),
      { persistent: true }
    )
    console.log(`[direct producer] 发送 routingKey=${task.routingKey}:`, task.body)
  }

  setTimeout(async () => {
    await channel.close()
    await connection.close()
  }, 500)
}

main().catch(console.error)