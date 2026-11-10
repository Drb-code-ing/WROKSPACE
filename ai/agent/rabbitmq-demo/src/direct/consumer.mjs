import { connect } from '../config.mjs'

const EXCHANGE = 'doc.parse.direct'
const ROUTING_KEY = process.argv[2] || 'info'
// 本消费者专属队列
const QUEUE = `doc.task.${ROUTING_KEY}`

async function main() {
  const { channel } = await connect()

  await channel.assertExchange(EXCHANGE, 'direct', { durable: true })

  await channel.assertQueue(QUEUE, { durable: true })

  // 绑定队列到交换机，指定路由键为 ROUTING_KEY
  await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY)
  console.log(`[direct] 消费者监听: ${QUEUE}`)

  channel.consume(QUEUE, (msg) => {
    if(!msg) return

    const data = JSON.parse(msg.content.toString())
    console.log(`[direct/${ROUTING_KEY}] 收到消息`, data)

    // 手动确认消息
    channel.ack(msg)
  })
}

main().catch(console.error)
