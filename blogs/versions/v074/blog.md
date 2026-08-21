# Next.js 性能优化与 shadcn/ui 组件库：静态生成、next/font、next/image 与「复制进项目」的组件落地

做一个博客站，最关心的永远是两件事：首屏够不够快、组件够不够省。第六十三天的笔记用 `create-next-app` 搭了一个博客应用（App Router + shadcn/ui），正好把 Next.js 的两类能力串起来：一类是框架内置的**性能优化开关**——静态生成、字体优化、图片优化、路由预加载；另一类是**组件库的落地方式**——shadcn/ui 不靠 `npm install` 装一个巨型运行时依赖，而是把组件源码复制进你的项目。这篇文章从框架思维讲起，拆开 App Router 的文件路由与 Link 的预加载原理，再用 `components/ui/button.tsx` 看 shadcn 组件到底长什么样，最后盘点这个博客项目里用到的每一组性能开关。

---

## 一、框架思维：为什么说 Next.js 是面向 AI 的全栈框架

笔记开篇用一个比喻定义框架：框架是建筑蓝图、是工具箱——你不需要从零盖房子，它已经提供了地基、墙壁和屋顶的基本架构，你只需要关注"装修"和业务。过去框架是给开发者用的，现在框架也是给 AI 用的。

这里有一个很关键的等式（笔记原话）：

> **AI 上下文 = 组件 + 响应式业务 + 服务器端渲染 + api**

不用框架时，项目是一堆散乱的积木，处处要自己定规矩：图片放哪里（`/public`？）、页面文件放哪里（`/app`？）、组件放哪里（`/components`？）。用了框架，"文件放在哪里、请求方法放哪里"这类决策全是预设的最佳实践，开发者专注业务逻辑。这一点对 AI 开发尤其重要——**框架给 AI 一套约束、一套上下文，AI 能更高效地按约束开发项目**，这和 SDD 文档驱动约束异曲同工。

为什么选 Next.js，笔记给了三个理由：

- **传统全栈要两套语言**：react + Java/Python，前后端之间切换有上下文成本；Next.js 一套 JS 搞定前后端；
- **Claude Code / Codex 支持最好**：CSR/SSR 的约束与简化开箱即用；
- **生态超级丰富**：shadcn/ui（组件）、tailwindcss（原子类名自带语义，特别适合 AI 学习）、Vercel（JS 栈 + AI Coding Agent 生态的技术公司，快捷发布）。

---

## 二、App Router：目录即路由，几个文件就是一套约定

`my-app/README.md` 第一句就点明：Next.js 用文件系统映射路由。**目录名直接映射到 URL 路径**——`app/blog` 就是 `/blog`，`app/blog/[slug]` 就是 `/blog/:slug` 动态路由，不需要手写路由表。

几个约定文件各司其职：

| 文件 | 职责 |
| --- | --- |
| `page.tsx` | 页面内容 |
| `layout.tsx` | 布局，全局共享（导航、页脚等） |
| `loading.tsx` | 加载中的 UI |
| `not-found.tsx` | 404 页面 |
| `error.tsx` | 错误边界 UI |

这次项目里，根布局 `app/layout.tsx` 做了两件事：给全站套上 `html`/`body` 和一段全局 header 导航（Home / About / Blog 三个 `Link`），以及注册字体（第五部分再讲）。

---

## 三、Link 组件：客户端导航 + 预加载，"秒开"的秘密

`my-app/README.md` 专门讲透了 `Link` 组件。它是**客户端导航——无需刷新页面**。点击 `Link` 不会像传统 `<a>` 那样整页白一下再加载，而是走前端路由做局部刷新。

但注意：**局部刷新 ≠ 不请求后端**。笔记点破了一个常见误解——"还是要请求后端的，只是不整页刷新（白一下）"。前端导航时，Next.js 会自动发一个 **RSC payload（React Server Component 序列化数据）**：数据是后端拿的，只是走 Ajax 请求，而不是浏览器传统的整页导航。

`Link` 的第二个能力是**预加载**。Next.js 会给可连接的页面预加载资源，具体表现是自动加上 `dns-prefetch` 这类预取提示：

> 浏览器空闲时就会提前下载目标页的数据，"秒开"。

配合上面的 RSC payload，用户在空闲时段把目标页的 DNS 解析和数据提前准备好，点击的瞬间页面已经是"热"的。DNS 本身就是一张 key-value 分布式数据库（domain → IP），`dns-prefetch` 把它提前解析好，省掉了那段时间。

---

## 四、shadcn/ui：不是安装依赖，而是复制代码进项目

shadcn/ui 的官方定位就是"复制粘贴进你的应用"（Copy & paste the best components into your codebase）。它不是一个发布到 npm 的巨型运行时组件库，而是通过 CLI 把**组件源码直接写进项目**——代码归你所有、随你改动、不进 `node_modules`。

