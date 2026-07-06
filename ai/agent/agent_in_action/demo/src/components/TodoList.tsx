import { memo } from "react";
import type { Todo } from "@/types/todo";
import TodoItem from "./TodoItem";
import EmptyState from "./EmptyState";

interface TodoListProps {
  todos: Todo[];
  hasTodos: boolean;
  filter: "all" | "active" | "completed";
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function TodoList({ todos, hasTodos, filter, onToggle, onDelete }: TodoListProps) {
  if (todos.length === 0) {
    return <EmptyState filter={filter} hasTodos={hasTodos} />;
  }

  return (
    <ul className="flex flex-col gap-2">
      {todos.map((todo, index) => (
        <div
          key={todo.id}
          className="animate-fade-slide-in"
          style={{ animationDelay: `${Math.min(index * 40, 240)}ms` }}
        >
          <TodoItem todo={todo} onToggle={onToggle} onDelete={onDelete} />
        </div>
      ))}
    </ul>
  );
}

export default memo(TodoList);
