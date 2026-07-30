# React 数据请求的第一步：用 TypeScript 契约串起 API、Effect 与列表渲染

一个成员列表看起来很简单：请求一组数据，然后 `map` 成表格行。但真正决定代码能否持续维护的，并不是那段 JSX，而是数据在进入组件前经历了什么、异步结果如何驱动 UI 更新。

本文用一个 React + TypeScript 成员列表示例，拆开一条最常见的数据链路：

```text
数据模型（model）
  → 请求模块（api）
  → 组件初始状态
  → useEffect 发起异步请求
  → setState 保存结果
  → map 渲染列表
```

核心目标不是把一次请求“跑通”，而是让每层都只做自己该做的事情。

---

## 一、一个列表页，至少有三种职责

很多刚开始写 React 的项目会把类型、模拟数据、请求、状态和表格 JSX 全堆在一个组件文件中。它能运行，但数据来源变成真实接口、字段发生变化或多个页面复用同一份数据时，组件会很快失控。

更清晰的划分是：

| 层级 | 职责 | 不该关心什么 |
| --- | --- | --- |
| `model/` | 定义数据长什么样 | 数据从哪里来、如何展示 |
| `api/` | 获取并返回数据 | 表格有几列、组件怎么渲染 |
| 组件 | 保存 UI 状态、触发请求、渲染界面 | 组装底层请求细节 |

这不是为了目录而目录，而是为了建立稳定边界：**API 改变时优先影响 API 层；展示改变时优先影响组件；字段契约改变时由 TypeScript 提前暴露影响范围。**

---

## 二、先写 Model：把“猜字段”变成类型契约

成员数据模型可以先定义为：

```ts
export interface MemberEntity {
  id: number
  login: string
  avatar_url: string
}
```

它的价值不是少写几次字段名，而是给整条链路声明了统一约定：

- `id` 是数字，可用于业务定位和 React 列表 `key`；
- `login` 是展示用户名的字符串；
- `avatar_url` 是头像地址；
- 任何地方漏传字段、把 `id` 当成字符串或拼错 `avatar_url`，编辑器和编译器都能尽早提示。

没有模型时，组件常会退化成下面这样：

```ts
const [members, setMembers] = useState([])
```

此时 TypeScript 往往只能推断为过窄的空数组类型，或者开发者被迫使用 `any[]`。前者不方便赋值，后者则把类型保护全部放弃。更准确的写法是：

```ts
const [members, setMembers] = useState<MemberEntity[]>([])
```

`[]` 表示“初始时没有可渲染成员”，`MemberEntity[]` 则表示“请求成功后，这里只能放合法的成员对象”。

> `model` 不是数据库实体的机械复制，而是前端当前业务真正依赖的数据契约。后端返回冗余字段时，前端也不必全部照搬进 UI 模型。

---

## 三、API 层：让组件只知道“我要成员”，而非“怎么拿成员”

将请求放进独立模块：

```ts
import type { MemberEntity } from '../model/member'

export const getMemberCollection = (): Promise<MemberEntity[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1457912,
          login: 'brauliodiez',
          avatar_url: 'https://avatars.githubusercontent.com/u/1457912?v=3',
        },
      ])
    }, 1000)
  })
}
```

当前实现用 `Promise + setTimeout` 模拟网络延迟，但调用方只依赖函数签名：

```ts
(): Promise<MemberEntity[]>
```

这意味着将来换成 `fetch`、Axios，甚至换到 BFF 接口，组件都无需改变自己的调用方式：

```ts
const members = await getMemberCollection()
```

这就是 API 层的意义：**把数据获取的实现细节封装起来，把业务可理解的函数和稳定返回类型暴露给 UI。**

### `Promise<MemberEntity[]>` 到底表达了什么？

拆开看：

```text
Promise<T>          → 结果不会立刻得到，需要等待异步操作完成
MemberEntity[]      → 成功结果是一组成员，每一项满足 MemberEntity
Promise<MemberEntity[]> → 异步完成后得到一组合法成员
```

因此，以下代码不只是“能运行”，还受到类型检查保护：

```ts
const members = await getMemberCollection()
setMemberCollection(members)
```

如果 API 层错误返回 `{ name: 'Tom' }`，问题应在数据边界处暴露，而不是等到 JSX 中访问 `member.avatar_url` 才出现 `undefined`。

