# 全栈项目部署到公网：五步部署链路、DNS 与安全组，和 nginx 反向代理的分流

第六十六天（2026-08-31）做的，是把学过的前后端项目真正搬到公网：买一台腾讯云轻量服务器、用宝塔面板管理、用 nginx 把前端静态资源和后端 `/api` 接口分开处理。之前的项目都跑在本地 `localhost`，只有自己看得见；部署的意义在于——写好的全栈项目，别人用浏览器输入一个网址就能访问。围绕这个动手过程，有四个技术核心：**部署全流程是"买服务器 → 买域名备案 → 配 HTTPS → nginx 反向代理 → 服务器安全"五步**；**用户访问一个网站，背后是 DNS 解析、安全组/防火墙、端口三层门禁**；**nginx 是生产环境真正的入口，静态资源直接返回、`/api` 请求反代给后端**；以及**宝塔面板和服务器准备：nvm 管 Node 版本、MySQL 分 dev/prod 两库**。这篇按落地顺序讲，最后落到当天配套的 Future Capsule（时间胶囊）全栈项目上——前端构建出静态资源、后端提供 JSON 接口，正好是"要被 nginx 分流的那套东西"。

---

## 一、部署全流程：五步把本地项目搬到公网

学习阶段的取舍，先从平台对比说起：Vercel 这类云端部署对 Next.js + Supabase 项目很友好，但比较固定；Java、Go、Python 类后端对部署自由度要求更高；而国内访问，更常用**腾讯云**。运维在国内大厂被当作加分项，部署正是它的起点。

笔记里给的部署全流程是五步：

1. **得花钱买服务器**。一台轻量云服务器（腾讯云约 35 元/月），Linux 系统，买到手就有一个公网 IP；
2. **买域名，备案 10-20 天**。备案是国内域名的必经手续——服务器有了公网 IP，还得让用户记住一个"名字"而不是一串数字，域名就在这；备案的耗时决定了"上线"不是当天能完成的事；
3. **配置 HTTPS**。更安全的 HTTP + SSL：给域名配上证书，浏览器地址栏锁上小锁，传输内容加密；
4. **nginx 反向代理**。用户访问的是 80/443 端口，但业务拆成了前端静态资源 + 后端接口两套，nginx 作为中间人把请求分到该去的地方；
5. **服务器安全**。公网服务器随时被扫描试探，安全组、防火墙、最小化开放端口都是防线。

这套"使命"背后是一个很朴素的分层：**前后端分离项目**，前端是 React + TS 这种组件工程，`npm run build` 产出 `dist/` 静态资源文件；后端是 Node 的 `/api` 接口，返回 JSON。一个跑在浏览器里、一个跑在服务器上，nginx 在中间做分发。

---

## 二、用户访问一个网站，背后发生了什么

理解了"要做什么"，再看"访问"本身。用户在浏览器输入网址按下回车，第一步是 DNS。

**1. DNS：先查地址，再去敲门。**

浏览器不知道服务器的位置，它先问域名系统（DNS）这个网址对应哪台服务器的公网 IP：

```text
Browser → DNS → 服务器公网 IP
```

笔记里的说法很形象："先查地址，再去敲门"。这个查询会**缓存在本地**，不用每次都走到最上层——查询链是逐级向上的：

```text
browser → 上网设备系统 → 局域网 → 城域网 → 根服务器
```

越往上层越权威，但也越慢；所以在每一层都会缓存，命中就直接返回，避免每次都打到根服务器。

**2. 安全组与防火墙：两道"看门人"。**

找到服务器 IP 只是到了小区门口，能不能进，还看两道门卫——笔记里把安全组和防火墙都比喻成"小区大门保安，不让进"，但位置不同：

- **安全组**：在**云厂商网络层**（比如腾讯云的控制台里），控制这台云服务器哪些端口能被外网访问；
- **防火墙**：在**服务器操作系统内部**，同样控制端口放行。

同一个目标，两层把关。云厂商层面没放行，请求根本到不了系统；系统层面没放行，到了也被拒。**生产里两台都要配，缺一层都是洞。**

**3. 端口：尽量少开。**

服务器上的每个服务占一个端口，门卫放不放行按端口来。默认端口里，**80 是 HTTP、443 是 HTTPS**，要对外提供服务基本必开；**3306 是 MySQL**，属于"可选择的访问"——数据库通常只开放给某些开发/运维 IP，甚至不开公网。原则是：**尽量的少开放端口**，配合 IP 限流，挡掉恶意 IP。

