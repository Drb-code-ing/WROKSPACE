import { memo, useState } from "react";
import { Check, Trash2 } from "lucide-react";
import type { Todo } from "@/types/todo";
import { cn } from "@/lib/utils";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  const [leaving, setLeaving] = useState(false);

  const handleDelete = () => {
    setLeaving(true);
    window.setTimeout(() => onDelete(todo.id), 280);
  };

  return (
    <li
      className={cn(
        "group flex items-center gap-3 rounded-md border border-cream-200 bg-white px-4 py-3.5 shadow-card transition-all hover:shadow-cardHover",
        leaving && "animate-slide-out",
        todo.completed && "bg-cream-50",
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(todo.id)}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
          todo.completed
            ? "border-sage bg-sage text-white"
            : "border-cream-200 text-transparent hover:border-sage hover:bg-sage-soft",
        )}
        aria-label={todo.completed ? "标记为未完成" : "标记为已完成"}
        aria-pressed={todo.completed}
      >
        <Check
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            todo.completed ? "scale-100" : "scale-0",
          )}
          strokeWidth={3}
        />
      </button>

      <span
        className={cn(
          "flex-1 break-words font-sans text-base transition-all duration-200",
          todo.completed
            ? "text-ink-muted line-through opacity-60"
            : "text-ink",
        )}
      >
        {todo.text}
      </span>

      <button
        type="button"
        onClick={handleDelete}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-ink-muted/50 transition-all hover:bg-terracotta-soft hover:text-terracotta-dark active:scale-90 sm:opacity-0 sm:group-hover:opacity-100"
        aria-label="删除任务"
      >
        <Trash2 className="h-4 w-4" strokeWidth={2} />
      </button>
    </li>
  );
}

export default memo(TodoItem);
