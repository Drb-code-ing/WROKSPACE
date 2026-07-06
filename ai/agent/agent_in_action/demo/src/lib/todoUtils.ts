import type { Todo, FilterType } from "@/types/todo";

const STORAGE_KEY = "todolist:todos";

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createTodo(text: string): Todo {
  return {
    id: createId(),
    text: text.trim(),
    completed: false,
    createdAt: Date.now(),
  };
}

export function filterTodos(todos: Todo[], filter: FilterType): Todo[] {
  switch (filter) {
    case "active":
      return todos.filter((t) => !t.completed);
    case "completed":
      return todos.filter((t) => t.completed);
    default:
      return todos;
  }
}

export function getStats(todos: Todo[]) {
  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  const active = total - completed;
  return { total, completed, active };
}

export { STORAGE_KEY };
