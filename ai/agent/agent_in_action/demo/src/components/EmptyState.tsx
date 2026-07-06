import { memo } from "react";
import { ClipboardList } from "lucide-react";
import type { FilterType } from "@/types/todo";

interface EmptyStateProps {
  filter: FilterType;
  hasTodos: boolean;
}

const MESSAGES: Record<FilterType, { title: string; desc: string }> = {
  all: {
    title: "还没有任务",
    desc: "在上方输入框添加你的第一个任务吧",
  },
  active: {
    title: "没有进行中的任务",
    desc: "所有任务都已完成，休息一下吧",
  },
  completed: {
    title: "还没有完成的任务",
    desc: "完成一些任务后会显示在这里",
  },
};

function EmptyState({ filter, hasTodos }: EmptyStateProps) {
  const message = hasTodos ? MESSAGES[filter] : MESSAGES.all;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-scale-in">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cream-100">
        <ClipboardList className="h-7 w-7 text-terracotta/60" strokeWidth={1.5} />
      </div>
      <p className="font-serif text-lg font-medium text-ink-soft">{message.title}</p>
      <p className="mt-1 font-sans text-sm text-ink-muted">{message.desc}</p>
    </div>
  );
}

export default memo(EmptyState);
