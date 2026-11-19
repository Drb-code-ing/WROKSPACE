# 企业知识库 RBAC 设计与落地：从建表、ORM 到 JWT 鉴权

> 项目：Knowledge Hub（NestJS 11 + TypeORM + PostgreSQL/pgvector + React 19 + antd 6）
> 范围：用户 / 角色 / 权限 / 团队 四块数据模型，以及登录、鉴权、权限计算的完整链路。
> 状态：RBAC 数据层与权限计算已完成；JWT 双 Token 为下一步实现（本文给出设计）。

---

## 一、为什么知识库必须做 RBAC

企业知识库和普通博客最大的区别是：**内容有归属，用户有身份，操作有边界**。

- 一份文档属于某个**团队**，只有同团队或有授权的人能看到；
- 文档发布要经过**审核**，审核员和管理员的权限不同；
- 后台菜单、按钮、接口三层都要控制，不能只藏前端按钮；
- 人员会转岗、离职、临时借调，权限必须能**批量调整**。

如果直接把权限挂在用户身上（`user_permission` 一张表打天下），100 人 × 20 权限就是 2000 行；新增一个“导出 PDF”权限要执行 100 次 INSERT。于是引入角色作为**权限的模板**：

```
用户 --(N:N)--> 角色 --(N:N)--> 权限
```

一句话：**用户只绑定角色，角色绑定权限，权限与用户解耦。**

---

## 二、表结构总览

### 2.1 八张核心表

| 表 | 定位 | 关键字段 |
|---|---|---|
| `kh_user` | 用户主数据 | `id`、`username`（未删除唯一）、`password`(bcrypt)、`status`、`deleted` |
| `kh_role` | 角色字典 | `role_code`(唯一)、`role_name`、`status` |
| `kh_user_role` | 用户-角色关系 | `user_id`、`role_id`，`UNIQUE(user_id, role_id)` |
| `kh_permission` | 权限字典（树） | `parent_id`、`permission_code`(唯一)、`permission_type`、`menu_url`、`api_url`、`method`、`sort` |
| `kh_role_permission` | 角色-权限关系 | `role_id`、`permission_id`，联合唯一 |
| `kh_user_permission` | 用户直授权限（例外通道） | `user_id`、`permission_id`，联合唯一 |
| `kh_team` | 团队（树） | `leader_id`、`parent_id`、`team_name` |
| `kh_team_member` | 团队成员 | `team_id`、`user_id`、`member_role`(leader/member) |

### 2.2 关系图

```
                    ┌──────────────┐
                    │   kh_user    │
                    └──────┬───────┘
             ┌─────────────┼────────────────┐
             │             │                │
   kh_user_role      kh_user_permission   kh_team_member
             │             │                │
             ▼             ▼                ▼
       ┌──────────┐   ┌────────────┐   ┌───────────┐
       │ kh_role  │   │kh_permission│  │ kh_team   │
       └────┬─────┘   └─────▲──────┘   └───────────┘
            │               │
   kh_role_permission ──────┘
```

三条链路要分清：

1. **认证链**：`kh_user` → 校验密码 → 得到身份；
2. **授权链**：`kh_user` → `kh_user_role` → `kh_role` → `kh_role_permission` → `kh_permission`（函数式：角色权限并集）；
3. **数据权限链**：`kh_user` → `kh_team_member` / `kh_team.leader_id` → 可见的 `team_id` 集合，用于文档过滤。

---

## 三、表怎么拆：设计取舍

### 3.1 主数据、关系数据、树数据分开

- **主数据**（user/role/permission/team）：一行一个实体，带 `status`、`deleted`、审计时间；
- **关系数据**（三张关联表）：只存外键 + 时间，绝不放冗余字段，靠 JOIN 取；
- **树数据**（permission/team）：统一用 `parent_id`，`0` 表示根。

### 3.2 `role_code` 与 `role_name` 必须解耦

```sql
(2000...001, '管理员', 'ROLE_ADMIN', '系统管理')
```

