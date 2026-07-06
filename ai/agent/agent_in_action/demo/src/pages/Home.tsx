import { useState, useMemo, useCallback } from "react";
import Header from "@/components/Header";
import TodoInput from "@/components/TodoInput";
import FilterBar from "@/components/FilterBar";
import TodoList from "@/components/TodoList";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { createTodo, filterTodos, getStats, STORAGE_KEY } from "@/lib/todoUtils";
import type { Todo, FilterType } from "@/types/todo";

export default function Home() {
  const [todos, setTodos] = useLocalStorage<Todo[]>(STORAGE_KEY, []);
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredTodos = useMemo(() => filterTodos(todos, filter), [todos, filter]);
  const stats = useMemo(() => getStats(todos), [todos]);

  const addTodo = useCallback(
    (text: string) => {
      setTodos((prev) => [createTodo(text), ...prev]);
    },
    [setTodos],
  );

  const toggleTodo = useCallback(
    (id: string) => {
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
      );
    },
    [setTodos],
  );

  const deleteTodo = useCallback(
    (id: string) => {
      setTodos((prev) => prev.filter((t) => t.id !== id));
    },
    [setTodos],
  );

  const clearCompleted = useCallback(() => {
    setTodos((prev) => prev.filter((t) => !t.completed));
  }, [setTodos]);

  return (
    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-10 sm:px-6 sm:py-16">
      <Header />

      <div className="mb-5 animate-fade-slide-in" style={{ animationDelay: "80ms" }}>
        <TodoInput onAdd={addTodo} />
      </div>

      {todos.length > 0 && (
        <FilterBar
          stats={stats}
          filter={filter}
          onFilterChange={setFilter}
          onClearCompleted={clearCompleted}
        />
      )}

      <main className="mt-2 flex-1">
        <TodoList
          todos={filteredTodos}
          hasTodos={todos.length > 0}
          filter={filter}
          onToggle={toggleTodo}
          onDelete={deleteTodo}
        />
      </main>

      <footer className="mt-10 border-t border-cream-200 pt-4 text-center">
        <p className="font-sans text-xs text-ink-muted/70">
          数据自动保存于本地浏览器 · {stats.total} 项任务
        </p>
      </footer>
    </div>
  );
}