---

## 三、nginx：真正的入口，静态与动态的分流

流量过了防火墙，进到服务器，第一个真正接手的应用是 **nginx**。nginx 是一个高性能 Web 服务器，笔记里总结它做三件事：**接收请求、返回静态文件、把请求转发给后端**。

它站在最前面，按请求的路径把流量分开：

- **静态资源**：React + TS 打包出的 `dist/`，用户访问根路径 `http://119.45.34.88/`，nginx 直接返回 `index.html` 和对应的 JS/CSS——这些文件就是构建产物，nginx 读磁盘就能给，不需要后端参与；
- **动态资源**：`/api` 开头的请求走服务器路由。用户请求 `http://119.45.34.88/api/todos`，nginx 不会自己处理，而是**反向代理**给 Node 后端：

```text
http://119.45.34.88/             → index.html（静态资源，nginx 直接返回）
http://119.45.34.88/api/todos    → nginx 反代 → http://119.45.34.88:3000/todos → JSON
```

后端在 `3001`（或其他端口）上跑着，但它不直接对公网暴露；用户只访问 80/443，nginx 把 `/api` 前缀的请求悄悄转给内部的后端服务，拿到 JSON 再返回给前端调用。这正是**反向代理**的含义——代理的是服务器这一侧，客户端根本感知不到后端的存在。

顺带解决了跨域问题。开发期前端在 `5173`（Vite）上跑，访问 `/api/todos` 靠 Vite 的 mock 配置拦截；**到了生产，前端资源（80/443）和后端接口（经 nginx 反代后同源）都在同一个域名下，跨域根本不存在**。前后端通信变成了一次普通的同源请求，这也是"nginx 反代天然消解 CORS"的原因。

---

## 四、宝塔面板与服务器准备：nvm、nginx 与 MySQL 双库

服务器有了、nginx 思路通了，接下来是"怎么在上面干活"。全量 Linux 命令行部署成本高、难度大，所以笔记选了**宝塔（BT Panel）**——一套可视化的服务器管理面板，等于给服务器装了一个"控制台/操作系统后台"，点击操作完成部署。它的优势：网站目录统一在 `/www/wwwroot`，管理面板跑在 `8888` 端口，可视化、自由度高——"想怎么部署就这么部署"。

服务器准备按项目类型分：

- **Node 项目**：装 **nvm**（Node 版本管理器）。一台服务器要同时容纳多个 Node 版本，nvm 用"指针"切换当前是哪个版本——不同项目依赖不同的 Node 版本，这就是它的用武之地；
- **HTML 项目**：装 nginx（纯静态站交给 nginx 直接服务）；
- **MySQL**：安装后**建 `dev` / `prod` 两个库**，开发和线上互相不影响。笔记里两个库的密码也是独立的——dev 一套、prod 一套，环境隔离从数据库层就开始了。

笔记最后一句是"项目现在本地跑起"——要部署的 Future Capsule 项目在本地已经跑通，下一步就是按这套流程搬到服务器上。

---

## 五、部署的对象：Future Capsule 时间胶囊（前端）

当天配套的全栈项目叫 **Future Capsule（未来胶囊）**：用户写一条消息封存起来、设定一个解锁时间，没到时间时别人只能看到倒计时，时间一到内容才公开——一个"写给未来自己"的应用。

前端是 React + Vite，四个组件/模块各解决一个问题：

**1. 瀑布流布局：响应式列数。** `WaterfallLayout` 按窗口宽度动态决定列数，窄屏 1 列、中屏 2 列、宽屏 3 列：

```jsx
const updateColumns = () => {
  const width = window.innerWidth;
  if (width < 600) setColumns(1);
  else if (width < 900) setColumns(2);
  else setColumns(3);
};
// resize 事件上监听，卸载时移除
```

分列算法很简单：按 `index % columns` 轮流塞进各列，保证大致均衡：

```jsx
const distributeItems = () => {
  const cols = Array.from({ length: columns }, () => []);
  items.forEach((item, index) => cols[index % columns].push(item));
  return cols;
};
```

