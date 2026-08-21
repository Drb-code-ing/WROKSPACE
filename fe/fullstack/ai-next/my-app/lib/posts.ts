export type Post = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  sections: {
    heading: string;
    paragraphs: string[];
  }[];
};

export const posts: Post[] = [
  {
    slug: "csr-vs-ssr",
    title: "CSR 和 SSR：两种渲染方式怎么选",
    date: "2026-08-15",
    excerpt:
      "服务器只发空壳、浏览器再渲染，和服务器直接把渲染好的 HTML 发过去，两者的首屏速度、SEO、交互体验差别很大。",
    sections: [
      {
        heading: "CSR：客户端渲染",
        paragraphs: [
          "服务器只发一个空 HTML 加一坨 JS，页面在浏览器里渲染。流程是：浏览器请求 → 拿到空壳 → 下载并执行 JS → fetch 数据 → 把数据渲染成 DOM。",
          "优点：后续页面切换走前端路由，不整页刷新，交互流畅；服务器只发静态文件，压力小。缺点：首屏慢（要等 JS 下载、执行、fetch 全完成），SEO 差（爬虫看到的是空壳）。",
        ],
      },
      {
        heading: "SSR：服务端渲染",
        paragraphs: [
          "服务器拿到数据，在服务端把组件渲染成完整 HTML 再发给浏览器。浏览器收到就能直接显示，不需要再等 JS 渲染。",
          "优点：首屏快、SEO 好。缺点：服务器每次请求都要渲染，压力大；纯 SSR 的后续交互需要整页刷新，体验差。",
        ],
      },
      {
        heading: "水合：SSR 的补充",
        paragraphs: [
          "现代框架做「SSR + 水合」：服务器先发渲染好的 HTML 保证首屏，浏览器显示的同时下载 JS，JS 执行后接管已有的 DOM、绑定事件，变成可交互的 SPA。",
          "关键约束：服务端渲染的 HTML 和客户端首次渲染必须一致，否则 React 会警告 mismatch。所以 `Date.now()`、`Math.random()` 这类结果不确定的代码要放到 `useEffect` 里，它在水合之后才执行。",
        ],
      },
      {
        heading: "一句话区分",
        paragraphs: [
          "CSR：服务器发空壳，浏览器填内容。SSR：服务器填好内容，浏览器直接看。选哪个看场景——要 SEO 和首屏速度选 SSR，纯交互工具选 CSR。",
        ],
      },
    ],
  },
  {
    slug: "nextjs-rendering-modes",
    title: "Next.js 的渲染方式有哪几种",
    date: "2026-08-17",
    excerpt:
      "SSG、SSR、ISR、CSR 加上 RSC + Streaming，一个项目里可以按页面甚至按组件混用，核心是给每个部分选最合适的策略。",
    sections: [
      {
        heading: "五种渲染方式",
        paragraphs: [
          "CSR：组件加 'use client' 在浏览器渲染，适合交互组件。SSR：默认服务端组件，每次请求在服务器渲染，适合动态数据 + SEO。",
          "SSG：构建时渲染成静态 HTML，最快，适合博客、文档。ISR：静态页 + 定时重新生成，适合大体静态偶尔更新的内容。RSC + Streaming：服务端组件流式输出，边渲染边发，慢的部分用 Suspense 包起来异步补。",
        ],
      },
      {
        heading: "核心认知：不是四选一",
        paragraphs: [
          "这几种不是互斥的，可以在同一个项目里按页面混用，甚至同一个页面里服务端组件和 'use client' 子组件混合。",
          "切换靠几个开关：'use client' 决定客户端组件、fetch 的 cache 选项、export const dynamic、export const revalidate。Next.js 的精髓是让一个页面里不同部分用最合适的渲染方式，而不是整个应用一刀切。",
        ],
      },
      {
        heading: "默认行为",
        paragraphs: [
          "App Router 默认是 RSC + Streaming + 尽量静态化（fetch 默认缓存）。需要动态就改配置，需要交互就加 'use client'。",
        ],
      },
    ],
  },
];

export function getPostBySlug(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug);
}
