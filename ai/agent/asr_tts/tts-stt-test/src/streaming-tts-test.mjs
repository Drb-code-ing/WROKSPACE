import "dotenv/config";
import WebSocket from "ws";// tencent 流式tts ws 协议
import crypto from "node:crypto"; // 加密
import fs from "node:fs"; // 文件操作

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

async function sendTexts(ws, sessionId) {
  for(let i = 0; i < TEXTS.length; i++) {
    ws.send(JSON.stringify({
      SessionId: sessionId,
      message_id: `msg_${i}`,
      action: "ACTION_SYNTHESIS", // 指令：把 data 里的文字拿去合成语音
      data: TEXTS[i],
    }));
    console.log(`[发送] 文本: ${TEXTS[i]}`);
    if(i < TEXTS.length - 1) await sleep(TEXT_INTERVAL_MS);
  }
  // 发送完所有文本后，发送 complete 指令，通知服务端合成结束
  ws.send(JSON.stringify({
    SessionId: sessionId,
    action: "ACTION_COMPLETE",
  }));
  console.log(`[文本] 已发送 complete 指令，通知服务端合成结束`);
}

function streamTTS() {
  if (!SECRET_ID || !SECRET_KEY || !APP_ID) {
    throw new Error("请先在 .env 文件中配置 SECRET_ID, SECRET_KEY, APP_ID");
  }
  const { url, sessionId } = buildWsUrl();
  const ws = new WebSocket(url); // 连接 WebSocket 服务器
  // 水管子，一头扎入目标文件，一头连到 ws 服务器，用于写入音频数据，写入文件
  const writeStream = fs.createWriteStream(OUTPUT_FILE, { flags: 'w' });
  let totalBytes = 0;
  let closed = false;
  let sent = false;

  // closeAll：统一收口函数，无论哪条路径结束（写完/final/报错）都调它，保证只清理一次
  const closeAll = () => {
    if (closed) return; // 幂等守卫：已经收过尾就不再重复执行
    closed = true;
    // 关闭写入流，结束文件写入
    // end() 的回调：等缓冲区数据全部落盘后才触发，此时打印统计才是准的
    writeStream.end(() => {
      console.log(`[完成] 音频已保存至${OUTPUT_FILE}, 共写入${totalBytes}字节`);
    });
    // readyState 按 0连接中→1已连接→2关闭中→3已关死 排序
    // < 3 = "还没彻底关死"才补一刀 close；已关死(CLOSED=3)再调无意义，跳过
    if(ws.readyState < WebSocket.CLOSED) ws.close(); // 关闭 ws 连接
  }
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
        await sendTexts(ws, sessionId)
      }
      if(msg.code && msg.code !== 0) {
        console.log(`[错误] 服务器返回错误码: ${msg.code}, 错误描述: ${msg.msg}`)
        closeAll();
      } else if (msg.final === 1) { // 合成结束
        console.log('[完成] 服务器返回最终数据')
      }
    } catch (error) {
      console.error("[错误] 处理消息时出错:", error);
    }
  })

  ws.on('error', (error) => {
    console.error("[错误] WebSocket 错误:", error);
    closeAll();
  })

  ws.on('close', (err) => {
    console.log("[关闭] WebSocket 已关闭，错误码:", err);
    closeAll();
  })
}

streamTTS();