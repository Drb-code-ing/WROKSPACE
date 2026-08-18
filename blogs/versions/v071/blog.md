# TS 工具类型七件套：Pick、Omit、Partial、Record，与 Omit 的三步底层实现

写 TypeScript 到一定阶段，会频繁遇到一类需求：**从一个已有的对象类型，推导出另一个相关的类型**——"挑几个字段出来""去掉某个敏感字段""所有字段都变可选"。这些需求如果每次都手写一遍，既啰嗦又容易漏。TypeScript 内置了一批**工具类型（Utility Types）**专门干这个，第六十天的笔记就把最常用的七个一次性讲清了。

笔记里有一句很关键的话点出了它们的价值：**在负责的、大型的项目里，类型消费比较大，用好这些工具类型能大幅减少重复的类型定义。** 而其中最值得深挖的，是 `Omit` 那句"等价于 `Pick<T, Exclude<keyof T, K>>`"——它背后藏着一套可复用的类型推导思路。

---

## 一、起点：一个 `User` 接口

所有的工具类型都围绕同一个源类型展开，笔记定义了一个最朴素的 `User`：

```ts
interface User {
  id: number
  name: string
  age: number
  email: string
}
```

后面的每一个类型，都是从 `User` 这个"原材料"里裁剪、变换出来的。理解了"以 `User` 为源"这个前提，七个工具类型就有了统一的参照系。

---

## 二、Pick：挑几个字段出来

第一个需求："一个类型挑一些你需要的字段，形成新的类型。" 对应的工具类型是 `Pick`：

```ts
// Pick 从类型中挑选一些字段，形成新的类型
type UserPreview = Pick<User, 'id' | 'name'>
const u: UserPreview = {
  id: 1,
  name: '张三',
  // age: 18,   // 报错：UserPreview 里没有 age
}
```

`Pick<T, K>` 的签名是 **`Pick<T, 选取类型的联合字符串>`**——第一个参数是源类型，第二个参数是你想保留的字段名组成的**联合类型**。`Pick<User, 'id' | 'name'>` 得到的新类型只含 `id` 和 `name`，多写一个 `age` 编译器就会拦下来。

它的典型场景是**列表预览**：列表页只想展示几个字段，用 `Pick` 裁出一个"轻量版"类型，既约束了传入的数据形状，又不用维护一份重复的字段清单。

---

## 三、Omit：排除某个字段

和 Pick 正好相反的需求是"排除一些字段"——比如把敏感字段 `email` 去掉再对外输出：

```ts
// Omit 从类型中排除一些字段，形成新的类型
type UserSafe = Omit<User, 'email'>
const uSafe: UserSafe = {
  id: 2,
  name: '廖昊',
  age: 19,
  // email 已经不存在了
}
```

`Omit<T, K>` 的签名是 **`Omit<T, 排除类型的联合字符串>`**：第二个参数是你要**删掉**的字段。`Omit<User, 'email'>` 得到的 `UserSafe` 保留了除 `email` 外的全部字段。

Pick 和 Omit 是一对镜像：**Pick 白名单式地"留"，Omit 黑名单式地"删"**。当要删的字段少时用 Omit 更省事（一个 `'email'` 就够），当要留的字段少时用 Pick 更清晰。

---

## 四、Partial：让所有字段变可选

第三个常见需求是"patch 修改"——更新对象时只传要改的字段，没传的保持原值：

```ts
// Partial 所有字段全部可选
type PartialUser = Partial<User>
// patch 修改 对象属性很多
const patchUser: PartialUser = {
  name: '廖昊',
  age: 19,
}
```

`Partial<T>` 把 `User` 的每个字段都变成**可选**，所以 `patchUser` 可以只写 `name` 和 `age`，不写 `id` 和 `email`。笔记点出了它的落地场景：**对象属性很多的时候做部分更新**，配合后端 PATCH 语义（只改一部分）非常契合。

---

## 五、Record：构造一个键值字典

`Record` 和前面几个不同，它不是"裁剪"，而是"构造"——根据键类型和值类型，造出一个字典：

```ts
// json key:value  Record<键类型, 值类型>
type Dict = Record<string, number>
const obj: Dict = {a: 1, b: 2}
```

`Record<K, V>` 的两个参数分别是**键的类型**和**值的类型**。`Record<string, number>` 就是"字符串键、数字值"的字典。笔记给了一个特别实用的例子——**HTTP 状态码 → 错误信息**的映射：

