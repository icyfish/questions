TypeScript 练习题

- 实现内置泛型函数 `Pick` 的功能

```ts
interface Todo {
  title: string
  description: string
  completed: boolean
}

// 实现 MyPick
type TodoPreview = MyPick<Todo, 'title' | 'completed'>

const todo: TodoPreview = {
    title: 'Clean room',
    completed: false,
}
```

<details>
<summary>答案</summary>

```ts
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};
```

</details>


