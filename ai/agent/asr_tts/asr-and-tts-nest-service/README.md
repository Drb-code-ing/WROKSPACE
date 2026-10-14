# nestjs 全栈 tts_asr

- 创建项目
- 环境变量配置
  npm i @nestjs/config

## AI 模块
  nest g module|service|controller ai 模块
  cli 能力强大

  ai 模块是基础模块  /chat/stream  流式文本
  nest g resource xxx --no-spec  资源的增删改查  表 -> CRUD
  ai 模块没有crud，nest g module|service|controller ai --no-spec

- 支持流式输出的AI 模块
- CHAT_MODEL llm 实例
  - nest 为了好维护，统一管理，方便切换 从实例升级为AI 模块提供服务
  - provide: 'CHAT_MODEL' 它可以被 ai.service 注入
  - useFactory: 工厂模式，支持自定义provide，函数返回实例
  - 依赖.env 注入ConfigService
    - 引入ConfigService 模块
    - inject 注入
      不需要手动 new 实例，直接使用 provide 的实例即可

## Speech 模块
- asr
- 流式 tts