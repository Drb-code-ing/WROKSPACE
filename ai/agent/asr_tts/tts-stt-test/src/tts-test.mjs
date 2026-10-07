import "dotenv/config";
import tencentcloud from "tencentcloud-sdk-nodejs-tts";
import fs from "node:fs";

const secretId = process.env.SECRETID;
const secretKey = process.env.SECRET_KEY;

const TtsClient = tencentcloud.tts.v20190823.Client;
const client = new TtsClient({
  credential: {
    secretId,
    secretKey
  },
  region: "ap-beijing", // 指定云服务器接入地址
  // 客户端配置，设置HTTP 请求，签名算法等配置
  profile: {
    httpProfile: {
      endpoint: "tts.tencentcloudapi.com"
    }
  }
});

const params = {
  Text: `下班路上， 我还在为晚霞开心。突然电话响起：系统崩了。我的心一下揪紧，
  冲进办公室时几乎是绝望。可当大家一起排查、重启、屏幕终于恢复正常，我长长松了口气，
  笑着说：还好，我们没放弃。`,
  // Text: `hello`,
  SessionId: "session-001",
  VoiceType: 502006, // 女声
  Codec: "mp3"
}

client
 .TextToVoice(params)
 .then(res => {
  // console.log(res); // base64 编码的音频数据
  // 二进制缓冲区
  const audioBuffer = Buffer.from(res.Audio, "base64");
  const outputPath = "./output.mp3"
  // 写入文件
  fs.writeFileSync(outputPath, audioBuffer, (err) => {
    if (err) {
      console.error("写入文件失败:", err);
      return;
    }
    console.log(`音频文件已保存到 ${outputPath}`);
  });
 })