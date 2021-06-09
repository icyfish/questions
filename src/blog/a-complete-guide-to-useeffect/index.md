---
title: 理解 useEffect
date: "2021-06-08"
template: "post"
draft: true
toc: true
description: "A Complete Guide to useEffect"
---

原文: [A Complete Guide to useEffect](https://overreacted.io/a-complete-guide-to-useeffect/)

TLDR Part

### 每次渲染都有自己的 Props 和 State

开始聊 effect 之前, 我们需要先聊一聊组件的渲染.

以下是一个计时器组件. 关注其中高亮的部分:

```jsx
function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      // highlight-next-line
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  )
}
```

这代表这什么呢? `count` 是否在时刻关注我们的状态(state)变化, 然后自动更新呢? 作为一个十分符合直觉的答案, 这样的想法可能会在你刚开始学习 React 的时候给你带来比较大的帮助. 但是实际上, 这个理解并不准确. 我写过一篇关于这个话题的文章, 这才是[准确的心智模型](https://overreacted.io/react-as-a-ui-runtime/). <mark>加上译文</mark>

**在上面的例子中, `count` 仅仅是个数字而已.** 内部并没有数据绑定, "观察者", "代理"等等的逻辑. 就像下面的代码示例一样, 它就是一个数字.

```jsx
const count = 42
// ...
;<p>You clicked {count} times</p>
// ...
```

当组件第一次渲染的时候, 从 `useState()` 中读取到的 `count` 是 `0`. 当我们调用了 `setCount(1)` 之后, React 会重新调用我们的组件. 这一次 `count` 值将会是 `1`, 以此类推:

```jsx
// 首次渲染
function Counter() {
  // highlight-next-line
  const count = 0 // useState() 返回的内容
  // ...
  ;<p>You clicked {count} times</p>
  // ...
}

// 点击事件之后, 函数再次被调用
function Counter() {
  // highlight-next-line
  const count = 1 // useState() 返回的内容
  // ...
  ;<p>You clicked {count} times</p>
  // ...
}

// 第二次点击事件之后, 函数被调用
function Counter() {
  // highlight-next-line
  const count = 2 // useState() 返回的内容
  // ...
  ;<p>You clicked {count} times</p>
  // ...
}
```

**无论何时, 状态更新之后, React 都会重新调用我们的组件. 每一次渲染的结果都会"看到"组件内部的 `counter` 状态值, 而这个值在函数中实际上是一个固定值.**

所以说以下这一行的代码并没有任何特殊的数据绑定逻辑:

```jsx
<p>You clicked {count} times</p>
```

**它仅仅只是将数字的值嵌入到渲染结果中而已.** 这个数字是由 React 提供的. 当我们调用 `setCount` 的时候, React 会用一个最新的 `count` 值来重新调用我们的组件. 然后 React 更新 DOM, 以匹配最新的渲染结果.

这里的关键点是: `count` 值在每次渲染的调用中, 都是固定的. 是我们的组件传递了最新的 `count` 值, 每一次渲染, 渲染结果都输出了这个值. 每一次渲染的 `count` 都互不关联.

(想要更深入地了解具体的渲染流程, 可以查看这篇文章: [React 作为 UI 运行时](https://overreacted.io/react-as-a-ui-runtime/))

### 每次渲染都有自己的事件处理器

查看下面的示例. 我们设置了一个 3 秒的定时器, 之后弹出 `count` 值:

```jsx
function Counter() {
  const [count, setCount] = useState(0)
  // highlight-start
  function handleAlertClick() {
    setTimeout(() => {
      alert("You clicked on: " + count)
    }, 3000)
  }
  // highlight-end

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
      // highlight-start
      <button onClick={handleAlertClick}>Show alert</button>
      // highlight-end
    </div>
  )
}
```

我按顺序做了以下几件事情:

- 将计时器的值**增加**到 3
- **点击**"Show alert"
- 在定时器的回调被执行之前将计时器的值**增加**到 5

![counter](./counter.gif)

你认为 `alert` 的结果是什么呢? 是 `alert` 时的 state 值 5, 还是点击时的 state 值 3?

---

剧透:

---

可以在[这里](https://codesandbox.io/s/w2wxl3yo0l)自己试一试!

如果这个示例对你来说很费解, 可以想象一个更实际的例子: 一个聊天应用, 将 count 类比为当前接受的消息对应的 ID, 存储在局部状态中, 将按钮类比为发送消息的按钮. [这篇文章](https://overreacted.io/how-are-function-components-different-from-classes/)详细解释了出现上述结果的原因, 正确答案是 3.

`alert` 会"捕捉"点击当时 state 的值.

<mark>(There are ways to implement the other behavior too but I’ll be focusing on the default case for now. When building a mental model, it’s important that we distinguish the “path of least resistance” from the opt-in escape hatches.)</mark>

---

但是其中的原理是怎样的呢?

我们先前提到过, `count` 值在每次调用时都是一个固定值. 有必要重点指出的是 -- **我们的函数会被调用多次(每次渲染被调用一次), 每一次被调用时, 这个 count 值都会是由 useState 控制的一个特定值.**

这种特性并非 React 独有 -- 普通的函数也是这样工作的:

```js
function sayHi(person) {
  // highlight-next-line
  const name = person.name
  setTimeout(() => {
    alert("Hello, " + name)
  }, 3000)
}

let someone = { name: "Dan" }
sayHi(someone)

someone = { name: "Yuzhi" }
sayHi(someone)

someone = { name: "Dominic" }
sayHi(someone)
```

在这个[示例](https://codesandbox.io/s/mm6ww11lk8)中, 外部的 `someone` 变量被多次重新赋值. (就像在 React 中, 当前组件的 state 不断变化一样. ) **在 `sayHi` 内部, 有一个变量 `name`, 它会读取 `person` 的 `name` 属性.** 这个变量在函数内部, 每次调用之间都是独立的. 因此, 当定时器的回调被调用的时候, 每次 alert 都会"记住"自己的 `name`.

这也解释了为什么我们的事件处理器在点击的当下"捕捉"了 `count` 值. 同样的规则下, 每次渲染都能"看到"自己的 `count`:

```jsx
// 首次渲染
function Counter() {
  // highlight-next-line
  const count = 0 // useState() 返回的内容
  // ...
  function handleAlertClick() {
    setTimeout(() => {
      alert("You clicked on: " + count)
    }, 3000)
  }
  // ...
}

// 点击事件之后函数被重新调用
function Counter() {
  // highlight-next-line
  const count = 1 // useState() 返回的内容
  // ...
  function handleAlertClick() {
    setTimeout(() => {
      alert("You clicked on: " + count)
    }, 3000)
  }
  // ...
}

// 又一次点击事件, 函数被重新调用
function Counter() {
  // highlight-next-line
  const count = 2 // useState() 返回的内容
  // ...
  function handleAlertClick() {
    setTimeout(() => {
      alert("You clicked on: " + count)
    }, 3000)
  }
  // ...
}
```

每一次渲染, 都会返回各自版本的 `handleAlertClick`, 并且有各自版本的 `count`:

```jsx
// 首次渲染
function Counter() {
  // ...
  function handleAlertClick() {
    setTimeout(() => {
      // highlight-next-line
      alert("You clicked on: " + 0)
    }, 3000)
  }
  // ...
  // highlight-next-line
  ;<button onClick={handleAlertClick} /> // 内部值为 0 的版本
  // ...
}

// 点击事件之后函数被重新调用
function Counter() {
  // ...
  function handleAlertClick() {
    setTimeout(() => {
      // highlight-next-line
      alert("You clicked on: " + 1)
    }, 3000)
  }
  // ...
  // highlight-next-line
  ;<button onClick={handleAlertClick} /> // 内部值为 1 的版本
  // ...
}

// 又一次点击事件, 函数被重新调用
function Counter() {
  // ...
  function handleAlertClick() {
    setTimeout(() => {
      // highlight-next-line
      alert("You clicked on: " + 2)
    }, 3000)
  }
  // ...
  // highlight-next-line
  ;<button onClick={handleAlertClick} /> // 内部值为 2 的版本
  // ...
}
```

这也是为什么, 在这里的[示例](https://codesandbox.io/s/w2wxl3yo0l)中, 事件处理器"属于"各自的渲染, 当用户点击的时候, 会使用那次渲染的 `counter` 值.

**对于每一次渲染, 内部的 props 和 state 始终都是一致的, 并且每次渲染都是独立的.** 既然每次渲染的 props 和 state 各自独立, 消费它们的部分(包括事件处理器), 在渲染间也各自独立, 都从属于特定的渲染. 因此事件处理器内部的异步函数也会"看到"同样的 `count` 值.

_边注: 我在 `handleAlertClick` 中直接使用了 `count` 值. 这样的替换是安全的, 因为在一次渲染流程中, `count` 值不可能有变化. 它被声明为 `const`, 且是一个不可变的数字. 同样的原则在对象中仍然适用, 不过我们必须要确保避免改变(mutate)状态的值. 用一个全新创建的对象去调用 `setSomething(newObj)`, 而不改变这个对象就可以了. 这样的话, 前一次渲染的状态(state)值就能够保持不被下一次渲染修改._

### 每次渲染都有自己的副作用

这篇文章的主要内容本该是副作用(effect)的, 现在我们会开始详细介绍它. 其实, 副作用的和以上两部分是一样的, 每次渲染都有自己的副作用.

现在我们回到 React [文档](https://reactjs.org/docs/hooks-effect.html)中的一个例子:

```jsx
function Counter() {
  const [count, setCount] = useState(0)
  // highlight-start
  useEffect(() => {
    document.title = `You clicked ${count} times`
  })
  // highlight-end

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  )
}
```

**我想提出一个问题: effect 是如何读取到 `count` 的最新值的?**

在 effect 函数的内部有一些数据绑定或者订阅的逻辑, 使得 effect 函数每次都能读取到 `count` 的最新值? 还是 `count` 是一个可变的值, React 在组件的内部维护了这个值, 因此我们的 effect 函数能够读取到最新值?

都不是的.

先前我们已经知道, `count` 在每次特定的组件渲染流程中, 都是一个常量. 事件处理器从它所属的渲染流程中读取到了对应的 `count` 值, 因为 `count` 是处于对应作用域的变量. 在 effect 函数中也是这样的!

**并不是在一个"不会变化"的副作用方法中, `count` 变量值时刻变化. 而是每一次渲染, 副作用函数本身都是不一样的.**

同样地, 每个版本的副作用方法读取到的都是当次渲染所传入的 `count` 值:

```jsx
// 首次渲染
function Counter() {
  // ...
  useEffect(
    // highlight-start
    // 首次渲染的副作用函数
    () => {
      document.title = `You clicked ${0} times`
    }
    // highlight-end
  )
  // ...
}

// 点击事件之后函数被重新调用
function Counter() {
  // ...
  useEffect(
    // highlight-start
    // 第二次渲染的副作用函数
    () => {
      document.title = `You clicked ${1} times`
    }
    // highlight-end
  )
  // ...
}

// 又一次点击事件, 函数被重新调用
function Counter() {
  // ...
  // highlight-start
  useEffect(
    // 第三次渲染的副作用函数
    () => {
      document.title = `You clicked ${2} times`
    }
    // highlight-end
  )
  // ..
}
```

React 会记住每一次你所提供的副作用方法, 在当次渲染结束, UI 呈现出对应变化之后调用这个副作用方法.

尽管这个副作用方法看起来是一样的(功能: 更新文档的标题), 但是实际上每一次渲染这个方法都是不一样的 -- 并且每一个副作用方法都会看到"渲染"当次的 props 和 state.

**在概念上, 你可以把副作用方法理解为每次渲染的结果.**

严格来说, 其实它们并不是渲染结果(为了能够通过简单的语法[实现 Hooks 的组合](https://overreacted.io/why-do-hooks-rely-on-call-order/), 减少运行时开销). 但是基于我们目前想要建立的心智模型, 我们可以在概念上认为副作用函数是某一次渲染的结果.

---

现在来巩固一下以上的内容, 首先回顾首次渲染:

- **React:** 当 state 值为 `0` 的时候, 给我你希望渲染的 UI.
- **组件:**
  - 这是我要渲染的内容: `<p>You clicked 0 times</p>`.
  - 渲染结束之后请执行这个副作用方法: `() => { document.title = 'You clicked 0 times' }`.
- **React:** 好的, 更新 UI. Hey, 浏览器, 我想要在 DOM 中添加一些内容.
- **浏览器:** 好的, 我把它们绘制到屏幕中.
- **React:** 好的, 我准备开始执行副作用方法了.
  - 执行 `() => { document.title = 'You clicked 0 times' }`.

---

现在回顾点击之后的渲染流程:

- **组件:** Hey, React, 把我的状态(state)值设置为 `1`.
- **React:** 当状态更新为 `1` 的时候, 把对应的 UI 返回给我吧.
- **组件:**
  - 这是渲染的结果: `<p>You clicked 1 times</p>`.
  - 记得执行这个副作用方法: `() => { document.title = 'You clicked 1 times' }`.
- **React:** 好的, 更新 UI. Hey, 浏览器, 我已经修改了 DOM 了.
- **浏览器:** 好的, 我把它们绘制到屏幕中.
- **React:** OK, 我现在开始执行副作用方法.
  - 执行 `() => { document.title = 'You clicked 1 times' }`.

---

### 每次渲染的所有值都属于当次渲染

**我们知道了, 副作用方法在每次渲染之后都会执行, 从概念上可以将副作用方法理解为组件输出内容的一部分, 并且副作用方法能够"看到"当次渲染的 props 和 state.**

现在我们来做一次实验. 查看下面的代码:

```jsx
function Counter() {
  const [count, setCount] = useState(0)
  // highlight-start
  useEffect(() => {
    setTimeout(() => {
      console.log(`You clicked ${count} times`)
    }, 3000)
  })
  // highlight-end
  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  )
}
```

如果我在每次延迟的时间段内点击多次, 最终输出的值会是怎样的呢?

---

剧透

---

你可能会认为这是个糊弄你的题目, 最终的结果会很出人意料. 其实并不是! 我们来看这一系列的输出 -- 每一个输出都属于特定的渲染, 因此每一次输出都是自己的 `count` 值. [CodeSandbox 代码示例](https://codesandbox.io/s/lyx20m1ol).

![timeout_counter](./timeout_counter.gif)

你可能会觉得: "当然是这样输出的, 否则会怎样输出呢?"

不过, `this.state` 在类组件中并不是这样工作的. 很多人会把 `useEffect` 看作是和[类中](https://codesandbox.io/s/kkymzwjqz3)的`componentDidUpdate` 类似的方法:

```jsx
  componentDidUpdate() {
    setTimeout(() => {
      console.log(`You clicked ${this.state.count} times`);
    }, 3000);
  }
```

实际上并不是这样的, `this.state.count` 始终是最新的 `count` 值, 但是 `useEffect` 中的则是当次渲染的值, 因此以上代码的结果, 输出的会是 `5`:

![timeout_counter_class](./timeout_counter_class.gif)

我觉得有点讽刺的是, Hooks 的实现十分依赖 JavaScript 中的闭包,
I think it’s ironic that Hooks rely so much on JavaScript closures, and yet it’s the class implementation that suffers from the canonical wrong-value-in-a-timeout confusion that’s often associated with closures. This is because the actual source of the confusion in this example is the mutation (React mutates this.state in classes to point to the latest state) and not closures themselves.

**当我们需要锁定一个永远不会变化的值的时候, 使用闭包是最合适的手段. 这使得我们很容易能够推出正确答案, 因为归根结底你正在读取的值始终是一个常量.** 既然我们现在已经知道了如何维持渲染时的 props 和 state, 可以开始尝试[使用闭包](https://codesandbox.io/s/w7vjo07055)对 class 版本的代码进行改造.

### Swimming Against the Tide

现在我们已经得到了一个共识: 函数式组件在渲染时, 内部的每一项(包括事件处理器, 副作用方法, 超时时间, API 调用等)都会"捕捉"渲染当时的 props 和 state.

因此以下两个例子其实是一致的:

```jsx
function Example(props) {
  useEffect(() => {
    setTimeout(() => {
      // highlight-next-line
      console.log(props.counter)
    }, 1000)
  })
  // ...
}
```

```jsx
function Example(props) {
  // highlight-next-line
  const counter = props.counter
  useEffect(() => {
    setTimeout(() => {
      // highlight-next-line
      console.log(counter)
    }, 1000)
  })
  // ...
}
```

**从上面的代码可以看出, 不管是不是在组件中提前读取 state 或者 props 的值, 对副作用函数中读取到的结果其实都没有影响.** 在单次渲染的作用域内, props 和 state 