```ts
type ErrorMsgMap = Record<number, string>
// http status code
// 5XX 服务器错误
// 4XX 客户端错误
// 3XX 重定向错误
// 2XX 成功
// 1XX 执行中
const errorMsgMap: ErrorMsgMap = {
  400: '请求参数错误',
  401: '未登录，需要先登录',
  403: '权限不足，禁止访问',
  404: '资源不存在',
  500: '服务器内部错误',
}

function getErrorMsg(code: number) {
  return errorMsgMap[code] ?? '未知错误'
}
```

这里 `Record<number, string>` 把"状态码（number）→ 提示文案（string）"这个映射关系固化成类型，再配合 `??` 兜底一个"未知错误"。**`Record` 让"键值查找表"有了类型保障**，`getErrorMsg` 里查不存在的 code 也不会返回 undefined。

---

## 六、ReturnType 与 Exclude：两种"取出来"

还有两个工具类型，分别从"函数"和"联合类型"里取东西。

**`ReturnType` 取函数的返回值类型**：

```ts
function fn() {return {x:1, y:2}}
// ReturnType<函数类型> 函数返回值类型
type fnReturn = ReturnType<typeof fn>  // { x: number, y: number }
```

注意写法是 `ReturnType<typeof fn>`——`ReturnType` 要的是**函数类型**，而 `fn` 是函数值，所以要先用 `typeof fn` 拿到它的类型。好处是：如果 `fn` 的返回值结构变了，`fnReturn` 会自动跟着变，不用手动同步。

**`Exclude` 排除联合类型里的指定成员**：

```ts
// 联合类型
type All = "id" | "name" | "age" | "email"
// Exclude<联合类型, 排除的类型> 排除联合类型中的指定类型
type AfterExclude = Exclude<All, "email">  // "id" | "name" | "age"
```

`Exclude<联合类型, 排除的类型>` 从联合类型里删掉指定成员。这里笔记有一句非常重要的辨析：

> **Omit 处理对象接口 | Exclude 处理联合类型**

即：`Omit` 操作的是**对象类型**（去掉对象的字段），`Exclude` 操作的是**联合类型**（去掉联合里的成员）。两者的对象不一样，别混用。

---

## 七、核心：Omit 的三步底层实现

笔记最精彩的地方，是把 `Omit` 这个"黑盒"拆开了。开头那句：

> `Omit<T, K>` 等价于 `Pick<T, Exclude<keyof T, K>>` 怎么理解？？

答案就藏在 `2.ts` 里，笔记用三个中间步骤把这个等价式一步步推了出来：

```ts
// keyof 类型获取对象的所有属性名
type UserKeys = keyof User                      // "id" | "name" | "age" | "email"
type KeepKeys = Exclude<UserKeys, 'email'>      // "id" | "name" | "age"
type MyOmitUser = Pick<User, KeepKeys>          // { id: number, name: string, age: number }
```

拆解成三步，`Omit` 的底层逻辑就一目了然：

1. **`keyof T` 拿到所有键的联合类型**——`keyof User` 得到 `"id" | "name" | "age" | "email"`；
2. **`Exclude` 把要剔除的 K 删掉，剩下需要保留的键**——`Exclude<UserKeys, 'email'>` 得到 `"id" | "name" | "age"`；
3. **再用 `Pick` 把剩下的键从 T 中提取出来**——`Pick<User, KeepKeys>` 得到 `{ id, name, age }`。

三步走完，就得到了 `Omit<T, K>`。这就是 **TS 内部 `Omit` 类型的实现原理**：`Omit` 本身不是原子操作，而是 `Pick`、`Exclude`、`keyof` 三个工具类型**组合**出来的。

这个拆解的价值不只是"看懂 Omit"，更在于**它演示了一种思考方式**——**用几个简单工具类型拼出更复杂的类型**。遇到没有现成工具类型能满足的需求时，学着像这样"拆成 `keyof → Exclude → Pick` 的组合"自己拼一个，是进阶 TS 的核心能力。

---

## 八、七件套全景

最后把七个工具类型收进一张表，方便对照记忆：

| 工具类型 | 签名 | 作用 | 操作对象 |
| --- | --- | --- | --- |
| `Pick` | `Pick<T, K>` | 挑选字段，形成新类型 | 对象类型 |
| `Omit` | `Omit<T, K>` | 排除字段，形成新类型 | 对象类型 |
| `Partial` | `Partial<T>` | 所有字段变可选 | 对象类型 |
| `Record` | `Record<K, V>` | 构造键值字典 | 键 + 值 |
| `ReturnType` | `ReturnType<typeof fn>` | 取函数返回值类型 | 函数类型 |
| `Exclude` | `Exclude<U, K>` | 从联合类型里排除成员 | 联合类型 |
| `keyof` | `keyof T` | 取对象所有键的联合类型 | 对象类型 |

