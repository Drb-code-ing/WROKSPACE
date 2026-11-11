# NestJS + 阿里云 OSS：从「上传一张图」到「安全地上传一张图」

> 学习笔记 · AI 画板（多模态 Agent 的前半段）
>
> 这个项目叫 ai-canvas：用户输入一句话（可选再传一张原图），后端调用多模态模型生成/编辑图片。但真正难的从来不是调模型，而是**图片怎么安全地进出对象存储**。这篇把 NestJS 侧的工程骨架、OSS 服务端签名直传、以及我实际踩过的坑全部串起来。

---

## 一、业务链路：为什么图片不能直接塞给模型

```
用户 ──上传原图──▶ OSS（拿到 URL）
                      │
用户 ──prompt─────▶ NestJS ──带图片 URL 调模型──▶ 多模态模型
                      │
                      └──结果图写回 OSS──▶ 返回前端
```

三个理由让图片必须先落 OSS：

1. **带宽**：5MB 的图 base64 之后约 6.7MB，塞进 JSON body 会让请求体暴涨。
2. **成本**：大模型按 token 计费，图片走 URL 引用比内联便宜得多。
3. **上下文**：同一张图会被多轮复用，落成 URL 后只需传一个字符串。

所以 OSS 在这里不是「存文件的地方」，而是**把二进制从业务链路里摘出去的中间层**。

---

## 二、三条上传路线，选哪条

| 方案 | 数据流向 | 优点 | 缺点 |
|---|---|---|---|
| **A. 后端中转** | 浏览器 → NestJS → OSS | 实现最简单，可加密、可审计 | 文件过一遍服务器内存/磁盘，大文件易超时，浪费带宽 |
| **B. 服务端签名 + PostObject**（本项目） | 浏览器 → OSS（后端只发签名） | 不占后端带宽，AK/SK 不出服务端 | 需要配 CORS，前端要拼 formdata |
| **C. STS 临时凭证** | 浏览器 → OSS（后端发临时 token） | 权限粒度最细，可限制到目录/操作 | 要接 STS 服务、角色、Policy，复杂度高 |

我选 B：**一条签名接口 + 浏览器直传**。核心心法是——**AK 可以给前端，SK 永远不能**。签名就是用 SK 算出来的一次性凭证，所以要让 SK 留在服务端。

---

## 三、NestJS 侧的骨架

### 3.1 启动入口

```ts
// src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

### 3.2 根模块：三件事

```ts
// src/app.module.ts
imports: [
  AiModule,
  // ① 把 public/ 当静态站点托管，前端页面和接口同源，省掉 CORS
  ServeStaticModule.forRoot({
    rootPath: join(__dirname, '..', 'public'),
    exclude: ['/ai/*path'],   // 关键：别把 /ai 开头的接口请求也交给静态目录
  }),
  // ② 全局配置模块，自动加载 .env
  ConfigModule.forRoot({ isGlobal: true }),
]
```

`exclude: ['/ai/*path']` 这个坑很隐蔽：不加的话 `/ai/oss/upload-signature` 会先进静态文件处理，接口根本收不到请求。

### 3.3 依赖注入的三层

```
AiController  ──注入──▶  AiService  ──注入──▶  OssService
   （路由）              （业务编排）           （OSS 客户端与签名）
