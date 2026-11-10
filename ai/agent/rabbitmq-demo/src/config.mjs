import amqp from 'amqplib'

export const RABBTIMQ_URL = process.env.RABBITMQ_URL ||
  'amqp://admin:Admin%40123456@localhost:5672/'

  export async function connect() {
    // 创建一个TCP 连接 Connection
    const connection = await amqp.connect(RABBTIMQ_URL)
    // 在连接上创建一个通道 Channel
    const channel = await connection.createChannel()
    return { connection, channel }
  }