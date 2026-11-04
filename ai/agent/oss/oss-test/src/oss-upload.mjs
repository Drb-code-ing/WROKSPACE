import 'dotenv/config'
import OSS from 'ali-oss'
import fs from 'fs'

const client = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  authorizationV4: true,
  bucket: process.env.OSS_BUCKET,
})

async function putStream() {
  try {
    let stream = fs.createReadStream('./zao.png')
    let result = await client.putStream('aaa/bbb/first.png', stream)
    console.log(result)
  } catch (err) {
    console.error(err)
  }
}

putStream()