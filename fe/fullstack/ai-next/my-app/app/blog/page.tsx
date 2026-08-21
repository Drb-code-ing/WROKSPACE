import Link from "next/link";
import { posts } from "../../lib/posts";

export default function Blog() {
  return (
    <div className="flex flex-col items-center justify-center bg-zinc-50 py-24 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col gap-8 px-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50">
            Blog
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-400">
            我的学习笔记
          </p>
        </header>

        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="flex flex-col gap-2 rounded-xl border border-black/[.08] p-6 transition-colors hover:border-black/[.16] dark:border-white/[.145] dark:hover:border-white/[.25]"
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
                  {post.title}
                </h2>
                <time className="shrink-0 text-sm text-zinc-400 dark:text-zinc-500">
                  {post.date}
                </time>
              </div>
              <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {post.excerpt}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
