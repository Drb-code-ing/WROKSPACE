# Next.js 全栈实战：Redis 数据层、规范驱动组件规划，与 RSC/CSR 的拆分边界

学完 Next.js 的 CSR/SSR 概念，第五十八天直接上手搭一个真正的全栈项目：一个支持 Markdown 的笔记系统 `next-blog`。这一天不再停留在"组件在哪里渲染"的理论，而是落到三件具体的事上——**用 `npx create-next-app` 起步、把数据存进 Redis、把侧边栏按 RSC 和 CSR 的边界拆成一颗组件树。**

一句话概括这一天：**先规划再动手，数据交给 Redis，组件按"服务端读数据、客户端做交互"拆。** 这是从"会用框架"走向"能落地一个全栈项目"的关键一步。

---

## 一、从 npx 到 create-next-app：脚手架背后的工具链

笔记开头先补了一个不起眼但高频的工具：`npx`。

`npx` 是 npm 自带的工具，作用是**直接运行一个 node 包，不用先全局安装**。想跑 `create-next-app` 但又不想让它常驻全局，就写：

```bash
npx create-next-app@latest
```

这句话等价于"临时下载 `create-next-app` 并执行一次"，跑完即走，不污染全局环境。笔记里那句对比很直白：

```text
npx = npm i -g create-next-app + create-next-app
```

差别只在"要不要全局安装"。对"我先试试这工具能不能跑通"这种场景，`npx` 是最省事的选择。

而 `create-next-app` 是什么？它是 **React 全栈开发脚手架**，帮我们一把拉起 SSR（服务器端渲染）、SEO（搜索引擎优化）、RSC（React Server Components）这些能力，以及 `use client`、hydration（水合）这些机制。第五十七天讲的 CSR/SSR，到这里有了一个能直接跑的载体。

---

## 二、需求先行：一个支持 Markdown 的笔记系统

项目需求很具体，是一个 CRUD 笔记系统，关键约束是 **Markdown**：

```text
存在数据库里的是 markdown 格式，页面显示的是 html（用 marked 转换）
```

也就是说：**存储层是 Markdown 原文，展示层要把它渲染成 HTML**——数据模型和展示模型是分离的，中间差一次 `marked` 转换。

需求拆成五条：

1. 界面分两列：左侧笔记列表、右侧笔记内容；
2. 点击 `new` 新增一条 Note，新增后左侧列表**同时更新**；
3. 编辑功能：可以删除一条笔记，左侧同步更新；
4. 可以编辑当前 Note，支持 Markdown；
5. 搜索功能。

路由和接口也一起定好了，走 App Router 的"文件即路由 + RESTful"：

```text
/               -> app/page.js            首页（左列表 + 右内容）
/add            -> POST 新增一条
/note/[id]      -> 动态路由，笔记详情
/edit/[id]      -> 修改
```

`[id]` 是动态路由的占位符，一条路径对应一个文件。需求、路由、接口先摆清楚，才轮到写代码。

---

## 三、规范驱动编程：先规划组件，再写代码

这一天的灵魂，是笔记里反复强调的一句话：

> **规范驱动编程**——开发之前不要急着写代码，先分析需求、技术方案（next.js）、任务细节（路由 + 组件）。

组件在笔记里的定位很关键：**组件是工作单元，是 AI 生成的工作单元。** 换句话说，把界面拆成清晰的组件，就等于给 AI（或队友）划好了一块块可以独立交付的活。

于是先规划出两颗组件树：

```text
Sidebar 侧边栏
  SidebarSearchField   搜索框
  EditButton           编辑按钮（可复用）
  SidebarList          笔记列表
    NoteItem           单个笔记条目

Note 笔记区
  NoteEditor           编辑界面
  NotePreview          预览界面（负责把 markdown 渲染成预览）
```

规划完组件，再定目录结构。Next.js 的目录是有约定的：

```text
app/           页面主目录（page.js / layout.js / [id]）
components/    组件
lib/           数据库操作、常用函数
public/        静态资源
```

一个关键约定：**next.js 的数据业务逻辑都放在 `lib` 目录下**。所以后面读 Redis 的代码放在 `lib/redis.js`，而不是散落在组件里。

---

## 四、目录结构里的两个细节：@ 别名与布局

目录定好后，笔记点了两个容易踩坑的细节。