---

## 四、首次渲染与请求：页面为什么不会被异步任务卡住？

组件的关键结构如下：

```tsx
const [memberCollection, setMemberCollection] =
  React.useState<MemberEntity[]>([])

React.useEffect(() => {
  ;(async () => {
    const members = await getMemberCollection()
    setMemberCollection(members)
  })()
}, [])
```

执行顺序应理解成：

```text
1. 组件函数执行，memberCollection 初始为 []
2. React 根据 [] 提交首屏 UI
3. useEffect 在提交后执行
4. 发起 getMemberCollection() 异步请求
5. 请求完成，await 得到 members
6. setMemberCollection(members)
7. React 以新状态重新执行组件并更新列表
```

所以首屏不会等待接口返回。`useEffect` 负责的是副作用：网络请求、订阅、计时器、手动操作 DOM 等；它不应该阻塞 React 的渲染过程。

### 为什么不能直接写 `useEffect(async () => {})`？

下面写法看似自然，却不符合 Effect 的返回约定：

```tsx
// 不推荐
React.useEffect(async () => {
  const members = await getMemberCollection()
  setMemberCollection(members)
}, [])
```

`async` 函数一定返回 `Promise`；但 `useEffect` 回调只能返回：

- `undefined`：没有清理工作；
- 清理函数：用于取消订阅、清除定时器等。

因此要在普通 Effect 回调内部启动异步函数：

```tsx
React.useEffect(() => {
  const loadMembers = async () => {
    const members = await getMemberCollection()
    setMemberCollection(members)
  }

  loadMembers()
}, [])
```

示例里的 async IIFE（立即执行异步函数）和这个命名函数写法本质相同。实际团队代码中，命名函数通常更利于阅读、调试和补充错误处理。

### `[]` 依赖数组表示什么？

```tsx
React.useEffect(effect, [])
```

表示该 Effect 在组件挂载后执行一次。这里的请求只需要在页面首次进入时加载，不应因为每次 `setState` 重新渲染就重复请求。

但不要把 `[]` 当作“所有请求都必须这样写”的模板：如果请求依赖 `userId`、搜索词或分页参数，就应将真正依赖的值放进数组中，否则会请求到旧数据。

---

## 五、`setState` 后发生了什么：不是改 DOM，而是更新 UI 的输入

请求完成后：

```ts
setMemberCollection(members)
```

不是直接往表格里插入 `<tr>`，也不是修改原数组。它是在通知 React：组件下一次渲染应使用这份新的 `memberCollection`。

渲染代码保持声明式：

```tsx
<tbody>
  {memberCollection.map((member) => (
    <MemberRow key={member.id} member={member} />
  ))}
</tbody>
```

首次渲染时：

```text
memberCollection = []
[] .map(...) = []
→ tbody 暂时没有成员行
```

请求成功后的渲染：

```text
memberCollection = [memberA, memberB]
map(...) = [<MemberRow />, <MemberRow />]
→ React 比对新旧 UI，补上两行
```

这就是状态驱动 UI：**组件不关心“该在哪里插一行”，只描述“给我一组成员时，页面应长什么样”。**

---

## 六、为什么 `key` 应该来自 API 的稳定 ID？

列表写法中的这一行很重要：

```tsx
<MemberRow key={member.id} member={member} />
```

`key` 不是传给 `MemberRow` 的普通 props，它是 React 用来识别同一条列表项身份的内部标记。排序、插入或删除时，React 依靠它判断哪些节点可复用。

优先级应是：

```text
服务端稳定业务 ID  >  本地生成的稳定 ID  >  数组下标
```

不推荐用数组下标：

```tsx
members.map((member, index) => <MemberRow key={index} member={member} />)
```

因为当列表中间插入一项后，后续每个 index 都会变化。React 可能把原来某一行的 DOM 状态错误复用到另一条数据上，包含输入框、动画或局部状态的列表尤其容易出问题。

`member.id` 同时具备业务身份和稳定性，是最合适的选择。

---

## 七、从练习到真实页面：还应补齐哪些状态？

只用空数组表示初始状态足够完成练习，但真实页面至少应区分四种状态：

```text
idle/loading  → 正在请求
success       → 请求成功，可能是空列表也可能有数据
error         → 请求失败
empty         → 请求成功但没有任何成员
```

