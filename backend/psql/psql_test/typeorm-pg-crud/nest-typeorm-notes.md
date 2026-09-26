# NestJS + TypeORM 学习笔记：语法和类型不绕了

> 面对 `@Controller`、`@Injectable`、`@Entity`、`?`、`Pipe`、`PartialType` 这一堆符号，记住一句话：**它们全部都是在给类和方法“贴标签”，让框架在启动时按标签自动接线**。这篇文章只讲你项目里真实出现的代码，每个语法点都给出“为什么这么设计”的对照。

---

## 一、先建立心智模型：请求是怎么流动的

```
HTTP 请求
  │
  ▼
Controller（@Get/@Post/@Patch/@Delete）   ← 只负责：接请求、取参数、调 Service、返回结果
  │
  ▼
Pipe（ParseIntPipe / ValidationPipe）     ← 参数清洗 + 类型转换
  │
  ▼
Service（@Injectable）                    ← 业务逻辑 + 数据库操作
  │
  ▼
Entity（@Entity + @Column）               ← 数据库表的代码化身
```

**关键认知**：你写的每一个装饰器，都是在告诉框架“这里有个什么东西，请帮我注册/转换/校验”。**你几乎不用 new 对象**——Nest 的依赖注入（DI）容器会替你创建并组装。

---

## 二、Controller：路由层的语法拆解

### 2.1 类装饰器 + 构造函数注入

```ts
@Controller('conversations')              // 这个类处理 /conversations 前缀的所有路由
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}
  //          ↑ private readonly 是 TS 语法：把参数变成类的私有属性
  //          ↑ 你从没 new ConversationsService()，Nest 看到类型自动注入
}
```

**为什么不用自己 import + new？** 因为 `ConversationsService` 已经在 `ConversationsModule` 的 `providers` 里注册过了，Nest 启动时会扫描所有 Module，自动把依赖图建起来。

### 2.2 方法装饰器 = 路由注册

```ts
@Get('user/:userId')                      // GET /conversations/user/123
findByUser(@Param('userId', ParseIntPipe) userId: number) {
  //         ↑ @Param 取路径参数
  //         ↑ ParseIntPipe 把 '123' → 123，'abc' → 400 Bad Request
  //         ↑ 冒号后的 number 是 TS 类型标注，运行时由 Pipe 保证
  return this.conversationsService.findConversationsByUserId(userId);
}
```

**对照 Express**：
```js
// Express 写法
app.get('/conversations/user/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);  // 手动转换，错了不报错
  const result = service.findByUser(userId);
  res.json(result);
});

// Nest 写法：转换 + 校验由 Pipe 自动完成，函数体只剩业务调用
```

### 2.3 路由顺序：为什么 `user/:userId` 写在前面？

```ts
@Get('user/:userId')   // 先匹配
@Get(':id')            // 后匹配
```

Nest 按**代码书写顺序**匹配路由。如果 `':id'` 写在前面，`/conversations/user/2` 会先被 `':id'` 抢走（因为 `'user'` 会被当成 `id`），永远走不到 `findByUser`。这是路由设计的基本规则：**具体路径在前，动态参数在后**。

### 2.4 多参数 + 默认值

```ts
@Post(':id/search')
search(
  @Param('id', ParseIntPipe) id: number,        // 路径参数
  @Body() dto: SemanticSearchDto,                 // 请求体（JSON）
  @Query('limit', new DefaultValuePipe(5), ParseIntPipe) queryLimit: number,
  //      ↑ 查询参数 ?limit=3
  //      ↑ DefaultValuePipe(5)：如果没传 ?limit，给默认值 5
  //      ↑ 然后 ParseIntPipe 再转成 number
) {
  const limit = dto.limit ?? queryLimit ?? 5;
  //          ↑ ?? 空值合并：dto.limit 为 undefined/null 时，取 queryLimit
  return this.conversationsService.searchSimilarMessages(id, dto.query, limit);
}
```

**优先级链**：body 里的 limit > query 里的 limit > 兜底 5。这是 API 设计的常见模式——body 优先，query 次之，代码兜底。

---

## 三、Service：业务层的注入模式

```ts
@Injectable()                               // 标记：这个类可以被注入到其他类中
export class ConversationsService {
  constructor(
    @InjectEntityManager()                  // 从 TypeORM 模块里取 EntityManager
    private readonly em: EntityManager,     // 类型标注：em 是 EntityManager 类型
  ) {}
```

