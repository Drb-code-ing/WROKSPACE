# v074 博客大纲

**标题**：Next.js 性能优化与 shadcn/ui 组件库：静态生成、next/font、next/image 与「复制进项目」的组件落地
**日期**：2026-08-21
**目标平台**：稀土掘金（juejin.cn）

## 结构

| 章节 | 内容 | 来源 |
| --- | --- | --- |
| 引言 | 开门见山：博客站关心的两件事（首屏快、组件省）；create-next-app 博客把 Next.js 性能开关与 shadcn/ui 落地方式串起来 | fe/fullstack/ai-next/readme.md + my-app |
| 一、框架思维 | 框架=蓝图/工具箱；AI 上下文 = 组件 + 响应式业务 + SSR + api；为什么选 Next.js（两语言切换成本、Claude Code 支持、生态 shadcn/tailwind/vercel） | fe/fullstack/ai-next/readme.md |
| 二、App Router | 目录即路由；page/layout/loading/not-found/error 五个约定文件；本项目根布局 + 动态路由 [slug] | my-app/README.md + app/layout.tsx |
| 三、Link 组件 | 客户端导航无需整页刷新；仍走后端（RSC payload / Ajax）；dns-prefetch + 空闲预加载 → 秒开 | my-app/README.md |
| 四、shadcn/ui | 复制代码进项目而非 npm 依赖；components.json（style/rsc/aliases）；Button = base-ui 原语 + cva 变体 + cn 合并；render prop 组合；globals.css oklch 主题变量 + Tailwind v4 @theme | components/ui/button.tsx + lib/utils.ts + components.json + app/globals.css |
| 五、性能优化组合拳 | generateStaticParams（SSG）、generateMetadata（每页 SEO + params await）、next/font 自托管、next/image + priority、RSC 默认服务端渲染（无 'use client'）、notFound() 兜底 + 404 复用 Button | app/blog/[slug]/page.tsx + app/layout.tsx + app/page.tsx + app/not-found.tsx |
| 面试问答 | 约定文件分工、Link 秒开原理、generateStaticParams、shadcn vs antd、cn() 原理、next/font vs next/image、RSC 最省事 | 综合 |
| 结语 | 性能=用对开关；组件库=代码归你；检查清单 | 综合 |

## 核心结论

- **框架是给 AI 的上下文**：AI 上下文 = 组件 + 响应式业务 + 服务器端渲染 + api；Next.js 提供约束与最佳实践，AI 能按约束高效开发；不选它的代价是两套语言 + 上下文切换成本；
- **App Router 目录即路由**：page/layout/loading/not-found/error 五个约定文件各司其职，目录名直接映射 URL；
- **Link "秒开"靠两点**：客户端导航（无需整页刷新）+ 预加载（dns-prefetch 提前解析 DNS、浏览器空闲时提前下载目标页 RSC payload 数据）；
- **shadcn/ui 是复制代码而非安装依赖**：Button = base-ui 无样式原语（行为）+ cva 变体（视觉）+ cn() 合并（clsx 条件拼接 + tailwind-merge 冲突覆盖）；主题由 globals.css 的 oklch CSS 变量统一，暗色只切变量不改组件；
- **性能优化组合拳**：generateStaticParams 构建时静态生成（SSG）、generateMetadata 每页独立 SEO、next/font 自托管 + 按需子集、next/image + priority、RSC 默认服务端渲染（整个项目无 'use client'）、notFound() 兜底未覆盖路径并复用 shadcn Button。

## 引用说明

- 基于第六十三天提交 `ff2fdb5`（"第六十三天 性能优化与shadcn组件库"）：
  - `fe/fullstack/ai-next/readme.md`（框架思维 / 选型）——`ff2fdb5`；
  - `fe/fullstack/ai-next/my-app/README.md`（App Router 约定 + Link 客户端导航与预加载原理）——`ff2fdb5`；
  - `app/layout.tsx`（根布局 + next/font）、`app/page.tsx`（首页 + next/image priority + shadcn Button）、`app/blog/page.tsx`（列表页 posts 渲染）、`app/blog/[slug]/page.tsx`（generateStaticParams + generateMetadata + notFound）、`app/not-found.tsx`（404 复用 Button）——`ff2fdb5`；
  - `components/ui/button.tsx`（shadcn Button 三层骨架）、`lib/utils.ts`（cn = clsx + tailwind-merge）、`lib/posts.ts`（Post 类型与 getPostBySlug）、`components.json`（shadcn 配置）、`app/globals.css`（Tailwind v4 主题变量）——`ff2fdb5`。
- 未登记 package.json（依赖清单）/ tsconfig.json / next.config.ts（空配置）/ eslint.config.mjs / .gitignore / postcss.config.mjs / AGENTS.md（自动生成）/ CLAUDE.md（一行 @AGENTS.md）/ favicon.ico / public 图标。
