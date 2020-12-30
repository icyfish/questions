## Questions

**20201230** 

Q: 使用 TypeScript 完善以下 extend 函数，使得 a, b，c 的类型都能够被推导出来。

```typescript
function extend(first, second) {
  return {
    ...first,
    ...second
  };
}
const x = extend({ a: 1 }, { b: "text", c: [2, 3] });
const a = x.a;
const b = x.b;
const c = x.c;

```

A:
```typescript
function extend<T extends object, U extends object>(first: T, second: U): T & U {
  const result = <T & U>{};
  for (let key in first) {
    (<T>result)[key] = first[key];
  }
  for (let key in second) {
    if (!result.hasOwnProperty(key)) {
      (<U>result)[key] = second[key];
    }
  }

  return result;
}
```