**第一个是 `@` 路径别名。** 组件里要引入 `lib/redis.js`，如果用相对路径会越写越长：

```text
/app/notes/[id]/page.js  ->  ../../../lib/redis.js
```

越深的页面，`../` 越多，搬一次文件就要改一次。于是配一个别名，`@` 直接指向根目录：

```text
@/lib/redis.js
@/components/*
```

`@` 一步到位回到根目录，路径可读、不怕移动。

**第二个是布局的语义化结构。** 笔记给 `layout` 画了张骨架：

```text
html
  head
    title / meta keywords description
  body
    nav    侧边栏、导航栏
    section  语义化标签（独立的内容区块）
      children  page.js
```

这里有两个习惯值得学：用 `<section>` 这种**语义化标签**标出"这是一块独立内容"；以及**"注释大法"**——把"未来要做的事"用注释写下来（笔记叫 `to be continue`），既方便自己记忆，也方便团队协作。

样式方案上，笔记对比了两条路：**原子类（tailwindcss）**和 **BEM（Block 块 / Element 元素 / Modifier 修改器）**。前者开发快，后者可维护，各有利弊——这一步先记下，不急着选。

---

## 五、数据服务选型：为什么是 Redis

数据存哪？笔记的选择是 **Redis**。

Redis 是 **key:value 的 NOSQL 内存数据库**，几个特性笔记列得很清楚：

- 跑在 **6379 端口**；
- **没有数据表**，不是关系型数据库，**不用 SQL 驱动**；
- 数据**存在内存里**；
- 用起来"有点像 localStorage"，直接 `key:value` 存取。

但 Redis 比 localStorage"高级"的地方在于：**它对不同类型的数据，有优化的存储方式和不同的方法**。字符串用 `set/get`，哈希用 `hset/hget`，此外还能做**缓存、计数器、榜单**这些内存场景。

真正让 Redis 站上生产位置的是 **Redis + MySQL 的组合**。笔记用掘金首页举了个例子：

```text
掘金首页的文章列表，几分钟之内是不变的。
第一个用户来 -> 查 MySQL，把 posts 列表以 key:value 存进 Redis
下一个用户来 -> 直接从 Redis 读，不再打 MySQL
```

不变的热数据放内存里，挡住了绝大多数重复请求，MySQL 只在缓存失效时才被打一次。**Redis 是缓存层，不是主存储层**——这个分工是理解它的关键。

---

## 六、lib/redis.js：ioredis 客户端与 hash 存储

数据服务的落点，是 `lib/redis.js`。笔记在项目里用的客户端是 `ioredis`：

```js
// node redis 客户端
import Redis from 'ioredis'
// 连接 redis 数据库
const redis = new Redis()  // 默认 NOSQL

// hash：key 是字符串 ID，值是对应 note 的序列化字符串
const initialData = {
  "1702459181837": '{"title":"sunt aut","content":"...","updateTime":"..."}',
  "1702459182837": '{"title":"qui est","content":"...","updateTime":"..."}',
  "1702459188837": '{"title":"ea molestias","content":"...","updateTime":"..."}'
}

export async function getAllNotes() {
  const data = await redis.hgetall('notes')
  if (Object.keys(data).length === 0) {  // 空数据 -> 初始化
    await redis.hset('notes', initialData)
  }
  return await redis.hgetall('notes')
}
```

这里能读出三层设计：

1. **用 hash 存笔记集合**——`notes` 是一个 hash，里面的每个 field 是一条笔记的 ID，value 是该笔记的 **JSON 序列化字符串**（`JSON.stringify` 之后的文本）。NOSQL 没有"表"，就靠这种"序列化字符串 + 约定结构"来表达一条记录；
2. **读时的懒初始化**——`hgetall('notes')` 拿回来是空对象（`Object.keys(data).length === 0`）时，先 `hset` 写一份种子数据再返回。这样第一次访问也有内容可看；
3. **全是异步**——`async/await` 贯穿，因为 `ioredis` 的读写在 Node 里是异步 I/O。

一个值得注意的点：`hgetall` 返回的是**字符串字段的映射**，所以后面的组件里需要 `JSON.parse(note)` 把字符串还原成对象，`Object.entries(notes)` 把映射转成数组来 `map`。

---

## 七、组件拆分：Sidebar 组件树与 RSC/CSR 边界

