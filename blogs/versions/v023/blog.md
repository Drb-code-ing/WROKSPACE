# RESTful API 与面向接口编程：一个 AI Native 开发者的后端工程化初体验

## 引言

v018 搭好了 Bun + TypeScript 的后端基础设施——装好了"锅"和"灶"。v022 搞懂了 JS 的八种数据类型——搞清楚了"食材"长什么样。

今天该**动手做菜**了：搭建第一个 RESTful API。

写后端，本质就是两件事：**定义数据结构**（接口）和**组织访问方式**（路由）。今天从 OOP 的接口概念出发，用 TypeScript 定义 Todo 类型，再用 Bun 的 HTTP 服务器把 RESTful 路由搭起来。一个完整的 Todo API——从零到能跑。

**这是后端工程化的第一块实战拼图。**

## 一、OOP 三大支柱与接口

在写接口之前，先搞清楚"接口"在 OOP 里到底是什么意思。

### 面向对象的三大支柱

```
OOP（面向对象编程）
├── 封装（Encapsulation）—— 数据 + 操作数据的方法打包在一起
├── 继承（Inheritance） —— 子类复用父类的属性和方法
└── 多态（Polymorphism） —— 同一个方法名，不同类有不同的实现
```

- **封装**：把数据和操作数据的方法绑在一起，对外只暴露必要的接口。比如一个 `Todo` 对象，内部怎么存的你不需要知道，你只需要知道它能 `toggle()`。
- **继承**：`Animal` 有 `eat()`，`Dog extends Animal` 自动拥有 `eat()`，还能加自己的 `bark()`。
- **多态**：`Dog` 和 `Cat` 都继承 `Animal`，但 `makeSound()` 叫出来的声音不一样。

### 接口：OOP 的契约

**接口（Interface）是 OOP 中的核心概念。** 它用于声明一个对象的"约束"——这个对象必须有哪些属性、哪些方法。

接口 = 契约。你实现这个接口，就必须遵守这份契约。

```typescript
// 接口定义了"Todo 应该长什么样"
interface Todo {
    id: string
    title: string
    completed: boolean
    createdAt: Date
}

// 任何符合这个接口的对象都是合法的 Todo
const myTodo: Todo = {
    id: "1",
    title: "写博客",
    completed: false,
    createdAt: new Date()
}
```

**抽象类**是接口的"半成品"版本——它可以有部分实现，子类继承后补全剩余部分。接口则是"纯规范"，只有声明没有实现。

> **面向接口编程**是设计模式的基础。不是针对具体实现写代码，而是针对接口规范写代码——这样实现可以随意替换，只要满足接口契约即可。

## 二、TypeScript 接口实战：定义 Todo 类型

回到代码。在我们的 Todo API 里，第一件事就是定义"任务"长什么样：

```typescript
// ts = js + 强类型
// 自定义类型对象：interface
interface Todo {
    id: string
    title: string
    completed: boolean
    createdAt: Date
}
```

用 `interface` 定义了 Todo 的四个字段：
| 字段 | 类型 | 含义 |
|------|------|------|
| `id` | `string` | 唯一标识 |
| `title` | `string` | 任务标题 |
| `completed` | `boolean` | 是否完成 |
| `createdAt` | `Date` | 创建时间 |

**这就是 TypeScript 的核心价值：** 在编译阶段就约束好数据结构，代码写错立马报红，不用等到运行时才发现 `todo.titel` 拼错了。

然后初始化几条假数据：

```typescript
const todos: Todo[] = [
    { id: "1", title: "吃饭", completed: false, createdAt: new Date() },
    { id: "2", title: "睡觉", completed: false, createdAt: new Date() },
    { id: "3", title: "打豆豆", completed: false, createdAt: new Date() },
]
```

`todos: Todo[]` —— TypeScript 知道这个数组里每一项都是 Todo 类型。后续你写 `todos[0].title`，编辑器会有完整的智能提示和类型检查。

## 三、RESTful 设计思想：一切皆资源

有了数据结构，接下来要设计 API——用户怎么访问这些数据？

