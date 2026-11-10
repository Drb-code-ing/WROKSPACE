import { connect } from '../config.mjs'
// 交换机名称，Producer 只往Exchange 发消息，从不直接写某个Queue
const EXCHANGE = 'doc.parse.fanout'
// fanout 行为，把消息广播给所有绑定了该交互机的Queue，完全忽略routing key。
async function main() {
  const { connection, channel } = await connect()
  // 声明交换机，指定类型为 fanout
  // durable: true 表示交换机在RabbitMQ 重启后会持久化
  await channel.assertExchange(EXCHANGE, 'fanout', { durable: true })
  const message = {
    docId: `doc-${Date.now()}`,
    markdown: '# Hello RAG \n\n 这是解析后的 Markdown 内容',
    source: 'report.pdf',
  }
  // 发布消息到交换机，指定路由键为空
  // persistent: true 表示消息在RabbitMQ 重启后会持久化
  channel.publish(EXCHANGE, '', Buffer.from(JSON.stringify(message)), { persistent: true })

  setTimeout(async () => {
    await channel.close()
    await connection.close()
  }, 500)
}

main().catch(console.error)