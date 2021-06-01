---
title: 实现自己的 React
date: "2020-12-25"
template: "post"
draft: false
category: "React"
tags:
  - "React"
description: "Build Your Own React"
---

原文: [Build your own React](https://pomb.us/build-your-own-react/)

<!-- ```toc
# This code block gets replaced with the TOC
``` -->


这是一个从零开始实现 React 的教程，与生产版本有所差异的是，我们会忽略所有优化的细节，同时忽略一些与主要原理无关的特性。

也许你阅读过我之前写过的[类似教程](https://engineering.hexacta.com/didact-learning-how-react-works-by-building-it-from-scratch-51007984e5c5)，这篇教程与之前教程的区别是，本教程的源代码基于 React 16.8 版本，因此本教程包含了 hooks 的特性，同时不包含 class 版本组件的实现。

如果你同时希望学习旧版本的实现，可以查看旧版的教程以及与之相关的旧版[实现源码](https://github.com/pomber/didact)。同时还有一个[视频解说](https://www.youtube.com/watch?v=8Kc2REHdwnQ&feature=youtu.be)以供参考。不过阅读本教程并不强制要求你学习过之前的版本，本教程的内容是独立完整的。

我将实现过程拆分成了以下几个部分：

1. 实现 `createElement` 函数
2. 实现 `render` 函数
3. Concurrent 模式
4. Fibers
5. 渲染与提交阶段 (Commit)
6. 协调 Reconciliation
7. 函数式组件
8. Hooks

## 概览

首先我们来看几个基本概念。如果你对 React，JSX 和 DOM 元素的实现已经有了比较深刻的理解，可以跳过这部分的介绍直接进入下一部分。

```tsx
const element = <h1 title="foo">Hello</h1>
const container = document.getElementById("root")
ReactDOM.render(element, container)
```

这是一个简单的 React 应用，仅仅包含了三行代码。第一行定义了一个 React 元素。第二行利用 Web API 获取了 DOM 中的某一个节点，我将它称为容器。最后一行则是将我们的 React 元素插入到容器的操作。

**现在我们把所有 React 相关的代码全部替换为原生 JavaScript 代码。**

第一行代码，使用的是 JSX 语法，它并不是原生的 JavaScript 代码，因此我们对它做出一些修改：

```tsx
const element = React.createElement(
  "h1",
  { title: "foo" },
  "Hello"
)
```

JSX 代码会被类似 Babel 的编译工具进行处理，转换成原生 JavaScript 代码。转换过程比较简单：将 `<` `>` 标签移除，使用 `createElement` 函数调用进行替换，传入的参数分别为：标签名称，元素参数，以及元素的子元素。

`React.createElement` ，根据所传入的参数，创建了一个对象。除了一些有效性校验之外，整体的功能就是以上这样。因此我们可以直接把 JSX 替换成原生 JavaScript 的形式，人工确保元素和属性等的有效性。

经过以上处理之后，我们的元素就变成了这样的形式：一个对象，内部含有两个属性，分别是 `type` 和 `props` (当然了，实际上[包含更多](https://github.com/facebook/react/blob/f4cc45ce962adc9f307690e1d5cfa28a288418eb/packages/react/src/ReactElement.js#L111)，目前我们只关注这两个就可以。）

```jsx
const element = {
  type: "h1",
  props: {
    title: "foo",
    children: "Hello",
  },
}
```

`type` 属性的值是字符串类型，表示我们所希望创建的 DOM 元素类型，相当于当你希望创建一个 HTML 元素的时候，传入 `document.createElement` 函数中的标签名。当然除了字符串类型之外，`type` 的值还可以是一个函数，这点我们会在函数式组件的那一部分中详细介绍。

`props` 是另一个对象，其中的内容包括所有 JSX 属性中的键值对。有一个特殊的属性需要特别关注，就是 `children` 。

在我们当前的示例中，`children` 的值是一个字符串，不过在大多数情况下，`children` 的值会是一个包含很多元素的数组。这也是为什么, 元素的数据结构是树的原因。

我们的简易 React 应用中，第三行代码（`ReactDOM.render`）也不是原生的 JavaScript 代码，同样需要进行转换。

在 `render` 方法中，React 元素被转换并渲染到了 DOM 中，现在我们要用自己的方法去实现这一步。

首先需要做的是，利用第一步的 `type` 属性，创建一个 DOM 节点，本例中我们的 `type` 属性是 `h1` 标签。

然后，我们将所有元素属性都赋到对应的 DOM 节点中。本例中只有 title 属性。

```jsx
const node = document.createElement(element.type)
node["title"] = element.props.title
```

为了避免混淆，我会用“元素”来表示 React 元素，“节点”来表示 DOM 元素。

接下来要处理子元素所对应的节点了。本例中我们的子元素是文本，因此只需要创建一个文本节点即可。

```jsx
const text = document.createTextNode("")
text["nodeValue"] = element.props.children
```

渲染文本节点使用的是 `createTextNode` 而不是 `innerText`, 可以保证在后续处理元素时, 所有元素的形式都是一致的, 抹平差异, 统一处理. 使用 `createTextNode` 时, 文本也是属性, key 为 `nodeValue` ，与之前针对 `h1` 的处理是类似的：`props: {nodeValue: "hello"}` 

最后将 `textNode` 添加到 `h1` ，将 `h1` 添加到容器中。

```jsx
const element = {
  type: "h1",
  props: {
    title: "foo",
    children: "Hello",
  },
}

const container = document.getElementById("root")

const node = document.createElement(element.type)
node["title"] = element.props.title

const text = document.createTextNode("")
text["nodeValue"] = element.props.children

node.appendChild(text)
container.appendChild(node)
```

至此，我们实现了与之前一致的应用，并且没有使用任何与 React 相关的代码。

## 实现 createElement 函数

现在我们开始实现另一个应用。这次将 React 相关的代码替换成我们自己版本的 React。

首先开始实现我们的 `createElement` 。

还是先将 JSX 转换成 JS，以便看到 `createElement` 函数调用。

```jsx
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)
const container = document.getElementById("root")
ReactDOM.render(element, container)
```

在之前的步骤中我们知道了：元素就是一个对象，内含有 `type` 和 `props` 属性。因此我们的 `createElement` 函数需要做的就是创建这个元素对象。

```jsx
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children,
    },
  }
}
```

我们使用  ES6 中的展开操作符来处理 `props` 属性，剩余参数语法来处理 `children` 属性，这样的话 `children` 属性就始终是一个数组。

举个例子，`createElement("div")` 函数返回的内容是：

```json
{
  "type": "div",
  "props": { "children": [] }
}
```

`createElement("div", null, a)` 函数返回的内容是：

```json
{
  "type": "div",
  "props": { "children": [a] }
}
```

`createElement("div", null, a, b)` 函数返回的内容是：

```json
{
  "type": "div",
  "props": { "children": [a, b] }
}
```

`children` 数组的内容还可以是原始类型的值，字符串或者数字。现在我们将所有非对象类型的元素用一个特殊的类型 `TEXT_ELEMENT` 来表示。

在没有 `children` 的情况下，React 不会封装原始类型的值或者是创建一个空数组，我们这样做的原因是为了简化代码，毕竟简单的代码更利于教学。

```jsx
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === "object"
          ? child
          : createTextElement(child)
      ),
    },
  }
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  }
}
```

```jsx
const element = React.createElement(
  "div",
  { id: "foo" },
  React.createElement("a", null, "bar"),
  React.createElement("b")
)
const container = document.getElementById("root")
ReactDOM.render(element, container)
```

目前我们依然在用 React 的 `createElement` 。

现在给我们自己的库起个名字，来替换它。为了体现它的教学意义，又保持与 React 的名字类似，我们将这个库叫做 Didact 。

不过我还是想要使用 JSX 语法，因此我们需要告诉 babel，去使用 Didact 的 `createElement` 而不是 React 的 `createElement` 。

```jsx
const Didact = {
  createElement,
}

const element = Didact.createElement(
  "div",
  { id: "foo" },
  Didact.createElement("a", null, "bar"),
  Didact.createElement("b")
)
```

只需要简单地加上这个注释，就能够达到我们的目的了：

```jsx
/** @jsx Didact.createElement */
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)
```

## 实现 render 方法

接下来我们要开始实现自己的 `ReactDOM.render` 函数。

目前，我们只需要关注在 DOM 中添加内容即可。元素的更新和删除都在后续的章节中进行阐述。

首先使用元素的类型创建 DOM 节点，然后将所创建的节点添加到我们的容器中。

针对所有的 `children` 都要去递归地处理。

与此同时还要处理文本类型的元素，创建文本节点而非普通节点。

最后将元素的属性都添加到 node 节点中。

```jsx
function render(element, container) {
  const dom =
    element.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type)

  const isProperty = key => key !== "children"
  Object.keys(element.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = element.props[name]
    })

  element.props.children.forEach(child =>
    render(child, dom)
  )

  container.appendChild(dom)
}
```

以上整体代码见：[React](https://codesandbox.io/s/didact-2-k6rbj).

## 实现 Concurrent 模式

在开始实现 Concurrent 模式之前要对我们的代码进行重构。

之前版本的递归调用有一点问题:

```jsx
element.props.children.forEach(child =>
  render(child, dom)
)
```

一旦组件开始进行渲染的进程，只有等全部的组件树渲染完毕后渲染流程才会结束。如果组件树过大的话，会长时间阻碍主进程。当浏览器要执行优先级高的操作（比如处理用户输入或者动画时），都需要等待渲染的结束，对性能造成比较大的影响。

因此我们要将渲染的流程拆分成一个个小的单元，在各个单元之间，我们可以暂停渲染进程，允许浏览器执行其他操作。

我们使用 `[requestIdleCallback](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback)` (浏览器提供的一个 API )来创建一个循环。为了便于理解可以将 `requestIdleCallback` 看作是 `setTimeout`，区别就是，`setTimeout` 受时间控制，而 `requestIdleCallback`  则是在主进程处于空闲的情况下被浏览器执行的。

现在 [React 已经不再使用](https://github.com/facebook/react/issues/11171#issuecomment-417349573) `requestIdleCallback` 了，目前它的替代方案是 [scheduler](https://github.com/facebook/react/tree/master/packages/scheduler) 包。不过两者所实现的主要功能相差无几。

`requestIdleCallback` 还接受一个类似最后期限 （deadline）的参数。我们可以利用这个参数知道浏览器还有多长时间之后, 会重新获取控制权。

```jsx
let nextUnitOfWork = null

function workLoop(deadline) {
  let shouldYield = false // 停止操作的 flag
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )
    shouldYield = deadline.timeRemaining() < 1
  }
  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function performUnitOfWork(nextUnitOfWork) {
  // TODO
}
```

截止本文撰写的时间（2019年11月），Concurrent 模式在 React 中还并非稳定特性，处于实验阶段。稳定版本的循环代码大概像是下面这样：

```jsx
while (nextUnitOfWork) {    
  nextUnitOfWork = performUnitOfWork(   
    nextUnitOfWork  
  ) 
}
```

要想开始这段循环 (workLoop)，首先要设置首个单元的进程，然后实现 `performUnitOfWork` 函数，处理当前单元的渲染进程，并返回下一个单元的进程。

## Fibers

想要组织渲染进程的各个单元，我们需要依赖的数据结构是 fiber 树。

一个 fiber 代表每一个元素，而每一个 fiber 也是进程的一个单元。

下面看这个例子。

假设我们需要渲染的元素类似如下这样, 他的 fiber 树就如右图.

```jsx
Didact.render(
  <div>
    <h1>
      <p />
      <a />
    </h1>
    <h2 />
  </div>,
  container
)
```

![fiber](./fiber.png)

在 `render` 方法中， 我们会创建一个根 fiber, 然后将其设置为 `nextUnitOfWork` (下一个执行单元）。之后的流程则在 `performUnitOfWork` (执行当前工作单元)函数中实现，在这个函数中，我们会针对每一个 fiber 执行如下操作：

1. 将元素添加到 DOM 中
2. 为元素的子元素创建各自的 fiber
3. 返回下一个执行单元(需要被处理的 fiber)

我们选择 fiber 数据结构的原因是便于找到下一个执行单元。这也是为什么每一个 fiber 都与它的第一个子节点，相邻的兄弟节点和父节点都存在关联关系的原因。

当我们在`performUnitOfWork` 中做好处理 fiber 的任务之后,  如果这个 fiber 有一个 `child` 子节点，那么这个子节点对应的 fiber 就是下一个执行单元。

在我们的示例中，`h1` 是 `div` 之后的一个执行单元 。

如果某个 fiber 没有子节点的话，那么紧接的执行单元就是兄弟节点。

例子中，fiber `p` 没有子节点，因此 `a` 就是下一个执行单元。

如果 fiber 既没有子节点，也没有兄弟节点，那么就会寻找该 fiber 的"叔叔节点"：也就是父节点的兄弟节点，就比如我们例子中的 `a` 和 `h2` 。

如果父节点不存在兄弟节点，那么我们还会不断向上追溯，寻找这类节点，直到到达根节点为止。到了根节点也意味着，针对这次渲染的所有细分单元工作, 我们均已完成。

现在以代码形式来呈现这一切。

首先从 `render` 中删除渲染的代码, 我们将具体的渲染工作都交付给 `performUnitOfWork`

将创建 DOM 节点的方法封装成 `createDom`，后续使用。

```jsx
function createDOM(element) {
  const dom =
    element.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);

  const isProperty = (key) => key !== "children";

  Object.keys(element.props)
    .filter(isProperty)
    .forEach((propName) => {
      dom[propName] = element.props[propName];
    });

  return dom;
}
```

在 `render` 方法中，我们给 `nextUnitOfWork` (下一个工作单元）赋值为 fiber 树的根节点。

```jsx
function render(element, container) {
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  };
}
```

当浏览器准备就绪的时候，会调用 `workLoop` 方法，于是就会从根节点开始我们的渲染进程。

在 `performUnitOfWork` 方法中: 

我们首先创建一个新的节点, 然后将其添加到 DOM 中。这个新节点会存储在 `fiber.dom` 中:

然后针对每一个子元素，我们都创建一个新的 fiber 。

之后将其添加到 fiber 树中，根据情况设置为子节点或者是兄弟节点。

最后我们实现对下一个工作单元的搜寻工作。首先是子节点，接着是兄弟节点，然后是叔叔节点，以此类推。

最后就实现了 `performUnitOfWork` 方法。下面是完整的代码：

```jsx
function performUnitOfWork(fiber) {
	// 新增 DOM 节点
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom)
  }
	// 对每一个 child 都创建一个新的 fiber 
  const elements = fiber.props.children
  let index = 0
  let prevSibling = null

  while (index < elements.length) {
    const element = elements[index]

    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    }

    if (index === 0) {
      fiber.child = newFiber
    } else {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber
    index++
  }

  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
}
```

## 渲染与提交阶段 Commit

现在我们又遇到了另一个问题。

每开始处理一个元素，我们都会创建一个新的节点到 DOM 中。但是根据目前的代码实现, 在整棵树在 DOM 中渲染完成之前，浏览器是有机会阻碍我们渲染流程的进行的。这样的话，用户就很可能会在此过程中看见一个不完整的 UI ，这不是我们所期待的行为。

因此我们要把引起 DOM 变化部分的代码移除。

```jsx
~~if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom)
  }~~
```

同时，要开始监视 fiber 树根节点的变化。我们将监视变化的节点叫做 `wipRoot` 。

```jsx
function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
  }
  nextUnitOfWork = wipRoot
}

let nextUnitOfWork = null
let wipRoot = null

	function workLoop(deadline) {
		// 见上
	}
}
```

一旦所有工作完成之后（当没有下一个工作单元的时候，就表示所有工作都完成了），再将最终的 fiber 树交给 DOM。

这部分的工作，交给 `commitRoot` 函数来完成。在这里我们递归地将所有节点添加到 DOM 中。

```jsx
function commitRoot() {
  commitWork(wipRoot.child)
  wipRoot = null
}

function commitWork(fiber) {
  if (!fiber) {
    return
  }
  const domParent = fiber.parent.dom
  domParent.appendChild(fiber.dom)
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}
```

## 协调 Reconciliation

截止目前，我们依然只是简单地添加节点到 DOM 中，那么更新和删除 DOM 节点需要怎么处理呢？

接下来要开始这部分的处理，我们要对在 `render` 方法中获取到的 fiber 树，与前一次已经插入到 DOM 中的 fiber 树进行对比。

因此，我们需要在 fiber 树在被插入 DOM 中之前，把它缓存下来，作为对比的对象，我们把它叫做：`currentRoot` 

对于每一个 fiber，我们还会添加一个属性：`alternate` ，它是与旧版本 fiber 的连接，也就是之前缓存下来的前一个版本的 fiber 树中的内容。

现在将 `performUnitOfWork` 方法中创建新 fiber 的代码提取出来，添加到一个名为 `reconcileChildren` 方法中。

```jsx
function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

  const elements = fiber.props.children
  reconcileChildren(fiber, elements)

  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
}
```

然后我们开始处理旧的 fiber 和新的元素们。

同时对旧 fiber 的子节点们（`wipFiber.alternate`）和新元素的数组进行循环遍历的操作。

如果我们忽略所有进行循环遍历的样板代码，会发现在循环中最重要的内容是 `oldFiber` 和 `element` 。`**element` 是我们希望渲染到 DOM 中的内容，`oldFiber` 是前一次渲染的 fiber 树。**

我们需要对它们进行对比, 以确定我们是否需要对 DOM 做出任何修改的操作.

具体方式是对比类型:

```jsx
const sameType = oldFiber && element && element.type == oldFiber.type;

if (sameType) {
  // TODO update the node
}
if (element && !sameType) {
  // TODO add this node
}
if (oldFiber && !sameType) {
  // TODO delete the oldFiber's node
}
```

- 如果旧的 fiber 和新的元素类型是一样的, 我们就保持原先的 DOM 节点, 直接使用新的 props 更新.
- 如果两个类型不一致, 并且有新的元素出现, 那么我们就要创建一个新的 DOM 节点.
- 如果两个类型不一致, 但是旧的 filber 依然存在, 那么我们就要移除旧有节点.

在这里, React 还使用了 key 以更好地实现协调. 举个例子, 当元素的子元素在元素数组中改变位置时, 也会被检测到.

当旧的 fiber 与新的元素类型一致时, 我们开始创建一个新的 fiber 来隔离 DOM 节点与旧的 fiber, 以及元素中传下来的 props.

与此同时, 我们还会给 fiber 添加一个新的属性: `effectTag` , 在提交阶段使用:

```jsx
if (sameType) {
  newFiber = {
    type: oldFiber.type,
    props: element.props,
    dom: oldFiber.dom,
    parent: wipFiber,
    alternate: oldFiber,
    effectTag: "UPDATE"
  };
}
```

对于需要一个新 DOM 节点的情况, 我们将 `effectTag` 的值设为 `PLACEMENT`

```jsx
if (element && !sameType) {
  newFiber = {
    type: element.type,
    props: element.props,
    dom: null,
    parent: wipFiber,
    alternate: null,
    effectTag: "PLACEMENT"
  };
}
```

然后是需要删除 DOM 节点的情况, 我们不需要创建新 fiber, 只需要将值为 `DELETION` 的 `effectTag` 属性添加到旧的 fiber 上即可.

不过当我们将这个 fiber 树提交给 DOM 时, 需要通过 work in progress 节点 (`wipRoot`), 其中不包含旧的 fibers.

```jsx
if (oldFiber && !sameType) {
  oldFiber.effectTag = "DELETION";
  deletions.push(oldFiber);
}
```

因此我们需要有一个数组来存储需要被删除的 fibers.

```jsx
function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  }
  deletions = []
  nextUnitOfWork = wipRoot
}

let nextUnitOfWork = null
let currentRoot = null
let wipRoot = null
let deletions = null

```

当我们将改动提交给 DOM 时, 我们需要的就是以上数组中的 fibers.

```jsx
function commitRoot() {
  deletions.forEach(commitWork)
  commitWork(wipRoot.child)
  currentRoot = wipRoot
  wipRoot = null
}

```

现在我们开始修改 `commitWork` 函数以处理这些新的 `effectTag`.

```jsx
function commitWork(fiber) {
  if (!fiber) {
    return
  }
  const domParent = fiber.parent.dom
  domParent.appendChild(fiber.dom)
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}
```

如果 fiber 的 effectTag 属性值为 `PLACEMENT`, 我们还是执行同样的操作, 将 DOM 节点添加到父 fiber 对应的节点中,

如果是 `DELETION` 的话, 则删除这个子节点.

如果是 `UPDATE` 的话, 则更新已存在的 DOM 节点, 同时更新 props, 具体的操作在 `updateDom` 方法中实现

```jsx
function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  const domParent = fiber.parent.dom;
  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}
```

`updateDom` 中, 我们对比新旧 fiber 中的 props, 移除已经不存在的 props, 更新新建的或者是已经改变的 props.

```jsx
const isProperty = key => key !== "children"
const isNew = (prev, next) => key =>
  prev[key] !== next[key]
const isGone = (prev, next) => key => !(key in next)
function updateDom(dom, prevProps, nextProps) {
  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = ""
    })

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name]
    })
}

```

其中有一类 prop 比较特殊, 就是事件处理器, 我们通过 prop 名中是否含有 `on` 前缀来判断是否是这类 prop.

```jsx
const isEvent = key => key.startsWith("on")
const isProperty = key =>
  key !== "children" && !isEvent(key)
```

如果事件处理函数有任何变化, 我们就从旧的节点中删除它

```jsx
//Remove old or changed event listeners
Object.keys(prevProps)
  .filter(isEvent)
  .filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
  .forEach(name => {
    const eventType = name.toLowerCase().substring(2);
    dom.removeEventListener(eventType, prevProps[name]);
  });
```

同时添加修改后的事件处理函数:

```jsx
// Add event listeners
Object.keys(nextProps)
  .filter(isEvent)
  .filter(isNew(prevProps, nextProps))
  .forEach(name => {
    const eventType = name.toLowerCase().substring(2);
    dom.addEventListener(eventType, nextProps[name]);
  });
```

含有协调功能的 react 实现完整代码: [React With Reconcilation](https://github.com/icyfish/didact/blob/master/src/index_v2.jsx)

## 函数式组件

接下来我们要做的是支持函数组件.

首先修改示例. 我们使用一个简单的函数式组件, 它返回一个 `h1` 元素.

```jsx
/** @jsx Didact.createElement */
function App(props) {
  return <h1>Hi {props.name}</h1>
}
const element = <App name="foo" />
const container = document.getElementById("root")
Didact.render(element, container)
```

将 jsx 转换成 js 的话, 就是这样:

```jsx
function App(props) {
  return Didact.createElement(
    "h1",
    null,
    "Hi ",
    props.name
  )
}
const element = Didact.createElement(App, {
  name: "foo",
})
```

函数式组件在以下两个方面与普通组件有所区别:

- 函数式组件的 fiber 不存在 DOM 节点.
- 它的子元素的产生来自于函数式组件的执行, 而不是通过 `props` 传入

在 `performUnitOfWork` 函数中, 我们检查 fiber 的类型是否是函数, 根据结果执行不同的更新操作.

拆分出函数式组件的处理方法 `updateHostComponent` 和普通组件 的处理方法`updateHostComponent`.

`updateHostComponent` 所做的工作与原来一致:

```jsx
function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  reconcileChildren(fiber, fiber.props.children)
}
```

在 `updateFunctionComponent` 中, 我们执行这个函数组件以获取子元素. 

在我们的例子中, `fiber.type` 的值为 `App` 函数, 执行它时, 会返回 `h1` 元素.

```jsx
function updateFunctionComponent(fiber) {
  const children = [fiber.type(fiber.props)]
  reconcileChildren(fiber, children)
}
```

获取到子元素之后, 协调的工作还是和前一个版本没有区别, 因此不需要做出修改.

接下来需要修改的是 `commitWork` 函数.

开始处理没有 DOM 节点属性的 fibers, 需要修改两处:

```jsx
function commitWork(fiber) {
  if (!fiber) {
    return
  }

  const domParent = fiber.parent.dom
  if (
    fiber.effectTag === "PLACEMENT" &&
    fiber.dom != null
  ) {
    domParent.appendChild(fiber.dom)
  } else if (
    fiber.effectTag === "UPDATE" &&
    fiber.dom != null
  ) {
    updateDom(
      fiber.dom,
      fiber.alternate.props,
      fiber.props
    )
  } else if (fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom)
  }

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}
```

首先要找到 DOM 节点的父节点, 在 fiber 树中不断向上寻找直到找到一个存在 DOM 节点的 fiber.

```jsx
function commitWork(fiber) {
  if (!fiber) {
    return
  }

  let domParentFiber = fiber.parent
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }
  const domParent = domParentFiber.dom

  if (
    fiber.effectTag === "PLACEMENT" &&
    fiber.dom != null
  ) {
    domParent.appendChild(fiber.dom)
  }
	// ...
}
```

删除节点也是, 需要不断寻找知道找到存在 DOM 节点的 fiber.

```jsx
function commitWork(fiber) {
  if (!fiber) {
    return
  }

  const domParent = fiber.parent.dom
   if(xxx) {
    // xxx
  } else if (fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom)
  }

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber.child, domParent)
  }
}
```

## Hooks

最后一步是实现为函数式组件添加状态. 

现在我们将 app 示例进行修改, 改为一个比较经典的计数器应用. 每一次点击计数器的数值就会加上1. 

我们使用 `Didact.useState` 来读取和更新计数器的值.

```jsx
/** @jsx Didact.createElement */
function Counter() {
  const [state, setState] = Didact.useState(1)
  return (
    <h1 onClick={() => setState(c => c + 1)}>
      Count: {state}
    </h1>
  )
}
const element = <Counter />
```

接下来开始实现 `useState` 方法.

在调用函数式组件之前, 我们需要初始化一些全局变量, 然后在 `useState` 方法中使用它们.

首先我们设置正在工作的 fiber (`wipFiber`). 

为这个 filber 设置 `hooks` 属性以支持 `useState` 在同一个组件中多次被调用, 由于被调用多次, 我们还需要关注当前的 hook 索引.

```jsx
let wipFiber = null
let hookIndex = null

function updateFunctionComponent(fiber) {
  wipFiber = fiber
  hookIndex = 0
  wipFiber.hooks = []
  const children = [fiber.type(fiber.props)]
  reconcileChildren(fiber, children)
}
```

当函数式组件调用 `useState` 时, 我们会检查是否有一个旧的 hook 存在. 通过 fiber 的 `alternate` 和 hook 索引得到我们想要的结果.

如果存在一个旧的 hook, 那么我们就会将旧 hook 所存储的 state 拷贝到新的 hook 中. 如果不存在的话, 则初始化一个 state.

然后添加新的 hook 到 fiber 中, index 加上1, 然后返回这个 state.

`useState` 同时还需要返回一个函数, 用以更新 state. 于是我们定义一个 `setState` 方法. 接受一个 action 作为参数, 在计数器的例子中, 这个 action 是每次点击为数字的值增加1.

我们给 `hook` 添加一个 队列 `queue` 属性, 每次用户调用 `setState`, 就把这个 action 添加到队列中.

```jsx
const setState = action => {
  hook.queue.push(action);
  wipRoot = {
    dom: currentRoot.dom,
    props: currentRoot.props,
    alternate: currentRoot
  };
  nextUnitOfWork = wipRoot;
  deletions = [];
};
```

将这个 action 添加到 `hook` 的属性 `queue` 中.

接下来做一些与在 `render` 函数中类似的事情. 设置一个新的追踪节点(`wipRoot`), 在下一次工作进程开始时, 循环中可以开始一次新的渲染流程.

接下来是执行 action, 在下一次组件重新渲染时, 我们会从旧的 hook 队列中读取到所有 action. 之后我们会在新的 hook 状态中一一执行这些 action, 然后返回最新的状态.

```jsx
function useState(initial) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex]
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  }

	const actions = oldHook ? oldHook.queue : []
  actions.forEach(action => {
    hook.state = action(hook.state)
  })

  const setState = action => {
    hook.queue.push(action)
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    }
    nextUnitOfWork = wipRoot
    deletions = []
  }

  wipFiber.hooks.push(hook)
  hookIndex++
  return [hook.state, setState]
}
```

最终版本的代码: [React With Hooks](https://codesandbox.io/s/didact-8-21ost)

## 后记

这篇文章除了帮助大家理解 React 的实现原理之外, 还有一个目的就是希望大家在阅读完之后能更容易地探索 React 源码. 这也是我们在文章中使用与源码一致的变量名和函数名的原因.

举个例子, 如果你在实际的 React 应用中, 在函数式组件里添加断点, 调用栈就会是如下这样:

- `workLoop`
- `performUnitOfWork`
- `updateFunctionComponent`

当然, 教程中并没有覆盖到全部的 React 特性以及优化点. 举个例子, 下面是 React 与我们的源码实现地不同的地方:

- 在 Didact 中, 我们在 `render` 阶段遍历了整个树. 而 React 并不会这样做, 当子树没有任何变化的话, 某些不必要的渲染流程就会被跳过.
- 同时在提交阶段, 我们也遍历了整个树, 而 React 则是维护了一个链表, 只关注有 `effectTag` 的 fiber, 只遍历这些 fiber.
- 每次我们创建一个新的工作节点时, 都会在每个 fiber 中创建新的对象. 而 React 则会从先前的树中回收这些 fiber.
- 当 Didact 在 `render` 阶段执行一次更新时, 会将追踪工作树完全移除, 然后从根节点再重新开始流程. 而 React 的每一个 tag 则是维护了一个时间戳, 根据是否超时来确定此次更新的优先级.
- 以及更多......

你还可以很方便地添加 React 相关的其他特性:

- 处理值为对象的 `style` 属性
- [实现子元素的扁平化](https://github.com/pomber/didact/issues/11)
- `useEffect`
- 根据 key 进行协调