最小实现可以拆成独立状态：

```tsx
const [members, setMembers] = React.useState<MemberEntity[]>([])
const [loading, setLoading] = React.useState(true)
const [error, setError] = React.useState<string | null>(null)
```

请求逻辑应保证 loading 在结束时恢复：

```tsx
React.useEffect(() => {
  let cancelled = false

  const loadMembers = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getMemberCollection()

      if (!cancelled) {
        setMembers(result)
      }
    } catch (error) {
      if (!cancelled) {
        setError('成员列表加载失败，请稍后重试')
      }
    } finally {
      if (!cancelled) {
        setLoading(false)
      }
    }
  }

  loadMembers()
  return () => {
    cancelled = true
  }
}, [])
```

这里的 `cancelled` 不是请求取消器，而是一个过期结果保护：组件卸载后或新的请求已经替代旧请求后，不再让旧结果回写状态。对于支持 `AbortSignal` 的 `fetch`，生产代码通常还会配合 `AbortController` 真正取消未完成请求。

需要注意：不要把“没有成员”和“接口失败”都渲染成空表格。前者是正常业务结果，后者需要可见的错误提示和重试入口。

---

## 八、常见错误：从现象反推数据链路

### 1. `map is not a function`

通常说明 state 不是数组。检查 API 层是否真的返回 `MemberEntity[]`，而不是把 HTTP 整个响应对象直接塞进 state：

```ts
// 例如真实接口可能需要取 response.data
setMembers(response.data)
```

类型契约可以让这个问题更早暴露。

### 2. Effect 无限请求

常见原因是：没有依赖数组，或依赖中放了每次渲染都会新建的对象/函数。先回答一个问题：**这次请求究竟依赖哪些值？** 依赖数组应反映真实答案，而不是为了消除警告随意增删。

### 3. 快速切换筛选条件后显示旧结果

这是请求竞态：先发出的慢请求反而后返回，覆盖了后发请求的结果。可用 `AbortController` 取消旧请求，或通过请求序号判断结果是否仍然有效。

### 4. 列表更新后某行输入内容“串了”

优先检查 `key` 是否用了 index。稳定业务 ID 能保证 React 将状态留在正确的数据项上。

---

## 九、面试如何回答这条链路？

**问：为什么把请求写到 `useEffect` 里？**

> 网络请求属于副作用，不应该在 render 阶段发起。组件先用初始 state 渲染，提交后在 Effect 中请求，成功后通过 setState 触发新的渲染。这样首屏不会被异步操作阻塞。

**问：为什么 API 函数返回 `Promise<MemberEntity[]>`？**

> `Promise` 描述异步边界，`MemberEntity[]` 描述成功结果的数据形状。组件只依赖这个稳定契约，不依赖模拟数据、fetch 或具体 HTTP 客户端，实现可以在 API 层替换。

**问：为什么不在 JSX 中直接调接口？**

> 渲染可能执行多次，直接调用会带来重复请求和不可预测副作用。JSX 应只根据当前 state 描述 UI，请求应由 Effect 管理。

**问：空数组是不是就代表加载中？**

> 不能完全等同。空数组可能表示尚未请求，也可能表示请求成功但没有数据；生产页面应额外管理 loading 和 error，避免错误地展示空状态。

---

## 结语：一条好数据链路，先让职责各归其位

一个可维护的成员列表，不是“请求成功后 `map` 出来”就结束了：

```text
Model：定义可相信的数据形状
API：提供可替换的异步数据入口
State：保存当前 UI 所依赖的数据
Effect：管理请求等副作用
Render：只把 state 映射为页面
```

当这几个边界清晰时，模拟数据换成真实接口、列表增加筛选和分页、请求加入 loading 与重试，都不需要推倒组件重写。

下一次写列表页前，可以先检查：

- [ ] 数据模型是否明确？
- [ ] API 是否返回有类型的 Promise？
- [ ] 初始状态、加载失败和空数据是否被区分？
- [ ] 请求是否放在正确的 Effect 中？
- [ ] `key` 是否来自稳定业务 ID？
- [ ] 旧请求结果是否可能覆盖新状态？

先把这条链路搭稳，再讨论复杂状态管理或请求库，才不会在“能跑”的代码里积累难以维护的隐患。