数据层就位后，第七节是当天最值得回味的工程动作——**把 Sidebar 从一个大组件拆成一颗组件树，并且每一层都踩在 RSC/CSR 的边界上。**

最外层 `components/Sidebar.js` 是一个**服务端组件**（`async function`），负责把数据从 Redis 读出来：

```jsx
import { getAllNotes } from '@/lib/redis'
import SidebarNoteList from './SidebarNoteList'

export default async function Sidebar() {
  const notes = await getAllNotes()   // 服务端直接 await 读 Redis
  return (
    <section className="col sidebar">
      <Link href="/" className="sidebar-header">
        <img className="logo" src="/logo.svg" ... />
        <strong>LLM Notes</strong>
      </Link>
      <section className="sidebar-menu" role="menubar">
        {/* SideSearchField 未来干 */}
      </section>
      <nav>
        <SidebarNoteList notes={notes} />
      </nav>
    </section>
  )
}
```

它本身就是"注释大法"的示范：`SideSearchField` 还没做，先用注释占位；`<section>`、`role="menubar"` 都是语义化和无障碍的体现。

下一层 `components/SidebarNoteList.js` 是关键的**拆分点**。它头上那句注释把意图写透了：

```jsx
// SidebarNoteList(RSC SEO) -> 拆出来 SidebarNoteItem 组件(交互 CSR)

export default async function SidebarNoteList({ notes }) {
  const arr = Object.entries(notes);   // hash 转成二维数组，方便 map
  if (arr.length == 0) {
    return <div className="notes-empty">No Notes created yet!</div>
  }
  return (
    <ul className="notes-list">
      {arr.map(([noteId, note]) => (
        <li key={noteId}>
          <SidebarNoteItem noteId={noteId} note={JSON.parse(note)} />
        </li>
      ))}
    </ul>
  )
}
```

为什么这么拆？**列表本身要在服务端渲染（SEO 需要把笔记标题直接写进 HTML），但单条笔记条目未来要点击、要展开、要交互，那是客户端的事。** 于是把"读数据 + 渲染列表"留在 RSC 层，把"可能带交互的单条条目"单独拆成 `SidebarNoteItem`。

`components/SidebarNoteItem.js` 承接 `JSON.parse` 后的对象，解构出字段，并用 `dayjs` 格式化时间：

```jsx
import dayjs from 'dayjs'
import SidebarNoteItemContent from './SidebarNoteItemContent'

export default function SidebarNoteItem({ noteId, note }) {
  const { title, content = '', updateTime } = note
  return (
    <SidebarNoteItemContent
      id={noteId}
      title={title}
      expandChild={
        <p className="sidebar-note-excerpt">
          {content.substring(0, 20) || <i>(No content)</i>}
        </p>
      }
    >
      <header className="sidebar-note-header">
        <strong>{title}</strong>
        <small>{dayjs(updateTime).format('YYYY-MM-DD')}</small>
      </header>
    </SidebarNoteItemContent>
  )
}
```

最后到叶子节点 `components/SidebarNoteItemContent.js`，它是整个组件树里**唯一标了 `'use client'` 的组件**：

```jsx
'use client'
import { useState, useEffect } from 'react'

export default function SidebarNoteItemContent({ id, title, children, expandChild }) {
  return (
    <>
      {children}
    </>
  )
}
```

它现在只渲染 `{children}`，是个占位——但它已经准备好了 `useState`/`useEffect` 的导入，`expandChild` 这个 prop 也埋好了"展开子内容"的钩子。**`'use client'` 就是 RSC 和 CSR 的分界标记：往上走是服务端组件，往下走进入客户端组件。** 哪天这条笔记要"点击展开预览"，交互代码就加在它身上，不用动上面的 RSC 层。

整颗树的边界长这样：

```text
Sidebar                 async 服务端组件    await 读 Redis（RSC）
  SidebarNoteList       async 服务端组件    map 出列表，JSON.parse（RSC）
    SidebarNoteItem     纯组件             dayjs 格式化时间（CSR）
      SidebarNoteItemContent  'use client'  交互占位，expandChild 钩子（CSR）
```

这一拆，把"服务端读数据、客户端做交互"这个抽象原则，落实成了一条清晰的组件树边界。

---

## 八、面试问答

**问：npx 和 npm i -g 有什么区别？**

