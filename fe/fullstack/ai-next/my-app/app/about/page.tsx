export default function About() {
  return (
    <div className="flex flex-col items-center justify-center bg-zinc-50 py-24 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col gap-12 px-6">
        {/* 标题 */}
        <header className="flex flex-col gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50">
            关于 Next.js
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Next.js 是一个基于 React 的全栈框架，由 Vercel 开发维护。它在 React
            之上补齐了路由、渲染、数据获取、优化、部署等一整条链路，让「一个项目搞定前后端」成为可能。
          </p>
        </header>

        {/* 核心特性 */}
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">核心特性</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-black/[.08] p-5 dark:border-white/[.145]">
              <h3 className="font-semibold text-black dark:text-zinc-50">App Router</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                基于文件的路由系统。目录即路由，page.tsx 定义页面、layout.tsx
                定义布局，不需要手动配置路由表。
              </p>
            </div>
            <div className="rounded-xl border border-black/[.08] p-5 dark:border-white/[.145]">
              <h3 className="font-semibold text-black dark:text-zinc-50">多种渲染方式</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                支持 SSR、SSG、ISR、CSR，每个页面甚至每个组件都可以选最合适的渲染策略。
              </p>
            </div>
            <div className="rounded-xl border border-black/[.08] p-5 dark:border-white/[.145]">
              <h3 className="font-semibold text-black dark:text-zinc-50">Server Components</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                组件默认在服务端渲染，直接把数据和 HTML 一起发给浏览器，减少客户端 JS。
              </p>
            </div>
            <div className="rounded-xl border border-black/[.08] p-5 dark:border-white/[.145]">
              <h3 className="font-semibold text-black dark:text-zinc-50">API Routes</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                同一项目里用 route.ts 写后端接口，前后端一体部署，不需要单独起一个服务。
              </p>
            </div>
            <div className="rounded-xl border border-black/[.08] p-5 dark:border-white/[.145]">
              <h3 className="font-semibold text-black dark:text-zinc-50">内置优化</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                next/image 自动压缩图片、next/font 优化字体、内置 SEO 元数据支持，开箱即用。
              </p>
            </div>
            <div className="rounded-xl border border-black/[.08] p-5 dark:border-white/[.145]">
              <h3 className="font-semibold text-black dark:text-zinc-50">全栈能力</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                服务端组件可以直接访问数据库、读取环境变量，少一次「后端吐 JSON
                再到前端 fetch」的网络往返。
              </p>
            </div>
          </div>
        </section>

        {/* 渲染方式速查 */}
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">渲染方式速查</h2>
          <div className="overflow-x-auto rounded-xl border border-black/[.08] dark:border-white/[.145]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-black/[.08] text-zinc-500 dark:border-white/[.145] dark:text-zinc-400">
                  <th className="px-5 py-3 font-medium">方式</th>
                  <th className="px-5 py-3 font-medium">渲染时机</th>
                  <th className="px-5 py-3 font-medium">适用场景</th>
                </tr>
              </thead>
              <tbody className="text-zinc-600 dark:text-zinc-400">
                <tr className="border-b border-black/[.08] dark:border-white/[.145]">
                  <td className="px-5 py-3 font-medium text-black dark:text-zinc-50">SSG</td>
                  <td className="px-5 py-3">构建时</td>
                  <td className="px-5 py-3">博客、文档等静态内容</td>
                </tr>
                <tr className="border-b border-black/[.08] dark:border-white/[.145]">
                  <td className="px-5 py-3 font-medium text-black dark:text-zinc-50">SSR</td>
                  <td className="px-5 py-3">每次请求</td>
                  <td className="px-5 py-3">动态数据 + 需要 SEO</td>
                </tr>
                <tr className="border-b border-black/[.08] dark:border-white/[.145]">
                  <td className="px-5 py-3 font-medium text-black dark:text-zinc-50">ISR</td>
                  <td className="px-5 py-3">构建时 + 定时再生</td>
                  <td className="px-5 py-3">大体静态、偶尔更新的页面</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-medium text-black dark:text-zinc-50">CSR</td>
                  <td className="px-5 py-3">浏览器端</td>
                  <td className="px-5 py-3">强交互组件</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 结语 */}
        <section className="flex flex-col gap-3 border-t border-black/[.08] pt-8 dark:border-white/[.145]">
          <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">什么时候用它</h2>
          <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
            追求首屏速度和 SEO 的网页应用、需要前后端一体的中小型项目，用 Next.js
            能省下大量脚手架工作。如果只是纯交互工具或需要多端共用 API，传统的
            SPA + 独立后端可能更合适。没有银弹，按场景选型。
          </p>
        </section>
      </main>
    </div>
  );
}