- `role_name` 是展示文案，可以改成“系统管理员”，可以做多语言；
- `role_code` 是**唯一契约**，代码里只认它：`RoleCode.Admin = 'ROLE_ADMIN'`。

同理，`permission_code` 是运行时校验的唯一依据，`permission_name` 只用于展示。

### 3.3 关联表也要有自己的主键

三张关联表都有独立 `id`（雪花），并加 `UNIQUE(user_id, role_id)`：

- 独立主键便于单独删除某条授权、便于审计日志引用；
- 唯一约束防止重复授权（前端重复点击、并发请求）；
- 只对 `user_id` 建索引，支撑“查我的角色”这类高频查询。

### 3.4 软删除与唯一索引的坑

用户表用 `deleted` 软删除，但 `username` 需要“未删除时唯一”：

```sql
CREATE UNIQUE INDEX uk_kh_user_username ON kh_user(username) WHERE deleted = false;
```

普通 `UNIQUE(username)` 会导致“删掉的用户名不能再用”。**部分唯一索引**是 PostgreSQL 处理这种需求的标准做法，MySQL 没有，这一点在面试里经常被追问。

### 3.5 雪花 ID 与 JS 精度

数据库 `BIGINT`（雪花 ID，19 位）超过 JS 安全整数 `2^53-1`，直接读会**精度丢失**。项目统一用 TypeORM 转换器解决：

```ts
export const bigintTransformer: ValueTransformer = {
  to: (v) => v,                                  // 入库保持 bigint
  from: (v) => (v == null ? v : String(v)),      // 出库转 string
};
```

Entity 里所有 `bigint` 字段都标注 `transformer: bigintTransformer`，TS 类型用 `string`。这样接口 JSON 里也是字符串，前端不需要 `BigInt`。

### 3.6 每个表都有的“公共字段”

`status`（0 禁用 / 1 正常）、`deleted`、`created_at`、`updated_at`。统一的好处是：所有查询都能套同一套过滤规则，权限校验也统一判断 `status = 1 AND deleted = false`。

---

## 四、树状权限机制

### 4.1 为什么权限需要树

权限天然是分层的：

```
系统管理 (菜单, parent=0)
├─ 用户管理 (菜单)
├─ 角色管理 (菜单)
├─ 权限管理 (菜单)
│   ├─ 新增权限 (按钮)
│   ├─ 编辑权限 (按钮)
│   └─ 删除权限 (按钮)
└─ 团队管理 (菜单)
```

三个直接收益：

1. **前端菜单可以递归渲染**（antd `Menu` 的 `items` 需要 children）；
2. **授权页可以勾选级联**：勾“权限管理”，三个按钮自动勾上；
3. **接口级权限可以挂在菜单下**，形成“菜单 → 按钮 → 接口”的完整链路。

### 4.2 `permission_type` 三层含义

| 值 | 类型 | 控制对象 | 谁来校验 |
|---|---|---|---|
| 1 | 菜单 | 侧边栏、前端路由 | 前端按权限列表动态生成路由；后端不拦 |
| 2 | 按钮 | 页面操作按钮 | 前端 `v-permission` / 条件渲染 |
| 3 | 接口 | HTTP API | 后端 Guard 按 `permission_code` 校验 |

设计思想：**前端可见性只是体验，接口校验才是安全边界**。菜单和按钮负责“少让用户困惑”，接口权限负责“防越权”。

### 4.3 树的两种实现方式

**方案 A：邻接表（本项目采用）** —— 只存 `parent_id`。

- 优点：写入简单、改层级只改一行、符合直觉；
- 缺点：查整棵子树需要递归。

用 PostgreSQL 递归 CTE：

```sql
WITH RECURSIVE sub AS (
  SELECT id FROM kh_permission WHERE id = $1
  UNION ALL
  SELECT p.id FROM kh_permission p JOIN sub ON p.parent_id = sub.id
)
SELECT id FROM sub;
```

但**权限树规模很小**（几十到几百条），工程上更常见的做法是：

1. 一次查出全部 `status=1 AND deleted=false` 的权限；
2. 在内存里按 `parent_id` 建树（`Map<id, node>`）；
3. 前端拿到的就是嵌套结构，勾选/回显都在内存完成。

