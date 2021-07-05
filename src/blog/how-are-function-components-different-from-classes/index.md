---
title: 函数式组件和类式组件的区别
date: "2021-06-08"
template: "post"
draft: false
toc: true
description: "How Are Function Components Different from Classes?"
---

原文: [How Are Function Components Different from Classes?](https://overreacted.io/how-are-function-components-different-from-classes/)


React 函数式组件和类式组件有什么区别的呢?

很长一段时间, 对于这个问题的权威回答是这样的: 类式组件提供了更多的能力(比如存储状态的能力). 不过当 [Hooks](https://reactjs.org/docs/hooks-intro.html) 特性出现之后, 这个答案也就过时了.

或许你听说过这样的答案, 其中一类组件的性能更佳. 那么是哪一类呢? 其实许多评估性能的指标都多多少少存在一些[缺陷](https://medium.com/@dan_abramov/this-benchmark-is-indeed-flawed-c3d6b5b6f97f), 因此得出性能评估的结果必须十分慎重. 应用的性能在很大程度上跟应用的功能有关, 跟你所选择的组件类型关系其实