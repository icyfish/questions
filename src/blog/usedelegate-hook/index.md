---
title: 实现一个事件委托 hook
date: "2021-04-19"
template: "post"
draft: false
category: "React"
tags:
  - "hooks"
description: "Implement A useDelegateEvent Hook"
---


## 背景

我们的业务场景是一个页面搭建平台, 平台中存在许多固定模板用以搭建页面. 其中有一个比较特殊的模板叫做自定义代码模板, 通过这个模板, 用户能够在后台录入一些 html 以供前端页面读取, 并渲染对应的内容. 关于这个模板的主要功能逻辑, 在这篇文章中已经做出了介绍: [在 React 组件中渲染接口下发的 html](http://icyfish.github.io/blog/posts/ssr-render-html-string/)

对于这个模板的功能, 我们还需要做出一些优化. 在正常情况下, 运营编写自定义代码的最主要诉求为以下两类:

1. 添加花哨的页面动效, 以营造营销活动的氛围(这部分主要依赖外部 JavaScript 的引入, 在主要功能介绍的文章中, 我们针对这个诉求已经做出了一些特殊的处理 .
2. 第二点则是针对自定义代码中的某些元素添加点击事件, 跳转到二级页面, 以达到引流的目的.

但是由于我们的页面需要适应不同的平台, H5, App, 微信小程序等, 因此点击方法的实现也需要根据平台有所差异, 用户不可能也没有必要去实现这些差异化的处理. 针对这部分内容, 我们也在程序中实现了特殊的处理. 

首先我们和用户约定, 在需要添加点击事件的 DOM 元素中, 用户要给这个元素添加一个特殊的类名, 我们约定为 `.moreLink` , 同时在这个 DOM 元素上还需要添加点击的目标 URL. URL 是区分平台的, 因此约定了三个属性: `data-url` , `data-appurl` , `data-miniprogramurl` .

这样的话, 我们接受到的自定义 html 字符串就可能是如下这样的:

```jsx
const codeBlock = `
<div data-url="https://m.ctrip.com" class="moreLink"><h1>outer</h1></div>
<div><h1 data-url="https://m.ctrip.com" class="moreLink">inner</h1></div>
`;

export { codeBlock };
```

## 功能实现

### target 和 currentTarget

在开始处理这个需求之前, 我们先确定一下事件处理器相关的两个概念, `event.target` 和 `event.currentTarget`.  其中 `target` 表示触发点击事件的元素, `currentTarget` 表示绑定了事件处理器的元素. 这样看来, 在我们的场景下, `target` 才是有意义的.

那么是不是直接针对 `target` 绑定点击事件就可以了呢? 实际情况并不是这样. 根据背景中给出的示例 html, 以下是对应的 DOM 元素和点击所输出的内容.

![log](./log.png)

生成的 DOM 元素

![dom](./html.png)

点击输出的内容

会发现, inner 的点击结果是我们所预期的, 但是 outer 的结果, 并不是. 令人难过的是, outer 的场景, 在实际情况下出现的概率很高. 因此我们不能简单地使用 `target` 来实现这个需求.

### 找到约定的目标元素

从以上例子中可以看出来, 通过 `.moreLink` 找到所有需要被绑定点击事件的元素(后面称之为 `.moreLink` 元素)之后, 我们要对比`.moreLink`元素与 `event.target` 的关系, 如果两者一致, 或者`.moreLink`元素是 `event.target` 的父元素, 那么我们就给这个 `.moreLink` 绑定上事件处理器.

接下来开始实现, 由于我们做的事情跟事件委托很相似, 因此我们把实现这部分功能的 hook 命名为: `useDelegateEvent` 

### useDelegateEvent

```jsx
import { useEffect, useRef } from "react";

const useDelegateEvent = (type, selector, handler) => {
  let ref = useRef();
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let handleEvent = event => {
      let targetNode = getTargetNode(element, event.target, selector);
      if (targetNode) handler(event, targetNode);
    };

    element.addEventListener(type, handleEvent, false);

    return () => {
      element.removeEventListener(type, handleEvent, false);
    };
  }, [type, selector, handler]);

  return ref;
};

export default useDelegateEvent;

const getTargetNode = (container, target, selector) => {
  let elemList = container.querySelectorAll(selector);
  let targetNode = Array.from(elemList).find(elem => {
    return isDescendant(elem, target);
  });
  return targetNode;
};

const isDescendant = (parent, child) => {
  if (parent === child) return true;
  let node = child.parentNode;
  while (node != null) {
    if (node === parent) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
};
```

`CustomCode` 组件:

```jsx
import React, { useMemo } from "react";
import useAttachScript from "../hooks/useAttachScript";
import useDelegateEvent from "../hooks/useDelegateEvent";
import { separateScript } from "../utils";

/**
 * 由于客户端渲染的情况下使用  dangerouslySetInnerHTML 渲染的 script 标签中的代码无法执行
 * 因此需要分离 html 与 script
 */

export default function CustomCode(props) {
  const { codeBlock } = props;

  let [scriptStrList, markup] = useMemo(() => {
    return separateScript(codeBlock);
  }, [codeBlock]);

  let eventType = "click";
  let selector = ".moreLink";

  let ref = useDelegateEvent(eventType, selector, (e, targetNode) => {
    
    let clickLinkHttp = targetNode.getAttribute("data-url");
    let clickLinkApp = targetNode.getAttribute("data-appurl");
    let clickLinkMiniProgram = targetNode.getAttribute("data-miniprogramurl");

    handleClick({
      clickLinkHttp,
      clickLinkApp,
      clickLinkMiniProgram
    });
  });

  useAttachScript(scriptStrList);

  return <div dangerouslySetInnerHTML={{ __html: markup }} ref={ref} />;
}

const handleClick = options => {
  // 针对多个链接区分平台的点击处理, 这里不展开
  console.log(options);
};
```

最终代码示例: [Github Repo](https://github.com/icyfish/react-app/blob/master/src/hooks/useDelegateEvent.js)

## 参考

- [What is the exact difference between currentTarget property and target property in javascript](https://stackoverflow.com/questions/10086427/what-is-the-exact-difference-between-currenttarget-property-and-target-property)
- [事件委托](https://zh.javascript.info/event-delegation)