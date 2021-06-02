---
title: React DnD 文档翻译 - 概览
date: "2021-06-02"
template: "post"
draft: false
category: "Drag And Drop"
description: "React DnD Overview"
toc: true
---

原文: https://react-dnd.github.io/react-dnd/docs/overview

React DnD 与市面上其他的拖拽库区别比较大, 如果你以前从来没有用过 React DnD, 上手会比较困难. 不过, 只要你了解了其中一些设计理念之后, 对 DnD 的理解和上手就会更容易了. 因此我建议大家在阅读文档的其他部分时, 首先阅读这一部分, 了解一些重要概念.

React DnD 中某些概念与 [Flux](http://facebook.github.io/flux/) 和 [Redux](https://github.com/reactjs/react-redux) 类似. 这并非巧合, 它内部使用的就是 Redux.

## 项目与类型

与 Flux 或者 Redux 类似的是, React DnD 操作的是数据, 而非视图, 并且只有数据能够控制视图. 当用户在屏幕中拖拽某些部分时, 我们并不将这些部分称为组件或者 DOM 节点, 而是某种类型的 _项目_ (_item_).

那么项目是什么呢? 它是一个 JavaScript 对象, 描述了用户正在拖拽的内容. 举个例子, 在看板类的应用中, 用户所拖拽的卡片, 用项目的形式描述就会像是这样 `{ cardId: 42 }`. 在国际象棋游戏中, 当用户拿起一个棋子, 项目可能就是这样 `{ fromCell: 'C5', piece: 'queen' }` . **将所拖拽的数据以对象的形式表示有利于组件之间的解耦.**

那么类型又是什么呢? 它是表示一类项目的唯一标识, 由字符串(或者 [symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol))表示. 在看板应用中, 会存在一个`"卡片"`类型, 代表所有可拖拽的卡片类项目, 还会存在`"列表"`类型, 代表某些卡片所在的容器区域, 同时这个列表类型也是可拖拽的. 而在国际象棋游戏中, 就只有一个类型: `"棋子"`.

类型在 dnd 中是一个重要的概念, 当我们的应用规模逐渐扩大之后, 可能会增加更多可拖拽的元素, 但是原来的拖拽目标(区域), 并不需要承载新增的可拖拽元素. **类型使得我们能够声明拖拽部分和容器部分之间的对应关系.** 因此我们就需要事先列举出应用中包含的所有可拖拽类型, 就像在 Redux 中列举出所有 action 一样.

## 监视器

拖拽的动作是有状态的. 拖拽的操作要么处于正在进行状态, 要么处于未进行状态. 当前状态的所有者一定属于某个类型, 某个项目.

React DnD 通过*监视器(monitors)* 来暴露拖拽的状态. **我们能利用监视器所提供的信息, 更新组件的状态, 以处理拖拽状态的变化.**

对于需要追踪拖拽状态的组件, 用户可以定义一个 _收集函数(collecting function)_ , 通过该函数获取监视器所提供的拖拽状态信息, 并做出对应的处理. React DnD 会在必要的时候调用收集器函数, 并合并返回值, 注入组件的 `props` 中.

举个具体的例子, 当某个棋子被拖拽时, 我们希望高亮对应棋盘格. 那么棋盘格 `Cell` 组件的收集函数可以这样定义:

```jsx
function collect(monitor) {
  return {
    highlighted: monitor.canDrop(),
    hovered: monitor.isOver(),
  }
}
```

以上函数会告诉 React DnD, 将实时更新的 `highlighted` 和 `hovered` 作为 props 传给所有 `Cell` 的实例.

## 连接器

DnD 的底层(HTML5-backend)处理了 DOM 事件, 然而我们的组件本身却是使用 React 来描述 DOM 的, 那么底层是怎么知道应该监听哪一个 DOM 节点的呢? 答案是 _连接器(connectors)_ . **连接器允许用户在 `render` 函数中为 DOM 节点分配一系列预先定义好的角色(拖拽元素, 拖拽预览图, 可承载拖拽元素的区域).**

实际上, 连接器是传入*收集器函数*的第一个参数. 看下面的代码例子, 我们应该如何用连接器来声明可承载拖拽元素的区域.

```jsx
function collect(connect, monitor) {
  return {
    highlighted: monitor.canDrop(),
    hovered: monitor.isOver(),
    connectDropTarget: connect.dropTarget(),
  }
}
```

在组件的 `render` 方法中, 我们能同时获取到监视器暴露出的数据和连接器暴露出的函数:

```jsx
render() {
  const { highlighted, hovered, connectDropTarget } = this.props;

  return connectDropTarget(
    <div className={classSet({
      'Cell': true,
      'Cell--highlighted': highlighted,
      'Cell--hovered': hovered
    })}>
      {this.props.children}
    </div>
  );
}
```

调用 `connectDropTarget` 方法后, React DnD 就能够知道组件对应的根 DOM 节点是否为合法的可拖拽区域, 同时, 组件的拖拽和鼠标悬停事件也应该被 DnD 底层处理. 实际的工作原理是, DnD 会给用户的 React 组件关联一个[回调 ref](https://zh-hans.reactjs.org/docs/forwarding-refs.html#gatsby-focus-wrapper) . 同时, 连接器返回的函数能够被缓存下来, 因此也不会影响 `shouldComponentUpdate` 的优化效果.

## 拖拽元素和拖拽目标

至此, 我们对 DnD 底层进行了介绍, 它们的主要工作是与 DOM 和数据进行交互, 交互的媒介就是我们的项目, 类型, 收集器函数, 监视器和连接器, 通过这些媒介, 我们就可以描述 React DnD 应该把哪些属性注入到我们的组件中.

那么, 应该如何配置我们的组件, 以确保那些属性确实被注入了呢? 如果我们希望针对拖拽事件执行一些副作用操作, 又该怎么办呢? 这时候就要依赖拖拽元素(_drag sources_ )和拖拽目标 (_drag targets_) 了. 这两者是 React DnD 中最重要的两个抽象单元. **它们将类型, 项目, 副作用, 收集器函数与我们的 React 组件进行关联.**

如果你希望应用中某个组件或者某个部分是可拖拽的, 你需要将这个组件声明为*drag source 拖拽元素*. 每个拖拽元素在被声明的同时也会被注册为某个*类型*, 同时, 用户还需要实现一个方法, 该方法的功能是, 能够根据组件的属性决定生成一个特定类型的*项目*. 除了上述必须实现的方法之外, 用户还可以声明一些可选方法. 声明拖拽元素的同时还可以直接为该元素声明*收集器函数*.

拖拽目标和拖拽元素很像. 它们区别就是单个拖拽目标一次可能会被注册多个类型, 同时拖拽目标的功能不是生成一个项目, 而是承载拖拽元素.

## 底层

React DnD 基于 [HTML5 drag and drop API (HTML5 拖拽 API)](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Drag_and_drop) 实现. 将其作为默认实现是十分合理的, 因为它在拖拽状态的预览效果就是被拖拽元素本身的样式, 用户不需要再对预览的效果做额外的处理实现. 同时, 这个 API 也是唯一处理文件拖拽事件的 API.

但是 HTML5 拖拽 API 有一些缺陷, 它不支持触摸屏. 同时在 IE 浏览器中还存在一些兼容性问题, 因此在 IE 中可以扩展的功能相比其他浏览器也比较少.

于是, React DnD 以**插件化的方式实现了对 HTML5 拖拽 API 的依赖.** 你可以选择不依赖该 API, 基于浏览器的触摸事件和鼠标事件等, 自己去实现拖拽的功能. 这种插件化的实现方式, 在 React DnD 中, 被称为*底层*. 目前 React DnD 所配套的底层是 [HTML5 backend](https://react-dnd.github.io/react-dnd/docs/backends/html5).

React DnD 底层的作用和 React 的合成事件系统有点类似: **都处理了原生的 DOM 事件并抹平了各个浏览器之间的差异(兼容性问题).** 尽管有这些类似之处, 但是 React DnD 并不依赖 React 以及它的合成事件. 本质上来说, React DnD 底层所做的工作就是将 DOM 事件翻译成内部的 Redux action, 以便 React DnD 对这些 DOM 事件进行处理. 
## Hooks 和高阶组件

现在你已经了解了 React DnD 的一些重要概念, 它们包括:

- Item 对象和 types
- 由 flux 表达的 DnD 状态
- 监视 DnD 状态的监视器
- 将监视器输出的内容转换为组件可以消费的 props 的收集器函数
- 将 DnD 的状态与 DOM 节点连接的连接器

想要在我们的组件中使用以上内容, 有两个选择, 一个是使用[基于 hooks](https://react-dnd.github.io/react-dnd/docs/api/hooks-overview) 实现的 API, 一个是使用[基于装饰器](https://react-dnd.github.io/react-dnd/docs/api/decorators-overview)的 API.