这比每次递归查库简单得多，也不需要额外索引。

**方案 B：闭包表 / 物化路径** —— 适合层级深、频繁查子树的大规模组织架构。权限表没必要，属于过度设计。

### 4.4 `sort` 与稳定排序

前端菜单顺序不能依赖 `id`（雪花不保证业务顺序）或创建时间，必须显式 `sort` 字段，`ORDER BY sort ASC, id ASC` 保证稳定。

---

## 五、ORM 落地：Entity / Repository / Module

### 5.1 Entity 是什么

Entity 是**数据库表在代码里的类型化声明**，不执行查询，只提供元数据：

```ts
@Entity('kh_permission')
export class PermissionEntity {
  @PrimaryColumn({ type: 'bigint', transformer: bigintTransformer })
  id: string;

  @Column({ name: 'parent_id', type: 'bigint', default: '0', transformer: bigintTransformer })
  parentId: string;

  @Column({ name: 'permission_code', type: 'varchar', length: 100, unique: true })
  permissionCode: string;

  /** 1 菜单 2 按钮 3 接口 */
  @Column({ name: 'permission_type', type: 'smallint' })
  permissionType: number;
}
```

三条约定：

- **属性名用 camelCase，列名用 snake_case**，靠 `name` 显式映射，不依赖命名策略魔法；
- **类型必须显式写**（`type: 'varchar', length: 100`），因为 TS 类型编译后被擦除，运行时拿不到长度；
- **可空字段用 `nullable: true` + `?:`**，避免 `strictNullChecks` 下到处报错。

### 5.2 Repository 与 Module

`TypeOrmModule.forFeature([...])` 负责在**本模块**注册 `Repository<T>` 这个 provider；Controller/Service 里用 `@InjectRepository(T)` 领取：

```ts
@Module({
  imports: [
    TeamModule, // 需要用 TeamService，导入整个模块
    TypeOrmModule.forFeature([
      UserEntity, UserRoleEntity, RoleEntity,
      RolePermissionEntity, UserPermissionEntity, PermissionEntity,
    ]),
  ],
  providers: [UserService, PermissionService],
  exports: [UserService],
})
export class UserModule {}
```

注意两点：

- `exports: [UserService]` 才能被 `AuthModule` 注入；
- 模块间依赖用**模块导入**，不要直接 import 别的模块的 Service 类来 new。

### 5.3 QueryBuilder：联表查角色编码

抽象方法（`find`）表达不了“三表联查只要一列”，这时候用 QueryBuilder：

```ts
const rows = await this.userRoleRepo
  .createQueryBuilder('ur')
  .innerJoin(RoleEntity, 'r', 'r.id = ur.role_id')
  .where('ur.user_id = :userId', { userId })
  .andWhere('r.status = 1')
  .select('r.role_code', 'roleCode')
  .getRawMany<{ roleCode: string }>();

return rows.map((item) => item.roleCode);
```

四个要点：

1. `createQueryBuilder('ur')` 决定 **FROM 哪张表**（别名 `ur`）；
2. `innerJoin(RoleEntity, ...)` 的第一个参数是**实体**（表的定义），不是 Repository；
3. `:userId` 是**参数占位符**，TypeORM 会编译成 `$1`，天然防 SQL 注入；
4. `getRawMany()` 返回扁平对象 `[{ roleCode }]`，所以别名要起成 camelCase，最后 `map` 成 `string[]`。

### 5.4 避免 N+1：批量 IN + 并行

“查用户能访问的团队”需要两个来源：成员关系 + 负责人身份。如果写成循环查详情，就是典型 N+1。项目里的做法：

```ts
const [memberRows, ledRows] = await Promise.all([
  this.teamMemberRepo.createQueryBuilder('tm')
    .select('tm.team_id', 'teamId')
    .where('tm.user_id = :userId', { userId })
    .getRawMany<{ teamId: string | number }>(),
  this.teamRepo.find({
    where: { leaderId: userId, deleted: false },
    select: ['id'],
  }),
]);

const ids = [...new Set([
  ...memberRows.map((r) => r.teamId),
  ...ledRows.map((r) => r.id),
])];
if (ids.length === 0) return [];

const teams = await this.teamRepo.find({
  where: { id: In(ids), deleted: false },
  select: ['id', 'teamName'],
});
return teams.map((t) => String(t.id));
```