```

```ts
@Module({
  controllers: [AiController],
  providers: [AiService, OssService],
})
export class AiModule {}
```

Nest 的 DI 靠 `@Injectable()` + 构造函数参数类型（`emitDecoratorMetadata: true` 才能把类型写进元数据）。所以 `tsconfig.json` 里这两项不能关：

```json
"emitDecoratorMetadata": true,
"experimentalDecorators": true
```

### 3.4 控制器

```ts
@Controller('ai')                    // 前缀 /ai
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('/oss/upload-signature')      // GET /ai/oss/upload-signature
  getUploadSignature(@Query('ext') ext?: string) {
    return this.aiService.getUploadSignature(ext);
  }

  @Post('image')                     // POST /ai/image
  createImage(@Body() dto: ImageDto) { ... }
}
```

> 排错小抄：报错 `Cannot GET /ai/image/list` 就是「这个路由不存在」，不是参数问题。Nest 的路由表在启动日志里会全量打印 `Mapped {/ai/xxx, GET} route`，对着它核对最快。

---

## 四、核心：签名的 7 个字段

`OssService` 要做两件事——**建客户端** 和 **算签名**。

### 4.1 客户端初始化

```ts
constructor(private readonly config: ConfigService) {
  this.bucket = this.trimEnv('OSS_BUCKET');
  this.region = this.trimEnv('OSS_REGION');

  this.postClient = new Oss({
    region: this.region,
    accessKeyId: this.trimEnv('OSS_ACCESS_KEY_ID'),
    accessKeySecret: this.trimEnv('OSS_ACCESS_KEY_SECRET'),
    bucket: this.bucket,
  });
}
```

两个细节：

- `getOrThrow()` 而不是 `get()`：缺配置时**启动就崩**，好过运行到签名时才 500。
- `region` 必须写 `oss-cn-beijing`（带 `oss-` 前缀）。写成 `cn-beijing` 会拼出 `bucket.cn-beijing.aliyuncs.com` 这种非法域名，报 `ENOTFOUND`。这是个反复会踩的坑。

### 4.2 生成上传策略

```ts
const key = `${prefix}/${Date.now()}-${randomUUID()}${normalizedExt}`;

const expire = new Date();
expire.setHours(expire.getHours() + 1);

const policy = {
  expiration: expire.toISOString(),          // 绝对时间，UTC
  conditions: [
    ['content-length-range', 0, 10 * 1024 * 1024],  // 大小上限
    ['eq', '$key', key],                            // 只能传这一个 key
  ],
};

const { OSSAccessKeyId, Signature, policy: policyBase64 } =
  this.postClient.calculatePostSignature(policy);
```

返回给前端：

| 字段 | 作用 |
|---|---|
| `host` | 上传目标域名 `https://{bucket}.{region}.aliyuncs.com` |
| `key` | 本次唯一对象路径（含时间戳 + UUID） |
| `url` | 读图地址（私有桶要签名，见第六节） |
| `OSSAccessKeyId` | AK，允许公开 |
| `policy` | Base64 后的策略 JSON |
| `Signature` | **用 SK 对 policy 做的 HMAC-SHA1**，这是唯一不能泄露的东西 |
| `expire` | 过期时间，给前端提示用 |

### 4.3 `conditions` 才是真正的安全边界

很多人以为签名只是「证明是我发的」，其实它同时是**授权范围**。三个常用条件：

| 条件 | 写法 | 拦住的攻击 |
|---|---|---|
| 大小上限 | `['content-length-range', 0, 10485760]` | 传 1GB 文件刷流量 |
| 路径前缀 | `['starts-with', '$key', 'ai-canvas/uploads/']` | 往桶里任意路径写文件 |
| 精确 key | `['eq', '$key', 'xxx.png']` | 覆盖已存在的对象 |

我当前用的是 `eq`（最严格），因为 key 是服务端生成的，前端照抄即可。如果让前端自定义文件名，就得换成 `starts-with`。

> 一个容易忽略的点：**前端的 10MB 限制不是安全边界**。`<input type="file">` 的限制可以被绕过（改 JS、直接调接口），真正的边界在 policy 里。

---

## 五、前端：PostObject 表单怎么拼

```js
const formdata = new FormData();
formdata.append('key', ossInfo.key);
formdata.append('OSSAccessKeyId', ossInfo.OSSAccessKeyId);
formdata.append('policy', ossInfo.policy);
formdata.append('signature', ossInfo.Signature);        // 注意是小写 signature
formdata.append('success_action_status', '200');
formdata.append('file', file);                           // 必须最后

await fetch(ossInfo.host, { method: 'POST', body: formdata });
```

三个必须记住的约定：

1. **`file` 必须放在最后一个字段**。OSS 是流式解析 multipart 的，`file` 之后的字段会被忽略；放前面会导致 `key` 之类还没读到文件就结束了。
2. **`success_action_status: '200'`** 决定上传成功后返回 200 + XML，否则默认 204 无内容。
3. **字段名大小写敏感**：`OSSAccessKeyId` 大写，`signature` 小写——这是 OSS 的历史遗留，写错会直接 403。

上传成功后返回：

```xml
<PostResponse>
  <Location>https://bucket.oss-cn-beijing.aliyuncs.com/ai-canvas/uploads/xxx.png</Location>
  <Bucket>agentdrb</Bucket>
  <Key>ai-canvas/uploads/xxx.png</Key>
  <ETag>"F1A2..."</ETag>
</PostResponse>
```