**EntityManager 是什么？** TypeORM 的统一操作入口，所有增删改查都走它：
- `em.findOne(Entity, options)` → SELECT ... WHERE ... LIMIT 1
- `em.find(Entity, options)` → SELECT ...
- `em.save(entity)` → INSERT 或 UPDATE（自动判断）
- `em.remove(entity)` → DELETE

```ts
async findConversationsByUserId(userId: number) {
  const user = await this.em.findOne(User, {
    where: { id: userId },                        // WHERE id = $1
    relations: { conversations: true },             // LEFT JOIN conversations
    order: { conversations: { createdAt: 'DESC' } }, // ORDER BY created_at DESC
  });
  if (!user) {
    throw new NotFoundException('User not found');  // Nest 自动转成 404 JSON 响应
  }
  return user;
}
```

**为什么用对象传参而不是拼接 SQL？** 三个好处：
1. **防注入**：参数自动走 `$1, $2` 占位符，不会拼进 SQL 字符串
2. **类型安全**：`where: { id: 'abc' }` 会直接 TS 报错（id 是 number）
3. **可读性**：`relations: { conversations: true }` 比手写 `LEFT JOIN` 语义更直白

---

## 四、Entity：类属性 ↔ 数据库列

### 4.1 装饰器 = 列定义

```ts
@Entity('conversations')          // 这个类对应表 conversations
export class Conversation {
  @PrimaryGeneratedColumn()       // id SERIAL PRIMARY KEY（自增主键）
  id: number;

  @Column({ name: 'user_id' })    // 列名是 user_id，TS 属性名是 userId（驼峰→下划线）
  userId: number;

  @Column({ type: 'text', nullable: true })  // TEXT 类型，允许 NULL
  title: string | null;           // TS 类型和数据库类型对应

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;                // 插入时自动填 now()，不用手动赋值
}
```

**TS 类型 ↔ PostgreSQL 类型对照表**：

| TS 类型 | 装饰器 | PostgreSQL 类型 |
|---------|--------|----------------|
| `number` | `@PrimaryGeneratedColumn()` | `SERIAL` |
| `number` | `@Column({ name: 'xxx' })` | `INTEGER` |
| `string` | `@Column({ type: 'text' })` | `TEXT` |
| `string \| null` | `@Column({ type: 'text', nullable: true })` | `TEXT NULL` |
| `Date` | `@CreateDateColumn({ type: 'timestamptz' })` | `TIMESTAMPTZ` |
| `number[] \| null` | `@Column('vector', { length: 1024 })` | `vector(1024)` |

### 4.2 关系装饰器：一对多 / 多对一

```ts
// conversation.entity.ts（多的一端）
@ManyToOne(() => User, (user) => user.conversations, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'user_id' })        // 外键列名
user: User;

// user.entity.ts（一的一端，反向关系）
@OneToMany(() => Conversation, (conversation) => conversation.user)
conversations: Conversation[];
```

**为什么两边都要写？** 因为 TypeORM 需要知道“从哪边查哪边”：
- `ManyToOne` + `JoinColumn`：生成外键列 `user_id`
- `OneToMany`：纯 TS 层面的反向导航，**不生成任何数据库列**，只是让 `user.conversations` 有类型提示

**`onDelete: 'CASCADE'`**：删除 User 时，自动删掉他所有 Conversation。不写的话默认 `RESTRICT`（有子记录时禁止删除父记录）。

### 4.3 一个容易混淆的点：`userId` vs `user`

```ts
@Column({ name: 'user_id' })
userId: number;          // 这是原始外键值，查询时直接可用

@ManyToOne(() => User, ...)
@JoinColumn({ name: 'user_id' })
user: User;              // 这是关联对象，需要 relations: true 才会加载
```

TypeORM 检测到两者指向同一列 `user_id`，会智能合并。查询时：
- 不传 `relations` → `userId` 有值，`user` 是 undefined
- 传 `relations: { user: true }` → `user` 也有值（会多发 JOIN SQL）

---

## 五、DTO：数据传输对象的类型设计

### 5.1 为什么 DTO 是类而不是 interface？

```ts
// ❌ interface 不行
interface CreateConversationDto {
  userId: number;
  title?: string;
}

// ✅ 必须用 class
export class CreateConversationDto {
  userId: number;
  title?: string;
}
```

**原因**：`@Body()` 底层用 `ValidationPipe` 做校验，它需要**运行时的类信息**（装饰器元数据）。`interface` 在编译后消失，框架拿不到。`class` 在运行时真实存在，可以配合 `class-validator` 做 `@IsString()`、`@IsNumber()` 等校验。

### 5.2 PartialType：继承 + 全可选