设计点：

- **两个不相干的查询并行**（`Promise.all`），把两次往返压成一次等待；
- **必须去重**：负责人通常也在成员表里，两个结果天然重叠；
- **最后一次回表**用 `IN` 批量查，并过滤 `deleted`（成员关系可能还在，但团队已解散）；
- `select` 只取需要的列，减少 IO 与序列化成本。

---

## 六、DTO 与校验：把脏数据挡在 Service 之外

三层数据对象要分清：

| 类型 | 面向 | 例子 | 能不能带 password |
|---|---|---|---|
| DTO | HTTP 请求/响应 | `LoginDto` | 只带明文入参，绝不回传 |
| Entity | 数据库表 | `UserEntity` | 带 hash |
| VO/AuthUser | 业务内部传递 | `AuthUser` | 不带 |

全局校验管道注册在 `AppModule`（`APP_PIPE`），等效于 `app.useGlobalPipes()`，但对 DI 和测试更友好：

```ts
{
  provide: APP_PIPE,
  useValue: new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  }),
}
```

- `transform`：把裸 JSON 变成 DTO 实例，装饰器才生效；
- `whitelist` + `forbidNonWhitelisted`：**多传字段直接 400**，从根上防“前端偷偷传 `roles: ['ROLE_ADMIN']`”这类越权赋值；
- `enableImplicitConversion`：`"1"` → `1` 这类类型转换。

---

## 七、权限计算的完整流程

### 7.1 登录链路（已实现）

```
POST /auth/login { username, password }
  │
  ├─ ValidationPipe 校验 LoginDto（400 直接返回）
  ├─ AuthService.login
  │    └─ UserService.validateCredentials
  │         ├─ findByUsername（WHERE username AND deleted = false）
  │         ├─ status !== 1        → 401 用户已被禁用
  │         ├─ emailVerified === 0 → 401 邮箱未验证
  │         ├─ bcrypt.compare      → 失败统一 401 用户名或密码错误
  │         ├─ getRoleCodes        → ['ROLE_ADMIN', ...]
  │         ├─ PermissionService.getUserPermissionCodes
  │         └─ TeamService.listAccessibleTeamIds
  ├─ touchLastLogin 更新 last_login_at
  └─ 返回 AuthUser → 签发 JWT（下一步）
```

两个安全细节：

1. **“用户不存在”和“密码错误”用同一句提示**，防止用户枚举；
2. 用户不存在时也执行一次假 hash 比较，可以抹平响应时间差异（进阶）。

### 7.2 权限集合怎么算

```
最终权限 = (该用户所有启用角色的权限并集) ∪ (用户直授权限)
```

`PermissionService` 里两条查询分别取：

```ts
// ① 直授
FROM kh_user_permission up
JOIN kh_permission p ON up.permission_id = p.id
WHERE up.user_id = $1 AND p.status = 1 AND p.deleted = false

// ② 角色链路（DISTINCT 去重：多角色可能有同一权限）
SELECT DISTINCT p.permission_code
FROM kh_user_role ur
JOIN kh_role_permission rp ON ur.role_id = rp.role_id
JOIN kh_permission p ON rp.permission_id = p.id
WHERE ur.user_id = $1 AND p.status = 1 AND p.deleted = false
```

合并用 `Set`，天然去重。此外还有一个**管理员兜底**：

```ts
const isAdmin = roleCodes.some((r) =>
  (ADMIN_ROLES as readonly string[]).includes(r.roleCode),
);
if (isAdmin) {
  for (const code of ADMIN_OPERATION_PERMISSIONS) set.add(code);
}
```

为什么要有这一步：管理员权限涉及系统配置类接口，如果漏配一条 `kh_role_permission` 数据，管理员会被“锁在门外”；用常量兜底，保证超管永远可用，同时避免把上百条权限逐条插库。