**2. 时间胶囊卡片：倒计时解锁。** `CapsuleCard` 是核心交互。未解锁的胶囊每秒算一次剩余时间（天/时/分/秒），用 `setInterval` 驱动；一旦到点，用一个 `hasTriggeredUnlock` ref 保证**只触发一次**解锁刷新：

```jsx
const calculateTimeLeft = () => {
  const now = new Date();
  const unlockTime = new Date(capsule.unlock_time);
  const diff = unlockTime - now;
  if (diff <= 0) {
    if (!hasTriggeredUnlock.current) {
      hasTriggeredUnlock.current = true;
      onUnlock?.();          // 通知上层刷新列表
    }
    return 'UNLOCKING...';
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
  const minutes = Math.floor((diff % (1000*60*60)) / (1000*60));
  const seconds = Math.floor((diff % (1000*60)) / 1000);
  // days > 0 → "Xd Xh Xm"；hours > 0 → 精确到秒；否则 "Xm Xs"
};
setTimeLeft(calculateTimeLeft());
const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
return () => clearInterval(timer);
```

这个 `hasTriggeredUnlock` ref 是关键细节：倒计时组件每秒都会重算，到点那一秒 `calculateTimeLeft` 可能被调多次，如果每次都调 `onUnlock` 就会重复请求；用 ref 记住"已经触发过了"，后续每秒只返回 `UNLOCKING...` 文本，不再重复通知。

**3. 无限滚动：分页加载。** `useInfiniteScroll` 是个通用 Hook，把"翻页追加"封装起来。滚动到底部附近触发 `loadMore`，靠一个 `loadingRef.current` 做**并发闸门**——请求没结束前再滚到底也不会重复发：

```js
const loadMore = useCallback(async () => {
  if (loadingRef.current || !hasMore) return;   // 防重复请求
  loadingRef.current = true;
  setLoading(true); setError(null);
  try {
    const response = await fetchData(page);
    setItems(prev => [...prev, ...response.data]);  // 追加到列表尾部
    setHasMore(response.hasMore);
    setPage(prev => prev + 1);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false); loadingRef.current = false;
  }
}, [page, hasMore, fetchData]);
```

它还提供 `refresh()`：清空列表、回到第 1 页重新拉，新建胶囊成功后就调它让新内容立即出现。滚动监听在 `window` 上，判断"视口高度 + 已滚动距离 ≥ 文档高度 - 200"就加载下一页。

**4. 新建表单与 API 层。** `CapsuleForm` 是弹窗表单，`datetime-local` 选择解锁时间，`getMinDateTime()` 用**本地时间**拼最小可选值——这里特意避开 UTC，否则选出的时间会差 8 小时；提交时再 `new Date(unlockTime).toISOString()` 转成 UTC 字符串传给后端。API 层 `api.js` 用 axios 实例统一 baseURL：

```js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const api = axios.create({ baseURL: API_BASE_URL });
```

`VITE_API_URL` 环境变量就是为部署准备的——本地默认打 `localhost:3001`，部署时把 `VITE_API_URL` 指到服务器地址/nginx 反代路径，一行不用改。

---

## 六、Future Capsule 后端：分页接口与解锁逻辑

后端是 Express + TypeScript + MySQL，职责边界很干净：前端只负责展示，**"这条胶囊该不该显示内容"由服务端决定**。

**1. 入口：启动前先连库。** `app.ts` 组装中间件与路由：`cors()` 放行跨域、`express.json()` 解析请求体，`/api/capsules` 挂胶囊路由，`/health` 做健康检查。最关键的是 `startServer`——**先 `testConnection()` 验证数据库连得上，才 `app.listen`**；连不上就打日志并 `process.exit(1)` 退出，避免"进程起来了、接口全 500"的假成功：

```ts
const startServer = async () => {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error: any) {
    console.error('\n❌ Failed to start server:');
    console.error(error.message);
    process.exit(1);
  }
};
startServer();
```

**2. 连接测试：把"连不上"讲清楚。** `db.ts` 用 `mysql2/promise` 建连接池（`connectionLimit: 10`、`waitForConnections: true`）。`testConnection` 拿到连接就释放，关键在**错误分类**——把 MySQL 报错码翻译成人话：