### RESTful 的核心理念

**RESTful = 一切皆资源。** URL 不是"动作"，而是"资源的位置"。对资源的操作由 HTTP 动词来表达。

```
传统风格（不 RESTful）：
  GET /getTodos
  POST /addTodo
  POST /deleteTodo

RESTful 风格：
  GET    /todos      → 获取所有任务
  POST   /todos      → 创建新任务
  GET    /todos/1    → 获取 id=1 的任务
  PUT    /todos/1    → 更新 id=1 的任务
  DELETE /todos/1    → 删除 id=1 的任务
```

**URL 规则：资源名词 + HTTP 动词。**
- URL 路径用**名词复数**（`/todos`，不是 `/getTodo`）
- 操作语义由 HTTP method 表达（GET 查、POST 增、PUT 改、DELETE 删）
- 同一个路径 `/todos`，不同的 method 触发不同的操作

### 路由：资源的交通警察

不同资源在不同路径上，需要有机制把请求分发到对应的处理函数——这就是**路由（Router）**。

```
请求：GET /todos/2
        │
        ▼
    ┌──────────┐
    │  路由器   │  ← "交通警察"
    │  Router  │
    └──────────┘
        │
        ├─ /todos  ──→ getAllTodos()
        ├─ /todos/1 ──→ getTodoById("1")
        └─ /todos/2 ──→ getTodoById("2")
```

路由的本质：**解析 URL → 匹配路径 → 调用对应的处理函数。**

## 四、Bun HTTP 服务器：从零到伺服状态

Bun 内置了高性能 HTTP 服务器，不需要 Express、不需要 Koa——一个 `Bun.serve()` 搞定。

### 服务器启动

```typescript
const server = Bun.serve({
    port: 8080,
    async fetch(req) {
        // 所有请求都在这里处理
    }
})
```

**发生了什么？**
1. `Bun.serve()` 在 8080 端口启动一个 HTTP 服务
2. 服务器进入**伺服状态**——持续监听，等待请求
3. 任何到达 `http://localhost:8080` 的请求，都会触发 `fetch` 函数

### IP 与端口

- **IP 地址**：对应一台服务器（物理机或云主机）
- **端口**：同一台机器可以开启多个服务——HTTP 服务、邮件服务、数据库服务……每个服务监听不同的端口号。`localhost:8080` → 本机的 8080 端口

### HTTP 请求/响应模型

```
浏览器                          服务器
  │                               │
  │  ──── HTTP Request ────────→  │
  │  GET /todos                  │  Bun.serve()
  │  Headers: {...}              │  fetch(req)
  │                               │
  │  ←──── HTTP Response ─────── │
  │  200 OK                      │  Response.json(todos)
  │  Body: [{...}, {...}]        │
  │                               │
```

HTTP 是基于**请求-响应**的协议：客户端发送一个 Request，服务器返回一个 Response。`Bun.serve` 的 `fetch` 函数就是处理这个循环的地方。

## 五、路由分发实战：把请求分给正确的处理函数

### 解析 URL

```typescript
async fetch(req) {
    const url = new URL(req.url)  // 解析用户访问的地址
    // https://baidu.com:port/pathname?key=value
    //                      ↑ 我们关心的是 pathname
}
```

`new URL(req.url)` 把原始 URL 字符串解析成结构化对象，`url.pathname` 就是路径部分。

### CORS 跨域配置

```typescript
const headers = {
    'Access-Control-Allow-Origin': "*"  // 允许任意来源访问
}
```

开发阶段先放开跨域限制，让前端能调通 API。生产环境再收紧到指定域名。

### 路由匹配

```typescript
// 路由 1：GET /todos → 返回所有任务
if (req.method === 'GET' && url.pathname === "/todos") {
    return Response.json(todos, { headers })
}

// 路由 2：GET /todos/:id → 返回单个任务
if (req.method === 'GET' && url.pathname.startsWith("/todos/")) {
    const id = url.pathname.split("/")[2]    // 从 "/todos/2" 中提取 "2"
    const todo = todos.find((t) => t.id === id)
    return Response.json(todo)
}

// 兜底
return Response.json({ msg: 'hello world' })
```