### 7.3 请求鉴权（设计，下一步实现）

```
请求 → JwtAuthGuard
        ├─ 无 token / 签名错 / 过期 → 401
        ├─ 解出 AuthUser 挂到 request.user
        └─ RefreshToken 不参与业务接口
     → PermissionGuard / RolesGuard
        ├─ @Roles('ROLE_REVIEWER')        → 校验角色编码
        ├─ @RequirePermissions('document:review') → 校验权限编码
        └─ 失败 → 403
     → Controller
```

Guard 顺序很重要：**先认证（你是谁），再授权（你能不能）**。`@Public()` 装饰器用于登录、刷新、健康检查等免鉴权接口。

### 7.4 数据权限（第三种维度）

角色权限回答“能不能做这个操作”，数据权限回答“能操作谁的数据”。文档表里的 `team_id`、`author_id`、`is_public` 就是数据权限的过滤依据：

```ts
where: {
  deleted: false,
  ...(isAdmin ? {} : { teamId: In(teamIds) }),
}
```

**过滤必须发生在 SQL 层**，不能查出来再在内存里删，否则日志、缓存、分页都会泄露。

---

## 八、JWT 双 Token 设计（与 RBAC 结合）

### 8.1 为什么用双 Token

| | accessToken | refreshToken |
|---|---|---|
| 有效期 | 15~30 分钟 | 7~30 天 |
| 用途 | 访问业务接口 | 只用于换新 accessToken |
| 存储 | 前端内存/localStorage | HttpOnly Cookie 或安全存储 |
| 内容 | 用户 id、角色、权限、团队 id | 只放 `sub`、`jti`、过期时间 |
| 可撤销 | 不撤销（短命） | 服务端可撤销（Redis 白名单/黑名单） |

单 token 的两难：有效期短则频繁登录，有效期长则泄露后长期可用。双 token 把“长期凭证”和“短期凭证”分开，刷新接口还能做**轮换与重放检测**。

### 8.2 accessToken payload 设计

```json
{
  "sub": "1000000000000000001",
  "username": "admin",
  "roles": ["ROLE_ADMIN", "ROLE_REVIEWER"],
  "perms": ["document:list", "document:review", "system:user"],
  "teams": ["8000000000000000001"],
  "iat": 1763500000,
  "exp": 1763501800
}
```

取舍：

- **把权限放进 token**：鉴权时零查库，适合高频接口；
- **代价**：权限变更要等 token 过期才生效。解决方案是加 `permVersion`，权限变更时 `INCR user:{id}:permVersion`，Guard 校验版本不一致则要求刷新；或者缩短 accessToken 寿命（15 分钟）作为兜底。

### 8.3 刷新流程

```
POST /auth/refresh { refreshToken }
  ├─ 验签 + 校验 jti 是否在 Redis 白名单
  ├─ 查用户状态（禁用/删除则拒绝）
  ├─ 重新计算 roles/permissions（保证权限是最新的）
  ├─ 旧 refreshToken 作废（轮换）
  └─ 返回新的 accessToken + refreshToken
```

**轮换 + 重放检测**：一个 refreshToken 只能用一次；如果同一个 token 被使用两次，说明可能被窃取，直接吊销该用户所有会话。

### 8.4 登出

accessToken 无状态、无法即时删除，所以登出要做两件事：

1. `refreshToken` 从白名单/Redis 删除（保证不能再换新 token）；
2. accessToken 剩余有效期很短，等它自然过期；对安全要求高的系统，可把 `jti` 放入 Redis 黑名单（TTL = 剩余有效期）。

---

## 九、一整套流程演示

### 9.1 登录

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "tokenType": "Bearer",
  "expiresIn": 1800
}
```

### 9.2 携带 token 访问

```bash
curl http://localhost:3000/document/list \
  -H "Authorization: Bearer eyJhbGciOi..."
