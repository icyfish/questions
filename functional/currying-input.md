## 在 JavaScript 中实现柯里化

- [🎬 Currying in Javascript](https://www.youtube.com/watch?v=vQcCNpuaJO8)

### 利用 `bind`

```js
let multiply = function (x, y) {
  return x * y;
};

let multiplyByTwo = multiply.bind(this, 2);

multiplyByTwo(5);
```

### 利用闭包

```js
let multiply = function (x) {
  return function (y) {
    return x * y;
  };
};
let multiplyByThree = multiply(3);

multiplyByThree(5);
```

## JavaScript 中的柯里化

- [🎬 2. Currying in Javascript - Kent C. Dodds](https://www.youtube.com/watch?v=Tx-0tcEl1I0)

实现 `add` 函数, 使得 `add(2, 3)` 和 `add(2)(3)` 的结果为 5:

首先分别实现:

```js
function add(a, b) {
  return a + b;
}

console.assert(add(2, 3) === 5);
```

```js
function add(a) {
  return b => {
    return a + b;
  };
}
console.assert(add(2)(3) === 5);
```

如果要两者同时支持, 需要修改一下 `add` 函数, 首先思考**最符合直觉的实现**, 在函数内部做出一些针对第二个参数 `b` 是否存在的判断:

```js
function add(a, b) {
  if (!b)
    return b => {
      return a + b;
    };
  return a + b;
}
console.assert(add(2, 3) === 5);
console.assert(add(2)(3) === 5);
```

但是以上的实现不够简洁, 还可以再优化:

```js
function add(a, b) {
  if (!b) return b => add(a, b);
  return a + b;
}
```

Definition of Currying:

function that accepts **a given number of arguments**, and will continue to return functions until it receives all the arguments.

利用 `bind` 再次优化:

```js
function add(a, b) {
  if (!b) return add.bind(null, a);
  return a + b;
}
```

三个参数的情况:

(同时还有个问题, 如果参数是 0 的话, 结果也会不如预期, 因此需要修改一下判断条件)

```js
function add(a, b, c) {
  if (b === undefined) return add.bind(null, a);
  if (c === undefined) return add.bind(null, a, b);
  return a + b + c;
}
```
