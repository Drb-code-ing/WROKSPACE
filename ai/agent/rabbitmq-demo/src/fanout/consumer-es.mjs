import { connect } from '../config.mjs'

const EXCHANGE = 'doc.parse.fanout'
// 本消费者专属队列 es
const QUEUE = 'doc.elasticsearch'

async function main() {
  const { channel } = await connect()

  await channel.assertExchange(EXCHANGE, 'fanout', { durable: true })
  await channel.assertQueue(QUEUE, { durable: true })

  // 绑定队列到交换机，指定路由键为空
  await channel.bindQueue(QUEUE, EXCHANGE, '')
  console.log(`[fanout] ES 消费者监听: ${QUEUE}`)

  channel.consume(QUEUE, (msg) => {
    if(!msg) return

    const data = JSON.parse(msg.content.toString())
    console.log(`[es] 收到消息，写入Elasticsearch`, data.docId, data.source)

    // 手动确认消息
    channel.ack(msg)
  })
}

main().catch(console.error)