```

Guard 内部：

```
验签 → 取 payload → request.user = { userId, roles, perms, teams }
→ @RequirePermissions('document:list') 校验 → Controller
```

### 9.3 权限变更后的效果

- 管理员在后台给“审核员”角色新增 `document:export` → 写 `kh_role_permission` 一行；
- 该角色下所有用户在下一次刷新 token 后获得新权限；
- 如果要求“立即生效”，把 `permVersion` 放进 token 并在 Guard 比对（多一次 Redis 读）。

### 9.4 前端如何使用

1. 登录成功后存 token（access 放内存，refresh 放安全存储）；
2. axios 拦截器统一加 `Authorization`；
3. 401 → 调 refresh → 成功后重放原请求；refresh 也失败 → 跳登录；
4. 用返回的 `permissions` 渲染菜单与按钮（前端只做体验，后端仍要校验）。

---

## 十、面试高频追问

**Q1：RBAC 和 ABAC 的区别？**
RBAC 按“角色”授权，适合岗位稳定的企业系统；ABAC 按“属性”（部门、文档密级、时间、IP）动态计算，更细但更难维护。企业知识库常用 **RBAC 为主 + 数据属性过滤为辅**（本项目的 `team_id`、`is_public` 就属于数据权限）。

**Q2：权限为什么放 JWT 里，不怕过期？**
放进去是为了零查库、低延迟；过期问题靠短有效期 + refresh 刷新 + 权限版本号解决。权限敏感的系统可以不放 payload，每次查 Redis 缓存（`user:perms:{id}`，TTL 5 分钟）。

**Q3：前端隐藏了按钮，后端还要校验吗？**
必须。前端只防误操作，攻击者可以直接 curl。所以 `permission_type = 3`（接口）才是安全边界。

**Q4：树形权限怎么存、怎么查最快？**
邻接表 `parent_id` 存储、全量加载内存建树（权限量小）。深层级大表用闭包表或递归 CTE。

**Q5：软删除下用户名唯一怎么做？**
PostgreSQL 部分唯一索引：`UNIQUE (username) WHERE deleted = false`。

**Q6：雪花 ID 前端精度问题怎么解？**
后端 `bigint` → `string`（TypeORM transformer 或全局序列化配置），前端一律按字符串处理，不要 `Number()`。

**Q7：多角色权限冲突怎么办？**
默认**并集**（union）；不要做“拒绝优先”，否则排查成本极高。需要“收回某权限”时，用显式的禁用状态或专门的黑名单机制，而不是靠缺省。

**Q8：关联表为什么不用复合主键？**
可以，但独立 `id` 更利于审计、日志引用、单条删除；复合唯一索引负责防重，两者并不冲突。

---

## 十一、当前进度与下一步

已完成：

- 8 张表建表 + 种子数据（`init.sql`）；
- 6 个 RBAC 实体 + 2 个团队实体，统一 `bigintTransformer`；
- `UserModule` / `TeamModule` / `AuthModule` 拆分与依赖注入；
- 登录校验链路：状态、邮箱、bcrypt、角色编码、权限编码、可访问团队；
- 权限计算：角色并集 ∪ 直授 ∪ 管理员兜底。

下一步（JWT）：

1. 引入 `@nestjs/jwt` + `passport-jwt`（或自写 Guard）；
2. `AuthService.login` 签发双 token，`refreshToken` 存 Redis（含 `jti`、用户、过期时间）；
3. `JwtAuthGuard` + `@Public()`；
4. `PermissionGuard` + `@RequirePermissions()`，按 `permission_type = 3` 做接口级校验；
5. 刷新、登出、权限版本号；
6. 前端 axios 拦截器与 401 自动刷新。

---

## 十二、小结

RBAC 不难在“表怎么建”，难在三个地方：

1. **边界**：菜单/按钮只是体验，接口校验才是安全；查询过滤必须在 SQL 层。
2. **稳定契约**：`role_code`、`permission_code` 一经确定就不能改，展示名随便改。
3. **例外管理**：用户直授权限是补丁，必须可控、可审计、最好带过期时间。

把这三件事想清楚，表结构自然就出来了；再配上 DTO 校验、ORM 映射、JWT 短期凭证，才是一套能上线、也能在面试里讲明白的权限体系。
