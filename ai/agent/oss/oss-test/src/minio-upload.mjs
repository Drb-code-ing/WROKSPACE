import 'dotenv/config'
import fs from 'fs'
import * as Minio from 'minio'

const minioClient = new Minio.Client({
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY_ID,
  secretKey: process.env.MINIO_SECRET_KEY_SECRET,
})

async function putStream() {
  try {
    let stream = fs.createReadStream('./zao.png')
    let result = await minioClient.putObject('xiong', 'ccc/ddd/hello.png', stream)
    console.log(result)
    console.log('上传成功')
  } catch (err) {
    console.error(err)
  }
}

putStream()
