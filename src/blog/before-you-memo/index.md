---
title: 在使用 memo 之前
date: "2021-06-07"
template: "post"
draft: false
toc: true
description: "Before you memo"
---

原文: [Before You memo()](https://overreacted.io/before-you-memo/)

关于 React 性能优化的话题, 很多文章都有所涉及. 大部分文章针对 state 更新卡顿的问题, 给出的方案大都是这样的:

1. 首先确认代码是否是在生产环境运行. (开发环境的代码大都会比较慢, 在一些极端情况下, 程度更甚.)
2. 确认 state 的位置, 是否被置于组件树中过于高的位置. (比如说, 将用户输入的状态放在一个集中管理的 store 中, 就不太合适)
3. 使用 React 开发者工具检测组件重新渲染的次数, 将开销比较大的组件用 `memo()` 进行包裹. (同时组件内部的变量可以用 `useMemo()` 缓存下来.)

最后一步比较繁琐, 特别是对于处于组件树中间位置的组件, 理想情况下, 可以使用编译器帮助我们完成这一步的工作. 可能在不久的将来就能实现了.

**在本文后续的内容中, 我想分享两种与上面所说的不同的方式.** 了解之后你会发现这两种方式其实特别地基础, 也因此很多人甚至忽略了它们对渲染性能优化的效果.

**这些方式对比你已经了解的优化技巧, 是互补的内容.** 它们并不是 `memo` 和 `useMemo` 的替代品, 但是在优化过程中首先尝试这些方式, 是比较可取的.

## 构造出一个渲染性能比较差的组件

下面的示例代码, 是一个有严重性能问题的组件:

```jsx
import { useState } from 'react';

export default function App() {
  let [color, setColor] = useState('red');
  return (
    <div>
      <input value={color} onChange={(e) => setColor(e.target.value)} />
      <p style={{ color }}>Hello, world!</p>
      <ExpensiveTree />
    </div>
  );
}

function ExpensiveTree() {
  let now = performance.now();
  while (performance.now() - now < 100) {
    // 手动构造出延迟的效果, 100ms 之内不做任何事
  }
  return <p>I am a very slow component tree.</p>;
}
```

[CodeSandBox 代码示例](https://codesandbox.io/s/frosty-glade-m33km?file=/src/App.js)

以上代码的问题是, 无论何时 `App` 中的 `color` 变化了, 都会进行重新渲染我们手动构造出的存在延迟效果的组件: `<ExpensiveTree/>`. 

我可以简单地将用 `memo()` 对这个组件进行包裹, 然后结束我们的优化, 但是这一类优化技巧, 很多其他文章都已经讲得很详细了, 因此我们不会过多着墨于此. 接下来我想介绍的是另外两种优化方式. 

## 解决方案 1 - 将 State 移动到内部

仔细观察渲染的代码, 会发现其实只有高亮的部分关注 `color` 的值:

```jsx
export default function App() {
	// highlight-next-line
  let [color, setColor] = useState('red');
  return (
    <div>
		// highlight-start
      <input value={color} onChange={(e) => setColor(e.target.value)} />
      <p style={{ color }}>Hello, world!</p>
		// highlight-end
      <ExpensiveTree />
    </div>
  );
}
```

我们将这部分抽象成 `Form` 组件, 然后再把状态移到 `From` 中:

```jsx
export default function App() {
  return (
    <>
			// highlight-next-line
      <Form />
      <ExpensiveTree />
    </>
  );
}

function Form() {
	// highlight-next-line
  let [color, setColor] = useState('red');
  return (
    <>
			// highlight-start
      <input value={color} onChange={(e) => setColor(e.target.value)} />
      <p style={{ color }}>Hello, world!</p>
			// highlight-end
    </>
  );
}
```

[CodeSandBox 代码示例](https://codesandbox.io/s/billowing-wood-1tq2u?file=/src/App.js)

经过改造之后, 当 `color` 变化, 只有 `Form` 会重新渲染. 问题解决了.

## 解决方案 2 - 将内容移动到外部

如果 state 在 `ExpensiveTree` 外部被消费, 然后将 `color` 属性设置到父级 `<div>` 上, 就无法使用以上的优化方式了:

```jsx
export default function App() {
	// highlight-next-line
  let [color, setColor] = useState('red');
  return (
	// highlight-next-line
    <div style={{ color }}>
      <input value={color} onChange={(e) => setColor(e.target.value)} />
      <p>Hello, world!</p>
      <ExpensiveTree />
    </div>
  );
}
```

[CodeSandBox 代码示例](https://codesandbox.io/s/bold-dust-0jbg7?file=/src/App.js)

由于父组件也用到了 `color` 属性, 我们不能够像先前那样将消费了 `color` 属性的组件额外抽象出来. 那这样的话, 就只能使用 `memo` 进行优化了吗?

其实还有另一种简单的方式:

```jsx
export default function App() {
  return (
    <ColorPicker>
		// highlight-start
      <p>Hello, world!</p>
      <ExpensiveTree />
		// highlight-end
    </ColorPicker>
  );
}

// highlight-next-line
function ColorPicker({ children }) {
  let [color, setColor] = useState("red");
  return (
    <div style={{ color }}>
      <input value={color} onChange={(e) => setColor(e.target.value)} />
// highlight-next-line
			{children}
    </div>
  );
}
```

[CodeSandBox 代码示例](https://codesandbox.io/s/wonderful-banach-tyfr1?file=/src/App.js:58-423)

将 `App` 组件拆分成两部分, 把 `color` 属性相关的逻辑都移到 `ColorPicker` 中.

这样抽象出来之后, `color` 相关的部分依然存在于 `App` 中, 不消费 `color` 的部分作为 `children` 被传入了 `ColorPicker` 中.  

当 `color` 属性变化的时候, `ColorPicker` 会重新渲染. 但是由于它接受到的 `children` 属性和前一次渲染没有差别, 因此 `children` 的内容不会重新渲染.

这样一来, `<ExpensiveTree/>` 就不会重新渲染.

## 我想要表达什么

在使用 `memo` 或者 `useMemo` 对组件进行优化的时候, 或许可以先重新审视一下我们的代码, 将经常会变化的部分, 和比较不经常变化的部分进行拆分.

比较有意思的一点是, 这样拆分的最终目的**其实并不是为了性能优化考虑.** 使用 `children` 属性分离组件, 能够使得我们应用的数据流更加简洁, 同时减少传入组件的 props. 在这类场景下, 提升性能其实是意外的收获.

更惊喜的是, 这样的模式在未来能够带来更大的性能收益.

举个例子, 当 [Sever Components](https://reactjs.org/blog/2020/12/21/data-fetching-with-react-server-components.html) 成为 React 的稳定特性之后, 读取 `children` 属性的工作就能够在[在服务端进行](https://www.youtube.com/watch?v=TQQPAU21ZUw&t=1314s). `<ExpensiveTree />` 也能够在服务端执行, 这样一来, 即使在此层级之上的 state 更新, 在客户端也不会引起 `<ExpensiveTree />` 那部分代码的执行.

这是 `memo` 没办法帮我们做到的. 但是重申一次, 我所说的这两种方法需要配合 `memo` 和 `useMemo` 使用, 一定不要忘了移动状态 (state) 和内容.

同时记得, 打开 React 开发者工具观察 memo 的优化效果.

## 类似的文章

看完全文之后, 读者可能会觉得, 以前好像看到过类似的文章? [确实是的](https://kentcdodds.com/blog/optimize-react-re-renders).

这并不是一个全新的概念. 是 React 作为组合模型所演变出的合理优化结果. 或许是因为方式太过简单, 被很多人忽略了, 但是其实这是个值得被重视的方法.

