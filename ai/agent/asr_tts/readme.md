# 给Agent 加上语音交互：ASR + TTS

常用的Agent 都有语音功能

语音输入会转换为文本(ASR)，大模型的回答通过语音朗读(TTS)，可以切换音色。Agent 开发的必备技术

点击录音，输入一段语音，服务器端通过接口来转文字，之后用大模型生成回答
流式SSE 返回文字，同时用WebSocket 来返回流式语音
这样就可以实现语音输入，流式的文字
为啥不直接用SSE 返回音频呢？
因为SSE 是基于HTTP 协议的，需要转base64才行，而音频是二进制数据，WebSocket 更合适
SSE 是get 请求

Content-Type: text/event-stream

## ASR 前端功能
- 静态服务器 @nestjs/serve-static
- 录音功能
  asr.html 用户交互
  navigator.mediaDevices.getUserMedia 获取麦克风权限 进行录音
  MediaRecorder 录音API stream -> chunk
- 二进制音频 提交到nest 服务端
- 服务端再调用腾讯云ASR 返回文本
- 向大模型 发送流式请求 sse
- 显示文本
