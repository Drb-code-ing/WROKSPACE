import {
  Injectable, // 可以被自动注入
  NotFoundException,
} from '@nestjs/common';

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

const todos: Todo[] = [
  { id: 1, title: '学习nestjs', completed: false },
  { id: 2, title: '学习CRUD', completed: true },
];

let nextId = 3;

@Injectable()
export class TodosService {
  findAll(): Todo[] {
    return todos;
  }

  findOne(id: number): Todo {
    const todo = todos.find((todo) => todo.id === id);
    if (!todo) throw new NotFoundException(`Todo not found ${id}`);
    return todo;
  }

  create(title: string): Todo {
    const todo: Todo = { id: nextId++, title, completed: false };
    todos.push(todo);
    return todo;
  }

  remove(id: number): void {
    const index = todos.findIndex((todo) => todo.id === id);
    if (index === -1) throw new NotFoundException(`Todo not found ${id}`);
    todos.splice(index, 1);
  }

  update(id: number, patch: Partial<Todo>): Todo {
    const todo = this.findOne(id);
    // Object.assign(目标对象, ...源对象)：把源对象的属性合并到目标对象上
    // 同名属性会被源对象的值覆盖，目标对象独有的属性保留
    // 这里：用 patch 里提供的字段覆盖 todo 的对应字段，没传的字段不动
    // 等价于 { ...todo, ...patch }，但 Object.assign 是原地修改 todo
    Object.assign(todo, patch);
    return todo;
  }
}
