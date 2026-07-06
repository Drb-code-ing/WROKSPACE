import { useState, useRef, type KeyboardEvent } from "react";
import { Plus } from "lucide-react";

interface TodoInputProps {
  onAdd: (text: string) => void;
}

const MAX_LENGTH = 200;

function TodoInput({ onAdd }: TodoInputProps) {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setShake(true);
      window.setTimeout(() => setShake(false), 400);
      return;
    }
    onAdd(trimmed);
    setValue("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      submit();
    }
  };

  return (
    <div
      className={`flex items-center gap-2 rounded-md border border-cream-200 bg-white p-2 shadow-card transition-all focus-within:border-terracotta focus-within:shadow-cardHover ${
        shake ? "animate-[shake_0.4s_ease-in-out]" : ""
      }`}
      style={
        shake
          ? { animation: "shake 0.4s ease-in-out" }
          : undefined
      }
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        maxLength={MAX_LENGTH}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="添加一个新任务，按回车快速创建…"
        className="flex-1 bg-transparent px-3 py-2 font-sans text-base text-ink placeholder:text-ink-muted/60 focus:outline-none"
        aria-label="任务输入框"
      />
      <button
        type="button"
        onClick={submit}
        className="flex shrink-0 items-center gap-1.5 rounded-sm bg-terracotta px-4 py-2 font-sans text-sm font-medium text-white transition-colors hover:bg-terracotta-dark active:scale-95"
        aria-label="添加任务"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        <span className="hidden sm:inline">添加</span>
      </button>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}

export default TodoInput;