记忆要点两条：**`Omit` 操作对象接口、`Exclude` 操作联合类型**；**`Omit = Pick + Exclude + keyof` 的组合**。抓住了这两条，七件套的骨架就立住了。

---

## 面试问答

**问：`Pick` 和 `Omit` 有什么区别？分别用在什么场景？**

> `Pick<T, K>` 从类型里**挑选**一些字段形成新类型（白名单式"留"），`Omit<T, K>` 从类型里**排除**一些字段形成新类型（黑名单式"删"）。要删的字段少（如去掉 `email`）用 Omit 更省事，要留的字段少（如列表只展示 `id`/`name`）用 Pick 更清晰。二者是一对镜像。

**问：`Omit<T, K>` 等价于 `Pick<T, Exclude<keyof T, K>>`，怎么理解？**

> 拆成三步：① `keyof T` 拿到所有键的联合类型；② `Exclude` 把要剔除的 K 删掉，剩下需要保留的键；③ 再用 `Pick` 把剩下的键从 T 中提取出来，最后得到 `Omit<T, K>`。所以 `Omit` 不是原子操作，而是 `Pick` + `Exclude` + `keyof` 三个工具类型组合出来的，这正是 TS 内部 `Omit` 的实现原理。

**问：`Partial` 的典型使用场景是什么？**

> 部分更新（patch）。更新对象时只传要改的字段、没传的保持原值，比如 `const patchUser: Partial<User> = { name: '廖昊', age: 19 }` 可以只写两个字段。`Partial<T>` 把每个字段都变可选，对象属性很多时特别有用，与后端 PATCH 的"只改一部分"语义契合。

**问：`Record` 是什么？`Exclude` 和 `Omit` 的对象有什么不同？**

> `Record<K, V>` 根据键类型和值类型构造一个键值字典，如 `Record<number, string>` 表示"数字键、字符串值"，常用于 HTTP 状态码 → 错误信息的映射表。辨析上：`Omit` 操作的是**对象接口**（去掉对象的字段），`Exclude` 操作的是**联合类型**（去掉联合里的成员），两者对象不同，别混用。

**问：`ReturnType` 为什么要写 `ReturnType<typeof fn>` 而不是 `ReturnType<fn>`？**

> `ReturnType` 要的是**函数类型**，而 `fn` 是函数值，所以要先用 `typeof fn` 拿到它的类型再传入。这样如果 `fn` 的返回值结构变了，`ReturnType` 推导出的类型会自动跟着变，不用手动同步。

---

## 结语：工具类型是"类型推导的组合拳"

第六十天没有引入新的语言特性，却把一个进阶 TS 开发者绕不开的技能点打透了——**用内置工具类型，从已有类型推导出新类型**。回看整条线，其实是两层认知：

```text
会用       Pick/Omit/Partial/Record/ReturnType/Exclude/keyof  各自解决一类裁剪/构造需求
会拆       Omit = Pick + Exclude + keyof                       用简单工具类型组合出复杂类型
```

落到记忆上就两条：**`Omit` 管对象、`Exclude` 管联合**；**`Omit` 是 `Pick + Exclude + keyof` 的三步组合**。

动手前，拿这份清单自检：

- [ ] 能否说清 `Pick<T, K>`（挑选）和 `Omit<T, K>`（排除）是一对镜像？
- [ ] 能否把 `Omit = Pick<T, Exclude<keyof T, K>>` 拆成 `keyof → Exclude → Pick` 三步讲清楚？
- [ ] 能否说出 `Partial<T>` 用于 patch 部分更新的场景？
- [ ] 能否用 `Record<number, string>` 构造一个状态码 → 错误信息的映射表？
- [ ] 能否解释 `ReturnType<typeof fn>` 里为什么要加 `typeof`？
- [ ] 能否分清 `Omit` 操作对象接口、`Exclude` 操作联合类型？
- [ ] 能否说出 `keyof T` 拿到的是"所有键的联合类型"？

掌握这七个工具类型，尤其是 `Omit` 背后的组合思路，就拿到了类型推导的第一套组合拳——**裁剪用 Pick/Omit、可选用 Partial、字典用 Record、取值用 ReturnType/Exclude/keyof，复杂需求自己拼。**