```ts
if (error.code === 'ECONNREFUSED') {
  throw new Error(`Cannot connect to MySQL at ${dbConfig.host}:${dbConfig.port}\n` +
    'Please check:\n  1. MySQL server is running\n  2. Host and port are correct\n  3. Firewall allows the connection');
} else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
  throw new Error('Access denied. Please check your DB_USER and DB_PASSWORD');
} else if (error.code === 'ER_BAD_DB_ERROR') {
  throw new Error(`Database "${dbConfig.database}" does not exist. Please create it first.`);
}
```

部署到服务器上最容易踩的三个坑——MySQL 没起/端口不通、账号密码错、库不存在——都在启动阶段一次性暴露，而不是等接口请求时才含糊地报错。

**3. 列表接口：服务端算解锁状态。** `getCapsules` 做分页：`page`/`limit` 默认 `1`/`20`，`offset = (page-1)*limit`；先 `COUNT(*)` 拿总数，再 `ORDER BY created_at DESC LIMIT ? OFFSET ?` 取当前页。业务核心在这一段——**服务端把 `is_unlocked` 算好，未解锁的胶囊 `content` 直接返回 `null`**：

```ts
const now = new Date();
const capsules: CapsuleResponse[] = (rows as Capsule[]).map(capsule => {
  const isUnlocked = new Date(capsule.unlock_time) <= now;
  return {
    id: capsule.id,
    content: isUnlocked ? capsule.content : null,  // 未解锁：内容不回传
    author: capsule.author,
    unlock_time: capsule.unlock_time.toISOString(),
    created_at: capsule.created_at.toISOString(),
    is_unlocked: isUnlocked
  };
});
const response: PaginatedResponse<CapsuleResponse> = {
  data: capsules,
  hasMore: offset + limit < total,
  total
};
```

前端拿到的 `content` 是 `null` 时，卡片就显示"锁 + 倒计时"；只有解锁的胶囊才带正文。**解锁判断放服务端**意味着前端改时间、改代码都骗不过去——这也是"信任边界放后端"的一个小例子。`hasMore` 用 `offset + limit < total` 判断，正好对上无限滚动的"是否还有下一页"。

**4. 新建接口：校验放哪、默认值是什么。** `createCapsule` 校验 `content`、`unlock_time` 必填，且**解锁时间必须晚于当前**，否则返回 400：

```ts
const unlockDate = new Date(unlock_time);
if (unlockDate <= new Date()) {
  res.status(400).json({ error: 'Unlock time must be in the future' });
  return;
}
const [result] = await pool.query<ResultSetHeader>(
  'INSERT INTO capsules (content, author, unlock_time) VALUES (?, ?, ?)',
  [content, author || '匿名', unlockDate]
);
res.status(201).json({ id: result.insertId, message: 'Capsule created successfully' });
```

`author` 可选，不传默认 `'匿名'`。类型契约在 `types/index.ts` 里对齐前后端：`CapsuleResponse.content` 声明为 `string | null`，把"未解锁没内容"写进了类型，前后端谁也别想绕过。构建脚本 `tsc` 编译到 `dist/`，`node dist/app.js` 启动——**这个 `dist/` 就是要部署到服务器上的产物**，和前端 `vite build` 出的 `dist/` 一起，构成 nginx 分流的两端。

---

## 面试问答

**问：把一个全栈项目部署到公网，大致要做哪几步？**

> 五步：买一台云服务器（有公网 IP）→ 买域名并备案（国内 10-20 天）→ 配置 HTTPS → 用 nginx 做反向代理（静态资源直接返回、/api 反代给后端）→ 服务器安全加固（安全组、防火墙、最小化开端口）。

**问：用户输入网址后，DNS 做了什么？为什么要多级缓存？**

> DNS 把域名解析成服务器公网 IP，"先查地址再去敲门"。查询链逐级向上：浏览器 → 设备系统 → 局域网 → 城域网 → 根服务器，越往上越权威但越慢。所以在每一层缓存，命中就直接返回，避免每次都打到根服务器，这是 DNS 能扛住全网查询量的关键。

**问：安全组和防火墙有什么区别？**

> 目标相同（控制哪些端口能被外网访问），位置不同。安全组在**云厂商网络层**（腾讯云控制台），防火墙在**服务器操作系统内部**。请求要过两道门：云厂商层面没放行到不了系统，系统层面没放行到了也被拒。生产环境两层都要配，缺一层都是洞。

**问：nginx 在前后端分离项目里扮演什么角色？跨域问题为什么在生产不存在？**

