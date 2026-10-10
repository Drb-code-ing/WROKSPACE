// 自动语音识别  Automatic Speech Recognition
// 知识库， 语音先转成文本， 文本向量 匹配 知识库中的文本向量， 找到最相似的文本， 作为识别结果。
import "dotenv/config";
import tencentcloud from "tencentcloud-sdk-nodejs"; // 腾讯云 sdk 
import fs from "fs";

const SECRET_ID = process.env.SECRET_ID;
const SECRET_KEY = process.env.SECRET_KEY;

const AsrClient = tencentcloud.asr.v20190614.Client; // 自动语音识别客户端
const AUDIO_FILE = './output3.mp3';

const client = new AsrClient({
  credential: {
    secretId: SECRET_ID,
    secretKey: SECRET_KEY,
  },
  region: "ap-shanghai", // 服务器区域
  profile: {
    httpProfile: {
      reqMethod: "POST",
      reqTimeout: 30 // 请求超时时间，单位秒
    }
  }
});

async function run() {
  // mp3 二进制 -> base64 -> tencentcloud
  // 读取音频文件内容 并转换为 base64 编码
  const audioBase64 = fs.readFileSync(AUDIO_FILE).toString("base64");

  const params = {
    EngSerViceType: "16k_zh", // 16k 16bit 1ch 中文
    SourceType: 1, // 1: base64, 2: url
    Data: audioBase64,
    DataLen: Buffer.byteLength(audioBase64),
    VoiceFormat: "mp3"
  }

  try {
    // 调用自动语音识别接口
    const data = await client.SentenceRecognition(params);
    console.log("识别结果:", data.Result);
  } catch(err) {
    console.error("识别失败:", err);
  }
}

run()
  .catch(console.error);