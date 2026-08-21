import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { posts, getPostBySlug } from "../../../lib/posts";

type Props = {
  params: Promise<{ slug: string }>;
};

// 构建时生成所有已知 slug 的静态页面
export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

// 每篇文章独立的 SEO 标题和描述
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "文章不存在" };
  return { title: post.title, description: post.excerpt };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  // slug 不存在（访问了未生成的路由）→ 返回 404
  if (!post) {
    notFound();
  }

  return (
    <div className="flex flex-col items-center justify-center bg-zinc-50 py-24 font-sans dark:bg-black">
      <article className="flex w-full max-w-3xl flex-col gap-8 px-6">
        <header className="flex flex-col gap-3">
          <Link
            href="/blog"
            className="text-sm font-medium text-zinc-400 transition-colors hover:text-black dark:text-zinc-500 dark:hover:text-zinc-50"
          >
            ← 返回博客列表
          </Link>
          <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50">
            {post.title}
          </h1>
          <time className="text-sm text-zinc-400 dark:text-zinc-500">
            {post.date}
          </time>
        </header>

        <div className="flex flex-col gap-8">
          {post.sections.map((section) => (
            <section key={section.heading} className="flex flex-col gap-3">
              <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph, i) => (
                <p
                  key={i}
                  className="text-base leading-7 text-zinc-600 dark:text-zinc-400"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