`components.json` 是 shadcn 的配置文件，描述这个项目怎么用 shadcn：

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": { "css": "app/globals.css", "baseColor": "neutral", "cssVariables": true },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

关键信息：`rsc: true`（兼容服务端组件）、`cssVariables: true`（主题走 CSS 变量）、`style: "base-nova"`（当前版本的风格，底层原语选的是 Base UI）。

组件本体长什么样？看 `components/ui/button.tsx`。它的骨架是三层：

**1. 原语层**：`@base-ui/react` 的 `Button` 提供无样式的交互行为——`disabled`、焦点管理、键盘交互、无障碍。shadcn 不重复造行为，只包一层视觉。

**2. 变体层**：`cva`（class-variance-authority）声明视觉变体。一个按钮有 6 种 `variant`（default / outline / secondary / ghost / destructive / link）和 6 种 `size`，每个都是纯 Tailwind 类名字符串：

```tsx
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none ...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline: "border-border bg-background hover:bg-muted ...",
        destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20 ...",
        link: "text-primary underline-offset-4 hover:underline",
        // secondary / ghost ...
      },
      size: { default: "h-8 gap-1.5 px-2.5 ...", sm: "...", lg: "...", icon: "size-8", /* xs / icon-xs / icon-sm / icon-lg */ },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)
```

**3. 组装层**：`cn()` 把传进来的 `className` 和变体类合并。`cn()` 本身是 `clsx` + `tailwind-merge`：

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

`clsx` 负责条件拼类名（数组、对象、布尔判断），`tailwind-merge` 负责**解决冲突**——外部传 `h-12` 会覆盖默认的 `h-8`，而不是两个类名都留着。这就是首页按钮传 `h-12` 能盖过默认高度的原因。

`Button` 还支持 **render prop 组合**——把一个 `<a>` 塞进按钮的行为里，按钮点起来是链接：

```tsx
<Button
  variant="default"
  size="lg"
  className="h-12 w-full rounded-full md:w-[158px]"
  render={<a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer" />}
>
  Deploy Now
</Button>
```

**主题从哪来？** `globals.css` 里，Tailwind v4 用 `@theme inline` 把 `--color-background` 这类设计 token 映射到 `:root` / `.dark` 里定义的一堆 oklch 颜色变量：

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-primary: var(--primary);
  /* ... */
}

