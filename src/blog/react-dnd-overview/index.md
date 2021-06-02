---
title: React DnD 文档翻译 - 概览
date: "2021-06-02"
template: "post"
draft: true
category: "Drag And Drop"
description: "React DnD Overview"
toc: false
---

原文: https://react-dnd.github.io/react-dnd/docs/overview

React DnD 与市面上其他的拖拽库区别比较大, 如果你以前从来没有用过 React DnD, 上手会比较困难. 不过, 只要你了解了其中一些设计理念之后, 对 DnD 的理解和上手就会更容易了. 因此我建议大家在阅读文档的其他部分时, 首先阅读这一部分, 了解一些重要概念.

React DnD 中某些概念与 [Flux](http://facebook.github.io/flux/) 和 [Redux](https://github.com/reactjs/react-redux) 类似. 这并非巧合, 它内部使用的就是 Redux.

## Items and Types

与 Flux 或者 Redux 类似的是, React DnD 操作的是数据, 而非视图, 并且只有数据能够控制视图. 当用户在屏幕中拖拽某些部分时, 我们并不将这些部分称为组件或者 DOM 节点, 而是某种类型的 _项目_  (_item_).

那么项目是什么呢? 它是一个 JavaScript 对象, 描述了用户正在拖拽的内容. 举个例子, 在看板类的应用中, 用户所拖拽的卡片, 用项目的形式描述就会像是这样 `{ cardId: 42 }`. 在国际象棋游戏中, 当用户拿起一个棋子, 项目可能就是这样 `{ fromCell: 'C5', piece: 'queen' }` . **将所拖拽的数据以对象的形式表示有利于组件之间的解耦.**

那么类型又是什么呢? 它是表示一类项目的唯一标识, 由字符串(或者 [symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol))表示. 在看板应用中, 会存在一个`"卡片"`类型, 代表所有可拖拽的卡片类项目, 还会存在`"列表"`类型, 代表某些卡片所在的容器区域, 同时这个列表类型也是可拖拽的. 而在国际象棋游戏中, 就只有一个类型: `"棋子"`.

类型在 dnd 中是一个重要的概念, 当我们的应用规模逐渐扩大之后, 可能希望有更多可拖拽的部分, 

 <mark>MARK</mark>

我们当然不可能针对所有的可拖拽部分使用同一类事件处理器. **类型的概念能够确保拖拽元素和拖拽目标(区域)互相匹配.**  那么我们就需要事先列举出应用中包含的所有可拖拽类型, 就像在 Redux 中列举出所有 action 一样.

拖拽的动作在内部是有状态的. 拖拽的操作要么处于正在进行状态, 要么处于静止状态. 当前状态的所有者一定属于某个类型, 某个项目.

React DnD 通过内部状态存储单元的某些小容器(叫做*监视器*)将拖拽的状态暴露出来. **我们能利用监视器所提供的信息, 更新组件的状态, 以处理拖拽状态的变化.**

对于需要追踪拖拽状态的组件, 用户可以定义一个 *收集函数* , 通过该函数获取监视器所提供的拖拽状态信息, 并做出对应的处理. React DnD 会在必要的时候调用收集器函数, 并合并返回值, 将其作为属性值传入组件中.

举个具体的例子, 当某个棋子被拖拽到某个棋盘格中时, 我们需要高亮该棋盘格. 那么 `Cell` 组件的收集函数可以这样定义:

```jsx
function collect(monitor) {
  return {
    highlighted: monitor.canDrop(),
    hovered: monitor.isOver()
  }
}
```

以上函数会告诉 React DnD, 将实时更新的 `highlighted` 和 `hovered` 参数值传给所有 `Cell` 的实例. 

之前提到, DnD 的底层处理了 DOM 事件, 然而我们的组件本身却是使用 React 来描述 DOM 的, 那么内部是如何知道应该响应哪一个 DOM 节点的呢?  答案是连接器 *connectors* . **连接器允许用户在 `render` 函数中为 DOM 节点分配一系列预先定义好的角色.**

实际上, 连接器是传入收集器函数的第一个参数. 现在看看代码例子, 我们应该如何用连接器来声明拖拽目标.

```jsx
function collect(connect, monitor) {
  return {
    highlighted: monitor.canDrop(),
    hovered: monitor.isOver(),
    connectDropTarget: connect.dropTarget()
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

调用 `connectDropTarget` 方法后, React DnD 就能够知道组件对应的根 DOM 节点是否为合法的可拖拽目标, 同时 DnD 也会在内部处理拖拽和鼠标悬停事件. 事实上, DnD 会给用户的 React 组件关联一个[回调 ref](https://zh-hans.reactjs.org/docs/forwarding-refs.html#gatsby-focus-wrapper) . 同时, 连接器返回的函数能够被缓存下来, 因此也不会影响 `shouldComponentUpdate` 的优化效果.

至此, 我们对 DnD 底层如何与 DOM 和数据做交互进行了介绍, 具体的交互形式分别以 `items`和 `types` 的形式体现, 同时还了解了收集函数是通过监视器和连接器来声明 DnD 注入到组件中的属性的. 

接下来我们要了解, 应该如何配置我们的组件, 以确保那些属性确实被注入了呢? 同时, 如果我们希望针对拖拽事件执行一些副作用操作, 又该怎么执行呢? 这时候就要依赖拖拽元素(*drag sources* )和拖拽目标 (*drag targets*) 了. 这两者是 React DnD 中较为重要的两个概念. **它们将类型, 项目, 副作用, 收集器函数与你的 React 组件进行关联.** 

如果你希望应用中某个组件或者某个部分是可拖拽的, 你需要将这个组件声明为拖拽元素. 拖拽元素在被声明的同时也会注册某个类型, 同时, 用户必须实现一个方法, 该方法的功能是, 根据组件的属性生成一个特定类型的项目.  除了上述必须实现的方法之外, 用户还可以声明一些可选方法, 以处理拖拽事件.  声明拖拽元素的同时还可以直接声明收集器函数.

拖拽目标和拖拽元素很像. 它们唯一的区别就是单个拖拽目标一次可能会被注册多个类型. and instead of producing an item, it may handle its hover or drop.

### 高阶组件和装饰器

现在还有个问题, 如何包裹你的组件呢? 包裹又意味着什么? 如果你从未使用过高阶组件, 建议先阅读[这篇文章](https://medium.com/@dan_abramov/mixins-are-dead-long-live-higher-order-components-94a0d2f9e750), 文章对高阶组件这个概念做出了详细的解释.

**简单来说, 高阶组件实际上是一个函数, 它接受一个 React 类组件, 返回另一个 React 类组件.** DnD 所提供的包裹组件, 就是一个高阶组件, 在 DnD 的 `render` 方法中所渲染的组件, 会被高阶组件包裹处理: 为被包裹的组件添加一些有用的属性和方法. 

在 React DnD 中, `[DragSource](https://react-dnd.github.io/react-dnd/docs/api/drag-source)` (拖拽元素)和 `[DropTarget](https://react-dnd.github.io/react-dnd/docs/api/drop-target)` (拖拽目标), 以及一些在暴露在顶层的函数, 实际上都是高阶组件. 就是这些高阶组件将拖拽的逻辑整合到你自己的组件中.

使用这些高阶组件时, 有一点需要特别注意的是: 存在着两次函数调用. 举个例子, 将你的组件包裹到 `[DragSource](https://react-dnd.github.io/react-dnd/docs/api/drag-source)` 中, 需要这样实现:

```jsx
import { DragSource } from 'react-dnd'

class YourComponent {
  /* ... */
}

export default DragSource(/* ... */)(YourComponent)
```

注意, 在第一个函数调用中声明了 `[DragSource](https://react-dnd.github.io/react-dnd/docs/api/drag-source)`  的参数之后, 还有另一个函数调用, 在该函数调用中才可以传入你的组件. 这叫做函数的[柯里化](https://zh.wikipedia.org/wiki/%E6%9F%AF%E9%87%8C%E5%8C%96), 还可以称作是[Partial application](https://en.wikipedia.org/wiki/Partial_application). 这样的特性, 使得实现[装饰器语法](https://github.com/wycats/javascript-decorators)成为可能.

当然我们并没有强制要求你使用装饰器语法, 不过如果想要使用的话, 记得用 Babel 编译你的代码, 并在配置文件 [.babelrc](https://babeljs.io/docs/usage/babelrc/) 中添加该配置: `{ "stage": 1 }`. 

即使你没有使用装饰器语法的打算,  partial application 这个概念也能为我们带来比较大的便利. 当你需要合并多个 `[DragSource](https://react-dnd.github.io/react-dnd/docs/api/drag-source)` 和 `[DropTarget](https://react-dnd.github.io/react-dnd/docs/api/drop-target)` 的时候, 如果采取使用普通的 JavsScript 语法的方式, 或许你会用到一个函数组合类工具方法 : [`_.flow`](https://lodash.com/docs/4.17.15#flow) 来达到合并的目的. 但是有了装饰器之后, 只需要简单地对装饰器进行重叠, 就能够达到同样的目的.

假设我们有个 `Card` 元素, 以下的代码就是将 `Card` 元素包裹到拖拽元素中的一个实例.

```jsx
import React from 'react'
import { DragSource } from 'react-dnd'

// Drag sources and drop targets only interact
// if they have the same string type.
// You want to keep types in a separate file with
// the rest of your app's constants.
const Types = {
  CARD: 'card'
}

/**
 * Specifies the drag source contract.
 * Only `beginDrag` function is required.
 */
const cardSource = {
  beginDrag(props) {
    // Return the data describing the dragged item
    const item = { id: props.id }
    return item
  },

  endDrag(props, monitor, component) {
    if (!monitor.didDrop()) {
      return
    }

    // When dropped on a compatible target, do something
    const item = monitor.getItem()
    const dropResult = monitor.getDropResult()
    CardActions.moveCardToList(item.id, dropResult.listId)
  }
}
/**
 * Specifies which props to inject into your component.
 */
function collect(connect, monitor) {
  return {
    // Call this function inside render()
    // to let React DnD handle the drag events:
    connectDragSource: connect.dragSource(),
    // You can ask the monitor about the current drag state:
    isDragging: monitor.isDragging()
  }
}
function Card(props) {
  // Your component receives its own props as usual
  const { id } = props

  // These two props are injected by React DnD,
  // as defined by your `collect` function above:
  const { isDragging, connectDragSource } = props

  return connectDragSource(
    <div>
      I am a draggable card number {id}
      {isDragging && ' (and I am being dragged now)'}
    </div>
  )
}

// Export the wrapped version
export default DragSource(Types.CARD, cardSource, collect)(Card)
```

现在所有的准备工作已经做好, 接下来可以开始阅读文档的其他部分了. 

推荐阅读这个教程: 

[React DnD - 教程](/react-dnd-tutorial)