import { memo } from "react";
import { CheckCheck } from "lucide-react";
import type { FilterType } from "@/types/todo";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  stats: { total: number; completed: number; active: number };
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onClearCompleted: () => void;
}

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "active", label: "进行中" },
  { key: "completed", label: "已完成" },
];

function FilterBar({ stats, filter, onFilterChange, onClearCompleted }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-2">
      <div className="flex items-center gap-1.5">
        {FILTERS.map((f) => {
          const count = f.key === "all" ? stats.total : f.key === "active" ? stats.active : stats.completed;
          const isActive = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => onFilterChange(f.key)}
              className={cn(
                "relative rounded-sm px-3 py-1.5 font-sans text-sm transition-colors",
                isActive ? "text-ink" : "text-ink-muted hover:text-ink",
              )}
              aria-pressed={isActive}
            >
              <span>{f.label}</span>
              <span
                className={cn(
                  "ml-1.5 text-xs",
                  isActive ? "text-terracotta" : "text-ink-muted/70",
                )}
              >
                {count}
              </span>
              <span
                className={cn(
                  "absolute -bottom-px left-3 right-3 h-0.5 rounded-full bg-terracotta transition-transform duration-200",
                  isActive ? "scale-x-100" : "scale-x-0",
                )}
              />
            </button>
          );
        })}
      </div>

      {stats.completed > 0 && (
        <button
          type="button"
          onClick={onClearCompleted}
          className="flex items-center gap-1.5 rounded-sm border border-cream-200 px-2.5 py-1.5 font-sans text-xs text-ink-muted transition-colors hover:border-terracotta hover:text-terracotta-dark"
        >
          <CheckCheck className="h-3.5 w-3.5" strokeWidth={2} />
          清除已完成
        </button>
      )}
    </div>
  );
}

export default memo(FilterBar);
