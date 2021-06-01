---
title: setState如何知道自己应该做什么?
date: "2020-01-22"
template: "post"
draft: false
category: "React"
tags:
  - "React"
description: "How Does setState Know What to Do?"
---

原文: [How Does setState Know What to Do?](https://overreacted.io/how-does-setstate-know-what-to-do/)


当我们在 React 中调用 `setState` 时, 实际上发生了什么呢?

```jsx
import React from 'react';
import ReactDOM from 'react-dom';

class Button extends React.Component {
  constructor(props) {
    super(props);
    this.state = { clicked: false };
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick() {
    this.setState({ clicked: true });
  }
  render() {
    if (this.state.clicked) {
      return <h1>Thanks</h1>;
    }
    return (
      <button onClick={this.handleClick}>
        Click me!
      </button>
    );
  }
}

ReactDOM.render(<Button />, document.getElementById('container'));
```

对于以上代码, 当状态变化为 `{ clicked: true }` 时, DOM会变化为 `<h1>Thanks</h1>` 

看起来很直接, 不过这部分操作是 React 还是 React DOM 做的呢? 

我们可能会认为, 更新 DOM 的工作是由 React DOM 负责的. 但是我们调用的 `this.setState()` 并不是来自于 React DOM. 而是 `React.Component` 所提供的方法, 而这个方法实际上定义在 React 中. 

那么 `React.Component` 中的 `setState()`方法是如何更新 DOM 的呢?

**注意: 和博客中的[许多](https://overreacted.io/why-do-we-write-super-props/) [其他](https://overreacted.io/how-does-react-tell-a-class-from-a-function/) [文章](https://overreacted.io/why-do-react-elements-have-typeof-property/)一样, 本篇文章的目的是分析 React 的原理, 并不意味着不理解文章的内容就会对高效使用 React 有任何影响. 文章的受众是对 React 底层原理有好奇心的人~ 并非强制阅读.**

---

大家也许会认为 `React.Component` 类中包含了更新 DOM 的逻辑.

但是如果以上推断成立的话, `this.setState()` 在其他环境下是怎么正常工作的呢? 比如说, React Native APP 的组件同样继承自 `React.Compoent` . 也是以同样的方式调用 `this.setState()` 的. 然而在Android 和 IOS 原生 View 中并没有 DOM 的概念.

你可能听说过 React Test Renderer 或者 Shallow Renderer. 这两种测试的策略都是渲染普通的组件然后在内调用 `this.setState()` 方法. 但是两者都不是在 DOM 中操作的.

如果有人使用过类似 [React ART](https://github.com/facebook/react/tree/master/packages/react-art) 的渲染器. 也许会知道, 在一个页面中可以使用多个渲染器. (举个例子: ART 组件是在 React DOM 树下工作的). 这样的情况限制了我们使用全局标识位的方法.

`React.Component` 将状态更新的工作**委托给了宿主平台(DOM或者native view).** 在深入理解其中的实现原理之前, 我们先看看React是如何解耦的.

---

最常见的错误观念是React "引擎" 处于 `react` 这个库中, 实际上是并不正确的.

自从 React 0.14 版本决定将各个包进行 [解耦拆分](https://reactjs.org/blog/2015/07/03/react-v0.14-beta-1.html#two-packages)之后, `react` 只暴露了一些定义组件的API, 大部分内部的实现都在 "渲染器(renderer)" 中.

包括`react-dom`, `react-dom/server`, `react-native`, `react-test-render` , `react-art` 等(你也可以[创造自己的渲染器](https://github.com/facebook/react/blob/master/packages/react-reconciler/README.md#practical-examples)). 

这也是 `react` 在不同的平台下都能保持功能一致的原因. 所有这些输出的API , 比如  `React.Component` , `React.createElement` , `React.Children` 以及 [Hooks](https://reactjs.org/docs/hooks-intro.html) . 其中的逻辑都是和目标平台完全解耦的. 无论在何种平台下, React 的使用方式都是一致的.

唯一有区别的是, 渲染器会暴露的平台特有的一些 API, 如 `ReactDOM.render()` 用于在对应的宿主平台渲染对应的 React 组件. 在理想情况下, 大多数组件不需要从渲染器中引入任何元素. 这使其可移植性变得更高.

**大多数人概念中的 React 引擎 , 实际上存在于各自的渲染器中.** 许多渲染器中所包含的部分代码, 实际上都是一致的, 比如说[协调器](https://github.com/facebook/react/tree/master/packages/react-reconciler), 就是被拷贝到渲染器中的. 通过[构建](https://reactjs.org/blog/2017/12/15/improving-the-repository-infrastructure.html#migrating-to-google-closure-compiler)的过程, 渲染器相关代码与协调器相关代码被整合到一起, 以实现性能的优化. (因为大部分情况下, 一个应用只需要一个渲染器, 比如 `react-dom`即可, 因此拷贝协调器代码并不会影响最终的应用代码体积.)

 这里需要了解的一点是, `react` 包只提供了一些 React 相关特性, 包本身并不包含这些特性的实现代码. 而渲染器包 (`react-dom`, `react-native` 等) 才是真正负责了 React 特性的实现, 与此同时还包括了一些平台特定的逻辑. 存在一些共同的部分(比如说[协调器](https://github.com/facebook/react/tree/master/packages/react-reconciler)), 具体还是需要看各个渲染器本身的实现细节.

---

这样一来, 大家可能就理解了, 为什么每次更新包版本时, 不仅要更新 `react` , 同时还要更新 `react-dom` . 举例来说, React 16.3 添加了一个新的 Context API, React 包暴露了 `React.createContext()` 这个方法.

但是实际上, `React.createContext()` 本身并没有实现 context 的特性. 因为实现的细节是有平台差异的, 在 React DOM 和 React DOM Server 中的实现方式是有所差别的, `createContext()` 只是返回了一些对象而已:

```jsx
// 简化版的代码
function createContext(defaultValue) {
  let context = {
    _currentValue: defaultValue,
    Provider: null,
    Consumer: null
  };
  context.Provider = {
    $$typeof: Symbol.for('react.provider'),
    _context: context
  };
  context.Consumer = {
    $$typeof: Symbol.for('react.context'),
    _context: context,
  };
  return context;
}
```

当我们在代码中使用 `<MyContext.Provider>` 或者 `<MyContext.Consumer>` 时, 是 `renderer` 渲染器决定了如何处理他们. React DOM 和 React DOM Server 追踪 context 值的方式可能完全不一致.

**因此如果你将 `react` 更新到了 16.3+ 但是没有更新 `react-dom` 的话, 代码中的 `Provider` 和 `Consumer` 可能就会被忽略, 并**[导致这样的报错](https://stackoverflow.com/a/49677020/458193)**.**

React Native 也是同样. 不过有一点区别是, 有些版本的 React 更新并不强制要求 React Native 的版本更新. 两者的更新频次并不完全一致. 这是因为 React Native 库会经常[自动同步渲染器相关的代码](https://github.com/facebook/react-native/commits/master/Libraries/Renderer/oss). 

---

现在我们知道了, 其实 `react` 包中并没有很多有趣的代码, 许多功能的实现细节都在渲染器 `react-dom`, `react-native`... 中. 但是说了这么多, 好像并没有回答我们题目中提出的问题. `React.Component` 中的 `setState()` 到底是怎么告诉对应的渲染器更新状态的呢?

**答案是每一个渲染器都在所创建的类中设置了一个特殊的属性.** 这个属性是 `updater` . 当我们基于自己实现的类创建出一个实例之后, React DOM, React DOM Server 或者 React Native 就会在这个实例中设置一个 `updater`:

```jsx
// Inside React DOM
const inst = new YourComponent();
inst.props = props;
inst.updater = ReactDOMUpdater;

// Inside React DOM Server
const inst = new YourComponent();
inst.props = props;
inst.updater = ReactDOMServerUpdater;

// Inside React Native
const inst = new YourComponent();
inst.props = props;
```

查看 `[setState` 的源码](https://github.com/facebook/react/blob/ce43a8cd07c355647922480977b46713bd51883e/packages/react/src/ReactBaseClasses.js#L58-L67), 我们会发现, 它做的事情是将具体的工作委托给对应的渲染器:

```jsx
// A bit simplified
setState(partialState, callback) {
  // Use the `updater` field to talk back to the renderer!
  this.updater.enqueueSetState(this, partialState, callback);
}
```

React DOM Server [会忽略这个更新](https://github.com/facebook/react/blob/ce43a8cd07c355647922480977b46713bd51883e/packages/react-dom/src/server/ReactPartialRenderer.js#L442-L448)并抛出告警, 而 React DOM 和 React Native 则是会让对应的[协调器](https://github.com/facebook/react/blob/ce43a8cd07c355647922480977b46713bd51883e/packages/react-reconciler/src/ReactFiberClassComponent.js#L190-L207)来处理这次更新.

---

前面所说的都是类式组件的实现原理, 那么 Hooks 是怎么做的呢?

当大家第一次看 [Hooks 提案 API](https://reactjs.org/docs/hooks-intro.html) 的时候, 经常会有这样的疑惑: `useState` 是怎么知道要做什么的. 大家会觉得其中的实现细节比类式组件更加"神奇". 

但是根据前面的叙述可以看出来, 基类 `setState()` 的实现并不是我们想象的那样. 它仅仅只是将具体的工作托管给了对应的渲染器. `useState` 实际上[做的也是类似的事情](https://github.com/facebook/react/blob/ce43a8cd07c355647922480977b46713bd51883e/packages/react/src/ReactHooks.js#L55-L56). 

唯一的不同是, 用的并非 `updater` , 而是 `dispather` 对象. 当我们调用 `React.useState()` , `React.useEffect()`, 或者其他内置的 hook 时, 这些调用都托管给了当前的 `dispatcher` .

```jsx
// In React (simplified a bit)
const React = {
  // Real property is hidden a bit deeper, see if you can find it!
  __currentDispatcher: null,

  useState(initialState) {
    return React.__currentDispatcher.useState(initialState);
  },

  useEffect(initialState) {
    return React.__currentDispatcher.useEffect(initialState);
  },
  // ...
};
```

对应的渲染在我们渲染组件之前, 设置了这个 `dispatcher` :

```jsx
// In React DOM
const prevDispatcher = React.__currentDispatcher;
React.__currentDispatcher = ReactDOMDispatcher;
let result;
try {
  result = YourComponent(props);
} finally {
  // Restore it back
  React.__currentDispatcher = prevDispatcher;
}
```

React DOM Server 的具体[实现](https://github.com/facebook/react/blob/ce43a8cd07c355647922480977b46713bd51883e/packages/react-dom/src/server/ReactPartialRendererHooks.js#L340-L354), 协调器的具体[实现](https://github.com/facebook/react/blob/ce43a8cd07c355647922480977b46713bd51883e/packages/react-reconciler/src/ReactFiberHooks.js)也依然是 React DOM 与 React Native 共享的.

这也是为什么我们使用 Hooks 时, 依然同时依赖 `react` 和 `react-dom` , 如果不是这样, 那么我们的组件就无法读取到这个 `dispatcher` ! 当在同一个组件树中[存在多个 React 拷贝](https://github.com/facebook/react/issues/13991)的时候, 也会出现 bug. 多个拷贝还会引起很多其他不可预知的 bug, 因此使用 Hooks 时, 会强制我们的应用不允许存在多个 React 拷贝.

在某些情况下, 我们还能够覆盖这个 `dispatcher` , 当然不推荐这样做. (对了, 上面说的 `__currentDispatcher` 这个变量名实际上和实际 React 使用的变量名其实并不一样, 你可以浏览源码找到实际的变量名). 那么这个某些情况具体有什么情况呢? 举个例子, React 开发者工具使用了[一个特殊的 dispatcher](https://github.com/facebook/react/blob/ce43a8cd07c355647922480977b46713bd51883e/packages/react-debug-tools/src/ReactDebugHooks.js#L203-L214) 来获取 JavaScript 的栈踪迹用以查看 Hooks 树. 但是你要慎重做同样的事情.

以上这点也说明了, Hooks 并非天然和 React 绑定. 如果未来其他库希望能够复用 Hooks, `dispatcher` 将会被转移到另外一个包中, 并以一等 API 的形式暴露出来, 当然我们会设计为这个 API 设计一个没那么 "恐怖" 的名字. 目前, 我们暂时不会这样做, 除非必要, 否则我们会避免过早地进行抽象.

`updater` 属性和 `__currentDispatcher` 对象是泛型程序设计原则中的一种形式: 依赖注入. 在这两种情况下, 渲染器将 `setState` 的实现注入到 React 包中, 使得我们的组件更有声明式的特点.

当大家在使用 React 的时候, 并不需要思考这些原理. 我们希望 React 用户关注业务代码的优化甚于思考类似依赖注入这类抽象的概念. 不过如果你确实对 `this.setState()` 和 `useState()` 的内部实现感到好奇, 希望这篇文章能够帮到你.