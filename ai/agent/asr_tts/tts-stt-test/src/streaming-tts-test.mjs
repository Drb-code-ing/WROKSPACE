import "dotenv/config";
import WebSocket from "ws";// tencent 流式tts ws 协议
import crypto from "node:crypto"; // 加密
import fs from "node:fs";

const SECRET_ID = process.env.SECRET_ID;
const SECRET_KEY = process.env.SECRET_KEY;
const APP_ID = process.env.APP_ID;

const VOICE_TYPE = 101001;
const OUTPUT_FILE = "output3.mp3";
const TEXT_INTERVAL_MS = 3000;


const TEXTS = [
  "傍晚我还在为晚霞开心",
  "突然电话响起：系统崩了",
  "我心里一沉冲回办公室",
  "好在大家一起排查后终于恢复",
  "我长长松了口气"
];

// 等待指定时间 await sleep(1000); // 等待1秒
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function buildWsUrl() {
  // ---------- 第一步：准备基础信息 ----------
  const now = Math.floor(Date.now() / 1000); // 得到当前时间秒数 向下取整
  // 随机会话ID：标识本次连接，方便服务端追踪，也防止重放
  const sessionId = `session_${now}_${Math.random().toString(36).slice(2)}`;

  // ---------- 第二步：组装请求参数（签名就是对它们算的） ----------
  const params = {
    Action: "TextToStreamAudioWSv2", // 文本到流式声音 基于WebSocket 协议
    AppId: parseInt(APP_ID),
    Codec: "mp3",
    Expired: now + 3600,
    SampleRate: 16000, // 采样率 16kHz 16000Hz
    SecretId: SECRET_ID,
    SessionId: sessionId,
    Speed: 0,
    Timestamp: now,
    VoiceType: VOICE_TYPE,
    Volume: 5,
  }
  // ---------- 第三步：拼出"待签名串" ----------
  // 参数按字典序排序（服务端用同样规则重排后验签，顺序不对必失败）
  const sortedKeys = Object.keys(params).sort();
  // 排序后拼成 k1=v1&k2=v2&... 的形式
  const signStr = sortedKeys.map(key => `${key}=${params[key]}`).join("&");
  // 腾讯规定格式：GET + 主机 + 路径 + ? + 参数串（三段之间没有分隔符）
  const rawStr = `GETtts.cloud.tencent.com/stream_wsv2?${signStr}`;
  // 计算签名
  // 1. 对 rawStr 进行 SHA1 加密
  // 2. 对加密结果进行 Base64 编码
  // ---------- 第四步：用 SecretKey 算 HMAC-SHA1 签名（盖章） ----------
  // HMAC = 带"钥匙"的哈希：只有持有 SecretKey 的人能算出同样结果
  const signature = crypto
  .createHmac("sha1", SECRET_KEY)
  .update(rawStr)
  .digest("base64");

  // ---------- 第五步：把签名混入参数，生成最终连接地址 ----------
  const searchParams = new URLSearchParams({
    ...params,
    Signature: signature, // 签名本身也作为一个 query 参数传给服务端
  });

  return {
    sessionId,
    url: `wss://tts.cloud.tencent.com/stream_wsv2?${searchParams.toString()}`,
  }
}

function streamTTS() {
  if (!SECRET_ID || !SECRET_KEY || !APP_ID) {
    throw new Error("请先在 .env 文件中配置 SECRET_ID, SECRET_KEY, APP_ID");
  }
  const { url, sessionId } = buildWsUrl();
  const ws = new WebSocket(url); // 连接 WebSocket 服务器
  let totalBytes = 0;
  let closed = false;
  let sent = false;

  const closeAll = () => {}
  // 连接成功
  ws.on('open', () => {
    console.log("[连接] WebSocket 已建立，等待服务器就绪...");
  })
  // 有消息了
  ws.on("message", async (data, isBinary) => {
    if (isBinary) {
      writeStream.write(data)
      totalBytes += data.length;
      return;
    }
    // 发送完了 消息 报错
    try {
      const msg = JSON.parse(data.toString());
      console.log("[收到消息]", JSON.stringify(msg));
      // 服务器就绪 可以发送文本了
      if(msg.ready === 1 && !sent) {
        sent = true
      }
      if(msg.code && msg.code !== 0) {
        console.log(`[错误] 服务器返回错误码: ${msg.code}, 错误描述: ${msg.msg}`)
      } else if (msg.final === 1) {
        console.log('[完成] 服务器返回最终数据')
      }
    } catch (error) {
      console.error("[错误] 处理消息时出错:", error);
    }
  })
}

streamTTS();