```ts
export class UpdateConversationDto extends PartialType(CreateConversationDto) {}
```

`PartialType` 是 `@nestjs/mapped-types` 提供的工具，等价于：

```ts
// 手动展开的效果
export class UpdateConversationDto {
  userId?: number;      // 继承但变成可选
  title?: string;       // 继承但变成可选
}
```

**设计意图**：更新接口通常只改部分字段，不需要传完整对象。`PartialType` 一行搞定，不用重复写。

### 5.3 可选属性的类型标注

```ts
export class SemanticSearchDto {
  query: string;        // 必填
  limit?: number;       // 可选：等价于 limit: number | undefined
}
```

`?` 是 TS 的可选属性标记，不是 JS 语法。编译后 JS 里没有 `?`，属性只是可能被省略。

---

## 六、AppModule：全局配置入口

```ts
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',           // 数据库类型
      host: 'localhost',
      port: 5433,                 // 容器映射端口
      username: 'user',
      password: '123456',
      database: 'hello_pg',
      synchronize: true,          // ⚠️ 开发专用：实体类改动自动同步表结构
      logging: true,              // 打印所有 SQL 到控制台（学习神器）
      entities: [User, Conversation, Message],  // 注册所有实体类
    }),
    ConversationsModule,          // 注册业务模块
  ],
  controllers: [AppController],   // 根控制器（可选）
  providers: [AppService],        // 根服务（可选）
})
export class AppModule {}
```

**`synchronize: true` 的坑**：开发时很方便（改实体自动改表），**生产环境必须关掉**，否则可能误删数据。替代方案是 TypeORM 的 Migration（显式写迁移文件）。

**`logging: true` 的价值**：你之前看到的那两条 SQL（先查 ID 再 JOIN 拉数据）就是靠它看到的。学习阶段一定要开，能直观理解 ORM 在替你做什么。

---

## 七、TypeScript 类型速查表

| 语法 | 含义 | 例子 |
|------|------|------|
| `title: string` | 必填字符串 | `title: '你好'` |
| `title?: string` | 可选，等价于 `string \| undefined` | 可以传或不传 |
| `title: string \| null` | 必填但可以是 null | `title: null` 或 `title: '你好'` |
| `user: User` | 类型是另一个类 | `user: { id: 2, name: '王五' }` |
| `conversations: Conversation[]` | 数组类型 | `conversations: [{...}, {...}]` |
| `userId: number` | 数字类型 | `userId: 2` |
| `createdAt: Date` | Date 对象 | `new Date()` |
| `role: MessageRole` | 枚举类型 | `MessageRole.USER` |
| `embedding: number[] \| null` | 数组或 null | `[0.1, 0.2, ...]` 或 `null` |

**`??`（空值合并）** vs `||`（逻辑或）：
```ts
const limit = dto.limit ?? queryLimit ?? 5;
// 只在 undefined / null 时才往右走

const limit = dto.limit || queryLimit || 5;
// 0、''、false、undefined、null 都会往右走（0 会被误判）
```

---

## 八、完整调用链回顾

以 `POST /conversations/2/search` 为例：

```
① 请求到达
② @Controller('conversations') 匹配前缀
③ @Post(':id/search') 匹配路径，ParseIntPipe 把 '2' → 2
④ @Body() 把 JSON body 转成 SemanticSearchDto 实例
⑤ @Query('limit') 取查询参数，DefaultValuePipe 给默认值
⑥ Controller 调用 Service.searchSimilarMessages(2, dto.query, limit)
⑦ Service 用 EntityManager 操作数据库（目前返回空数组占位）
⑧ 返回结果，Nest 自动 JSON 序列化
```

每一步都有明确的语法对应：
- ②③ → 装饰器 `@Controller` / `@Post` / `@Param`
- ④⑤ → 装饰器 `@Body` / `@Query` + Pipe
- ⑥⑦ → 构造函数注入 + `this.em`
- ⑧ → Nest 内置响应处理

---

## 九、下一步练习清单

1. **填 `CreateConversationDto`**：加 `@IsNumber()`、`@IsString()` 校验，体会 class-validator
2. **填 `searchSimilarMessages`**：用 `em.query()` 写原生 SQL 调 pgvector（`<=>` 运算符）
3. **填 `create` 方法**：`em.create()` + `em.save()` 完成 INSERT
4. **填 `update` 方法**：`em.findOne()` + `em.merge()` + `em.save()`
5. **关掉 `synchronize`**：写一次 Migration，理解开发 vs 生产的差异

每个练习都会用到上面讲的语法点，卡住时回来查这张表。