多数场景不用读它（`Location` 就是你自己拼的那个 url），但 `ETag` 可以留着做完整性校验。

---

## 六、私有桶：直链打不开，要用预签名

桶是私有的（客户资料、作品图，不该公开），于是：

```
GET https://agentdrb.oss-cn-beijing.aliyuncs.com/ai-canvas/uploads/xxx.png
→ 403 Forbidden
```

`<img src>` 直接裂图。解决方式是生成**带签名的临时链接**：

```ts
getReadUrl(key: string, expires = 3600): string {
  return this.postClient.signatureUrl(key, { expires });
}
```

生成出来长这样：

```
https://bucket.oss-cn-beijing.aliyuncs.com/ai-canvas/uploads/xxx.png
  ?OSSAccessKeyId=LTAI...
  &Expires=1794406136
  &Signature=4N7g88Ld6EcewaAN4TFjgkqD7Xs%3D
```

### 两个实测出来的坑

**坑一：用户名下的对象，`HEAD` 会 403，`GET` 才是 200。**

我用 `HEAD` 验证签名链接时一直 403，几乎误判成「签名没生效」。原因是 **OSS V1 签名把 HTTP 动词算进了待签字符串**，`signatureUrl` 默认按 `GET` 签，拿 `HEAD` 去请求自然 `SignatureDoesNotMatch`。浏览器 `<img>` 走 GET，不受影响。

**坑二：没设 `secure: true`，链接是 `http://`。**

```ts
new Oss({ region, accessKeyId, accessKeySecret, bucket /* 缺 secure */ })
// → http://bucket.oss-cn-beijing.aliyuncs.com/...
```

本地 `localhost` 页面也是 http，看不出问题；一旦前端上了 https 域名，这种 http 图片就是**混合内容**，会被浏览器拦掉。加上 `secure: true` 即可。

### 存储约定

- **数据库只存 `key`**（如 `ai-canvas/uploads/1794...png`）
- **不要存签名链接**，它几十分钟后就失效
- 返回给前端时现场换：`url: this.getReadUrl(item.key)`

---

## 七、DTO 校验：装饰器不是自动生效的

我写了个 DTO：

```ts
export class ImageDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  prompt: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value ?? true)
  watermark?: boolean;
}
```

结果实测：`POST /ai/image {"prompt":""}` 依然返回 **201**，`@IsNotEmpty()` 完全没生效。

原因：**这些装饰器只是元数据，需要 `ValidationPipe` 才会被执行**。而 `main.ts` 里没有注册它：

```ts
import { ValidationPipe } from '@nestjs/common';

app.useGlobalPipes(
  new ValidationPipe({
    transform: true,     // 让 @Transform、类型转换生效
    whitelist: true,     // 剔除 DTO 没声明的字段
    forbidNonWhitelisted: false,
  }),
);
```

`transform: true` 尤其关键——`@Transform` 里的 trim、默认值全靠它。没有它，`prompt: 123` 这种类型错误也会原样进入业务。

---

## 八、我实际踩过的坑清单

| # | 现象 | 原因 | 修法 |
|---|---|---|---|
| 1 | `ERR_CONNECTION_REFUSED` 打不开页面 | TS 编译失败，服务没起来 | 先跑 `npx tsc --noEmit`，别看浏览器 |
| 2 | `500 Internal Server Error`（签名接口） | 调了不存在的 `client.calculateSignature()` | 正确方法是 `calculatePostSignature(policy)` |
| 3 | `signature.AccessKeyId` 是 undefined | 返回字段名不对 | 实际是 `{ OSSAccessKeyId, Signature, policy }` |
| 4 | `Cannot GET /ai/image/list` | 路由没实现 | 补 controller 方法 |
| 5 | 点击「生成」页面空白 | handler 没有 `return`，返回 201 + 空 body，前端 `data.url` 是 undefined | 实现业务并返回 `{ url }` |
| 6 | `console.log(dto)` 看不到 | 打印在**服务端终端**，不在浏览器控制台 | 看 `npm run start:dev` 那个窗口 |
| 7 | `npm run dev` 报 Missing script | Nest 脚手架没有 `dev` | 用 `npm run start:dev` |
| 8 | `Cannot find module './config.mjs'` | 相对路径层级错了 | 用 `../` 回到上一级 |
| 9 | `Type '{ key, host }' is missing ...` | 返回类型要求 7 个字段 | 补齐 `url/OSSAccessKeyId/policy/Signature/expire` |
| 10 | `@Body()` 后直接 `{}` | TS1003：参数缺名字 | `@Body() dto: ImageDto` |