**关键细节：**

- `req.method` —— 拿到 HTTP 动词（GET、POST、PUT、DELETE）
- `url.pathname` —— 拿到路径（`/todos`、`/todos/2`）
- `startsWith("/todos/")` —— 匹配带路径参数的路由
- `split("/")[2]` —— 从路径中提取 id（`"/todos/2"` → `[""", "todos", "2"]` → `"2"`）
- `todos.find()` —— 在数组中按 id 查找对应的 todo
- `Response.json()` —— 把 JS 对象序列化成 JSON 并设置正确的 Content-Type

**这就是手写路由的本质：** 一连串 `if` 判断——匹配 method + pathname → 执行对应逻辑。框架（Express、Hono、Elysia）只是把这些 if 包装成了更优雅的 DSL。

## 六、完整代码走读

把上面的知识串起来，就是完整的 Todo API：

```typescript
// 1. 定义数据结构：接口
interface Todo {
    id: string
    title: string
    completed: boolean
    createdAt: Date
}

// 2. 数据存储（暂时用内存数组）
const todos: Todo[] = [
    { id: "1", title: "吃饭", completed: false, createdAt: new Date() },
    { id: "2", title: "睡觉", completed: false, createdAt: new Date() },
    { id: "3", title: "打豆豆", completed: false, createdAt: new Date() },
]

// 3. 启动 HTTP 服务器
const server = Bun.serve({
    port: 8080,
    async fetch(req) {
        // 4. CORS 配置
        const headers = { 'Access-Control-Allow-Origin': "*" }

        // 5. 解析 URL
        const url = new URL(req.url)

        // 6. 路由分发
        // GET /todos —— 获取所有任务
        if (req.method === 'GET' && url.pathname === "/todos") {
            return Response.json(todos, { headers })
        }

        // GET /todos/:id —— 获取单个任务
        if (req.method === 'GET' && url.pathname.startsWith("/todos/")) {
            const id = url.pathname.split("/")[2]
            const todo = todos.find((t) => t.id === id)
            return Response.json(todo)
        }

        // 7. 兜底响应
        return Response.json({ msg: 'hello world' })
    }
})
```

**代码结构非常清晰：**

```
接口定义 → 数据初始化 → 启动服务器 → 请求处理 → 路由分发 → 返回响应
   ↑                                              ↑
 TypeScript 强类型约束                  RESTful 资源命名 + HTTP 动词语义
```

## 结语

今天从零搭建了一个完整的 RESTful Todo API。虽然简单，但五脏俱全：

1. **OOP 三大支柱** —— 封装（数据+方法）、继承（复用父类）、多态（同名不同实现）。接口是 OOP 的契约
2. **TypeScript 接口** —— `interface Todo` 定义了任务的数据结构，编译阶段就能发现类型错误。面向接口编程是设计模式的基础
3. **RESTful 设计** —— 一切皆资源。URL 用名词（`/todos`），操作语义由 HTTP 动词表达（GET/POST/PUT/DELETE）
4. **Bun HTTP 服务器** —— `Bun.serve` 内置高性能服务器，一个 `fetch` 函数处理所有请求
5. **路由分发** —— 解析 URL → 匹配 method + pathname → 调用对应逻辑。手写路由就是一堆 if，框架只是 DSL 包装
6. **路径参数提取** —— `split("/")[2]` 从 `/todos/:id` 中提取 id，`find()` 匹配数据

v018 搭好了 Bun + TypeScript 的"锅和灶"。v022 搞懂了 JS 的"食材"（数据类型）。**今天终于做出了第一道菜——一个能跑起来的 RESTful API。**

这个 Todo API 还很简单——数据在内存里，服务重启就丢了；只有 GET 读没有 POST 写；没有错误处理。但它是后端工程化的第一个里程碑：**你理解了接口、资源、路由三者之间的关系。**

下一步：接入真正的数据库，把数据持久化。

下篇见。