> nginx 是生产环境真正的入口，做**静态/动态分流**：`/` 开头的静态资源（react build 的 dist）直接返回文件；`/api` 开头的请求反向代理给 Node 后端（如 :3001），拿到的 JSON 再返回给前端。因为前端资源和后端接口都在同一个域名下（nginx 统一了端口），前后端通信是同源请求，跨域在生产根本不存在——这也是 nginx 反代消解 CORS 的原因。

**问：服务器上为什么要用 nvm？**

> 一台服务器要同时容纳多个 Node 版本，而不同项目依赖不同的 Node 版本。nvm 是 Node 版本管理器，用"指针"指向当前激活的版本，需要哪个版本就切哪个，避免"项目 A 要 18、项目 B 要 20"互相打架。

**问：为什么 MySQL 要建 dev/prod 两个库？**

> 开发和线上互相不影响。开发时随手造的数据、改坏的表结构都在 dev 库；prod 库保持干净稳定。两库密码也独立。环境隔离从数据库层就开始了，这是"开发环境怎么折腾都不影响线上"的第一道闸。

**问：Future Capsule 里"未解锁的胶囊"只能看倒计时，这个判断放前端还是后端？为什么？**

> 放后端。`getCapsules` 在服务端算 `is_unlocked = new Date(unlock_time) <= now`，未解锁的胶囊 `content` 返回 `null`，前端拿不到内容只能渲染"锁 + 倒计时"。判断放服务端意味着用户改前端代码、改本地时间都骗不过去——数据边界和信任边界都收在服务端。

**问：`useInfiniteScroll` 里的 `loadingRef` 是干什么的？**

> 并发闸门。滚动事件在浏览器里触发频率很高，如果每次都发请求，还没返回又滚到底会重复请求。`loadingRef.current` 在请求期间置为 true，`loadMore` 开头判断"正在加载或有没更多"就直接 return；`finally` 里复位。保证同一时刻只有一个分页请求在途。

**问：倒计时组件为什么用 `hasTriggeredUnlock` ref，而不是在效果里直接调用解锁？**

> 因为 `setInterval` 每秒都会执行一次 `calculateTimeLeft`，到点那一秒可能连续算到 diff ≤ 0。如果每次都对 `onUnlock()` 无脑调用，会触发多次刷新请求。ref 记录"已经触发过了"，第一次到点触发后，后续只返回 `UNLOCKING...` 文案，不再重复通知上层。

---

## 结语：把本地项目变成公网可访问

第六十六天的产出，是把"本地能跑"升级成"公网可访问"的整条认知链路：

```text
部署链路  买服务器 → 买域名/备案 → 配置 HTTPS → nginx 分流 → 反向代理 /api
访问链路  浏览器 → DNS 找到 IP → 安全组/防火墙放行 80/443 → nginx → 静态资源 / 后端接口
项目准备  前端 vite build 出 dist（静态）+ 后端 tsc 出 dist（/api JSON）
          → 宝塔面板管理，nvm 管 Node 版本，MySQL dev/prod 双库隔离
```

动手前，拿这份清单自检：

- [ ] 能否讲清部署全流程的五步（买服务器 → 域名备案 → HTTPS → nginx 反代 → 安全加固），以及各步解决什么问题？
- [ ] 能否解释用户访问网站的 DNS 解析链与多级缓存，以及安全组与防火墙的位置区别？
- [ ] 能否说清 nginx 如何做静态/动态分流，跨域为什么在生产不存在？
- [ ] 能否说明宝塔面板、nvm、MySQL dev/prod 双库各自解决什么问题？
- [ ] 能否讲出 Future Capsule 前后端各自的关键实现：倒计时解锁（ref 防重复）、无限滚动（loadingRef 闸门）、服务端算 `is_unlocked` 且未解锁 `content` 返回 `null`？

**这一天的本质，是把"写完一个项目"推进到"让世界访问它"**：五步部署链路是流程骨架，DNS 与安全组是理解"流量怎么进来"，nginx 分流是把前端静态资源与后端接口对接上，宝塔面板与服务器准备是运维落地的工具链。而 Future Capsule 用它完整的前后端，演示了"要被部署的东西"长什么样——前端只展示、后端守着数据边界，中间一层 nginx 让两边同源。理解了这条链路，再回头看 `localhost` 上的项目，就多了一双"它该部署到哪、怎么被别人访问"的眼睛。