> `npx` 是 npm 自带的包运行器，能直接运行一个 node 包而不全局安装，用完即走；`npm i -g` 是真正把包装到全局常驻。`npx create-next-app` 就等价于"临时下载并执行一次 create-next-app"，适合"我先试试工具能不能跑"的场景。

**问：这个笔记系统里，存储格式和展示格式为什么不一样？**

> 数据库里存的是 Markdown 原文，页面上要显示 HTML，中间用 `marked` 做转换。这样做的意义是"存储模型"和"展示模型"分离：Markdown 是纯文本、易存储、可复用；HTML 只是展示层的一种形态，将来要换渲染方式也不影响数据。

**问：Redis 是什么，和 MySQL 有什么区别？**

> Redis 是 key:value 的 NOSQL 内存数据库，跑在 6379 端口，没有数据表、不是关系型、不用 SQL 驱动，数据存在内存里，用起来像 localStorage。区别在于：MySQL 是关系型、数据落盘；Redis 是内存型、读写极快但容量受内存限制。所以生产上常用 Redis 做缓存、计数器、榜单，MySQL 做主存储。

**问：Redis 里不同类型的数据怎么存？**

> 字符串用 `set/get`，哈希用 `hset/hget`，Redis 对每种类型有优化的存储方式和对应方法。笔记项目里用 hash 存笔记集合：`notes` 是一个 hash，field 是笔记 ID，value 是笔记的 JSON 序列化字符串。

**问：为什么笔记项目要引入 Redis + MySQL 的组合？**

> 因为很多热数据（比如掘金首页文章列表）在几分钟内不变。第一个用户来时查 MySQL，把结果以 key:value 存进 Redis；后续用户直接从 Redis 读，不再打 MySQL。Redis 当缓存层挡掉重复请求，MySQL 只在缓存失效时才被命中——Redis 是缓存层，不是主存储层。

**问：Sidebar 组件为什么要拆成 SidebarNoteList → SidebarNoteItem → SidebarNoteItemContent 三层？**

> 核心是 RSC 和 CSR 的分工。列表要在服务端渲染（SEO 需要把标题直接写进 HTML），所以 `SidebarNoteList` 保持 `async` 服务端组件；但单条笔记条目未来要点击、展开、交互，那是客户端的事，所以拆出 `SidebarNoteItem`，最后用标了 `'use client'` 的 `SidebarNoteItemContent` 作为交互占位。这样"服务端读数据、客户端做交互"就落成了一条清晰的组件树边界。

**问：`'use client'` 在 Next.js 里是什么作用？**

> 它是 RSC 和 CSR 的分界标记。标了 `'use client'` 的组件是客户端组件，可以在里面用 `useState`、`useEffect` 等 hooks 做交互；没标的组件默认是服务端组件，能在服务器上 `await` 读数据、把 jsx 编译成 HTML。往上走是服务端，往下走进入客户端。

---

## 结语：先规划，再动手，把边界落实成组件树

这一天没引入新算法，却完成了从"会用 Next.js"到"能搭全栈项目"的跨越，关键就三步：

```text
工具链      npx create-next-app    临时运行脚手架，不用全局安装
需求先行    笔记 CRUD + Markdown   存 markdown，展示 html（marked）
规范驱动    先规划组件再写代码      组件 = 工作单元 = AI 的交付单元
数据层      Redis  hash 存储        key:value 内存库，热数据做缓存
组件边界    RSC 读数据 / CSR 交互   'use client' 是分界标记
```

动手前，拿这份清单自检：

- [ ] 能否说清 `npx` 和 `npm i -g` 的区别？
- [ ] 能否解释"存 markdown、展示 html"背后的存储/展示模型分离？
- [ ] 能否说出 Next.js 四个目录（app/components/lib/public）各自职责？
- [ ] 能否说明 `@` 路径别名解决什么问题？
- [ ] 能否讲清 Redis 是什么、和 MySQL 的分工（缓存层 vs 主存储）？
- [ ] 能否解释 `lib/redis.js` 里 hash 存笔记、懒初始化的设计？
- [ ] 能否说出 `'use client'` 在 RSC/CSR 边界上的作用？
- [ ] 能否复述 Sidebar 三层拆分各自是服务端还是客户端？

搭项目不难，难的是**动手之前先想清楚组件怎么切、数据放哪、边界划在哪**。把这些想透了，剩下的代码反而是水到渠成。
