import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <main className="flex flex-col items-center gap-6 text-center">
        <p className="text-sm font-medium tracking-widest text-zinc-400 dark:text-zinc-500">
          404
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50">
          页面不存在
        </h1>
        <p className="max-w-md text-base leading-7 text-zinc-600 dark:text-zinc-400">
          你访问的地址没有对应的页面，可能是链接失效了，或者页面被移动了。
        </p>
        <Button
          variant="default"
          size="lg"
          className="h-11 rounded-full px-6"
          render={<Link href="/" />}
        >
          返回首页
        </Button>
      </main>
    </div>
  );
}