第 1 条值得单独说：**浏览器报「连不上」时，先别查前端，先看服务端有没有编译过**。`nest start --watch` 编译失败时进程不会监听端口，但 Termina 里只会静静输出错误行，很容易被忽略。

---

## 九、目录与启动

```
ai-canvas/
├── readme.md
└── multi-agent/                 # NestJS 服务
    ├── .env                     # 已 gitignore
    ├── public/index.html        # 前端页面（ServeStatic 托管）
    └── src/
        ├── main.ts
        ├── app.module.ts
        └── ai/
            ├── ai.module.ts
            ├── ai.controller.ts
            ├── ai.service.ts
            ├── oss.service.ts
            └── dto/image.dto.ts
```

```powershell
# 必须在 multi-agent 目录下启动，否则读不到 .env
cd ai/agent/ai-canvas/multi-agent
npm run start:dev
# → http://localhost:3000
```

`.env` 需要的键：

```ini
PORT=3000

OSS_REGION=oss-cn-beijing          # 必须带 oss- 前缀
OSS_ACCESS_KEY_ID=...
OSS_ACCESS_KEY_SECRET=...
OSS_BUCKET=agentdrb
OSS_UPLOAD_PREFIX=ai-canvas/uploads
OSS_SIGNATURE_EXPIRE=600
OSS_MAX_FILE_SIZE=10485760

# 下一步接多模态模型时用
OPENAI_API_KEY=...
OPENAI_API_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
IMAGE_MODEL=qwen-image-edit
```

---

## 十、面试速答

**Q：为什么让前端直传 OSS，而不是后端中转？**
省后端带宽和内存，避免大文件把 Node 进程撑爆；后端只负责签发一次性凭证，职责更清晰。代价是要配 CORS，且上传结果无法在后端立即拿到（需要回调或前端回传 key）。

**Q：AK/SK 放哪儿？**
AK 可以下发给前端（`OSSAccessKeyId` 字段），**SK 绝不能**。签名 = `HMAC-SHA1(SK, Base64(policy))`，服务端算完只给结果，所以拿到签名也无法伪造新的 policy。

**Q：签名被别人拿去用怎么办？**
靠 policy 收口：`content-length-range` 限大小、`starts-with`/`eq` 限路径、`expiration` 限时间。三道叠加后，最坏情况也只能在你指定的目录里传一个有大小上限的文件。要更细就用 STS 临时凭证，把权限压到「只能写某个前缀」。

**Q：私有桶怎么让前端显示图片？**
后端用 `signatureUrl(key, { expires })` 生成带时效的 GET 链接，前端直接 `<img src>`。数据库只存 key，链接每次现算——存链接会因为过期而全部失效。

**Q：PostObject 和 PutObject 有什么区别？**
PutObject 是 SDK 直接调 API（需要 AK/SK 或临时凭证，适合服务端）；PostObject 是浏览器表单直传（只需 policy + 签名，适合前端）。表单里 `file` 必须放最后一个字段。

**Q：NestJS 的依赖注入是怎么回事？**
`@Injectable()` 标记可被注入，Nest 通过 `reflect-metadata` 读构造函数参数类型来实例化。所以 `emitDecoratorMetadata` 必须开；`ConfigModule.forRoot({ isGlobal: true })` 让 `ConfigService` 在任何模块都能直接注入。

---

## 十一、下一步

当前链路已经打通：`签名 → 浏览器直传 → 私有桶预签名读`。还差最后一段：

1. `createImage` 调 `IMAGE_MODEL`（有 `imageUrl` 走改图，没有走文生图）
2. 结果图由后端 `putObject` 写回 OSS
3. 返回 `{ url: getReadUrl(key) }`
4. 补 `/ai/image/list`、`DELETE /ai/image/:id`，并用 SQLite 或内存表持久化记录

模型接入留到多模态那一节再做——毕竟「把图安全地运来运去」这件事，先把地基打牢比什么都重要。