:root {
  --background: oklch(1 0 0);
  --primary: oklch(0.205 0 0);
  /* ... */
}
```

组件代码里的 `bg-primary`、`text-muted-foreground` 最终都解析到这些变量；暗色模式只切换 `.dark` 下的变量值，组件一行不用改。**这就是 shadcn 的复用逻辑：设计 token 由变量统一，视觉变体由 cva 统一，类名冲突由 tailwind-merge 统一。**

---

## 五、性能优化组合拳：一个博客项目里用了哪些开关

这个 create-next-app 博客虽然简单，但把 Next.js 的性能开关几乎都用了一遍：

**1. 静态生成：`generateStaticParams()`**（`app/blog/[slug]/page.tsx`）

```tsx
// 构建时生成所有已知 slug 的静态页面
export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}
```

博客详情页在构建时就把所有文章的 HTML 生成好了（SSG），用户访问时服务器不用现渲染，CDN / 静态托管直接把文件发给浏览器，首屏最快。

**2. 每页独立 SEO：`generateMetadata()`**

```tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "文章不存在" };
  return { title: post.title, description: post.excerpt };
}
```

动态路由的参数 `params` 在 Next.js 里是 `Promise`（要 `await`），拿到 slug 后查数据、生成 `title`/`description`——每篇文章的搜索标题都不同。

**3. 字体优化：`next/font`**（`app/layout.tsx`）

```tsx
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
```

`next/font` 会在**构建时下载字体并自托管**，运行时不向 Google 发请求；还按需生成子集，只加载页面用到的字符，并通过 `variable` 注入到 `<html>`。

**4. 图片优化：`next/image` + `priority`**（`app/page.tsx`）

```tsx
<Image className="dark:invert h-5 w-[100px]" src="/next.svg" alt="Next.js logo" width={100} height={20} priority />
```

`next/image` 自动做尺寸、格式、懒加载优化；首页 Logo 是首屏关键图，加 `priority` 让它优先加载而不是懒加载。

**5. 默认服务端渲染（RSC）**：整个项目没有任何一个 `'use client'`，所有页面默认在服务端渲染成 HTML + RSC 序列化数据，客户端 JS 极少——这是"性能优化"里最省事的一步。

**6. 静态页覆盖不到的路径 → 404**：`generateStaticParams` 之外的路由（如 `/blog/不存在的slug`）由 `notFound()` 兜底，配合 `app/not-found.tsx` 渲染 404 页；而 404 页里的按钮又复用同一个 shadcn `Button`——组件库的复用从第一屏延伸到错误页。

---

## 面试问答

**问：App Router 里 page.tsx / layout.tsx / not-found.tsx 分别负责什么？**

> 目录即路由。page.tsx 是页面内容；layout.tsx 是共享布局（导航、页脚），在子路由间保持；not-found.tsx 是 404 页面；loading.tsx 是加载态；error.tsx 是错误边界 UI。目录名直接映射 URL 路径。

**问：next/link 和普通 `<a>` 有什么区别？为什么能"秒开"？**

> next/link 是客户端导航，点击不整页刷新、只做局部更新。但它不是"不请求后端"——Next.js 会自动发一个 RSC payload（React Server Component 序列化数据），数据仍是后端拿的，只是走 Ajax 而非整页导航。同时 Next.js 预加载可连接的页面：`dns-prefetch` 提前解析 DNS，浏览器空闲时提前下载目标页数据，所以用户点下去时页面已就绪，体验"秒开"。

**问：generateStaticParams 是做什么的？**

> 它告诉 Next.js 在构建时生成哪些动态路由的静态页面。返回的数组每个元素对应一个路径参数（这里是所有博客的 slug），构建时就把这些详情页渲染成静态 HTML（SSG），运行时服务器不用现渲染。未被覆盖到的路径再交给 `notFound()` 兜底。

**问：shadcn/ui 和 antd、Element Plus 这类组件库有什么本质区别？**

> antd 是 npm 依赖，import 进来的是 `node_modules` 里的运行时包，样式和逻辑藏在依赖里，定制要靠覆盖或主题系统。shadcn/ui 是"复制粘贴进项目"的源码组件：CLI 把组件代码写进你的 `components/` 目录，代码归你所有、随便改；通过 `components.json` 配置风格与别名，底层原语可选（Base UI / Radix），视觉变体用 cva 管理，主题用 CSS 变量统一。

**问：cn() 函数为什么用 clsx 加 tailwind-merge？**

> clsx 负责条件类名拼接（数组、对象、布尔判断），tailwind-merge 负责解决 Tailwind 类名冲突——外部传的 `h-12` 会覆盖默认的 `h-8`，而不是两个类名并存。两者配合，组件既能给默认样式，又允许外部 className 灵活覆盖。

**问：next/font 和 next/image 各优化了什么？**

> next/font 在构建时下载字体并自托管，运行时不请求字体 CDN，并按需生成子集只加载用到的字符，避免布局偏移。next/image 自动做图片的尺寸、格式、懒加载优化，首屏关键图用 `priority` 属性优先加载。

**问：这个项目里"性能优化"最省事的一步是什么？**

> 默认的服务端渲染（RSC）。整个项目没有任何 `'use client'`，所有页面默认在服务端渲染成 HTML + RSC 数据，客户端 JS 极少——这是"少发代码"级别的优化，很多优化开关都要在这个前提下才有意义。

---

## 结语：性能优化是"用对开关"，组件库是"代码归你"

第六十三天的这个博客项目，把 Next.js 的两种"省"讲清楚了：

```text
性能优化
  generateStaticParams()   构建时静态生成，省运行时渲染
  generateMetadata()       每篇文章独立 SEO，省手写标签
  next/font                字体自托管 + 按需子集，省网络请求
  next/image + priority    图片自动优化，省带宽
  next/link + 预加载       客户端导航 + RSC payload，省整页刷新
  RSC 默认服务端渲染        省客户端 JS

shadcn/ui
  components.json          描述项目怎么用 shadcn
  Button = 原语 + cva + cn  行为(base-ui) / 变体(cva) / 合并(tailwind-merge)
  主题 = CSS 变量 + oklch    暗色只切变量，不改组件
```

动手前，拿这份清单自检：

- [ ] 能否说清"AI 上下文 = 组件 + 响应式业务 + 服务器端渲染 + api"？
- [ ] 能否讲出 App Router 里 page / layout / not-found / loading / error 五个约定文件的分工？
- [ ] 能否解释 next/link 为什么"秒开"（RSC payload + dns-prefetch 预加载）？
- [ ] 能否讲出 shadcn/ui 与 antd 的本质区别（复制代码进项目 vs npm 依赖）？
- [ ] 能否说清 Button 组件里 base-ui、cva、cn() 各负责什么？
- [ ] 能否讲出 generateStaticParams / generateMetadata / next/font / next/image 各自的优化点？

性能优化的本质不是堆技术，而是把框架给的开关用对；组件库的本质不是"装了多少依赖"，而是"有多少代码归你掌控"。
