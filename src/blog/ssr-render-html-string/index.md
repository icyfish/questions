---
title: React 同构渲染 html 字符串
date: "2021-04-19"
template: "post"
draft: false
category: "JavaScript"
tags:
  - "React"
  - "SSR"
description: "Render HTML string in React Components both for Server and Client Rendering"
---

## 问题背景

看到这个问题, 大家可能会觉得很诧异, 不是直接用 `dangerouslySetInnerHTML` 就能实现了吗? 但是实际情况并没有那么简单. 

首先介绍我们的技术框架, 项目使用了 [react-imvc](https://github.com/Lucifier129/react-imvc) 实现页面的同构渲染.

针对标题的需求, 我们会实现一个 React 组件, 接受接口下发的 html 字符串(见下, &lt 是因为内容被框架处理过), 渲染出对应的内容.

```jsx
const codeBlock = `
<script
  src="https://code.jquery.com/jquery-3.6.0.min.js">&lt/script>
<script>
console.log($);
&lt/script>
<script>
console.log(222);
&lt/script>
<h1>123</h1>`;
```

但是在实现的过程中发现一个问题, 由于我们的页面是同构渲染的, React 组件需要同时支持服务端渲染和客户端渲染. 

在服务端渲染的场景下, 简单地 `dangerouslySetInnerHTML` 能够直接满足我们的需求. **但是在客户端渲染的情况下, 我们发现 `script` 标签中的内容并没有执行**. 那么如何解决这个问题呢?

## 解决问题

### 分离 html 中 script 标签与其他标签

JavaScript 代码没有执行的原因是[规范不允许](https://stackoverflow.com/questions/13390588/script-tag-create-with-innerhtml-of-a-div-doesnt-work/13392818#13392818)在 `innerHTML` 中插入 `script` 标签, 即使 DOM 元素中可以查看到, 代码的内容也不会执行.

因此我们要在代码中针对 `script` 标签和其他标签做出分离的处理:

```jsx
/**
 * 分离出script标签和其他标签内容
 */
export function separateScript(codeBlock = "") {
	// 针对 react-imvc 框架, 需要做这样的处理.
  codeBlock = formatScript(codeBlock);

  let re = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
  let match;
  let scriptStrList = [];
  let contentWithoutScript = codeBlock.replace(re, "");

  while ((match = re.exec(codeBlock))) {
    scriptStrList.push(match[0]);
  }

  return [scriptStrList, contentWithoutScript];
}

/**
 * 服务端渲染时 框架的 Script 组件 https://github.com/Lucifier129/react-imvc/blob/master/component/Script.js
 * 把 </script 转成了 &lt/script, 把它转回来
 */
export function formatScript(codeBlock = "") {
  let scriptRe = /&lt\/script/g;
  return codeBlock.replace(scriptRe, "</script"); 
}
```

经过处理之后, 我们会得到类似以下形式的 `scriptStrList` 

```jsx
const scriptStrList = [
  '<script\n  src="https://code.jquery.com/jquery-3.6.0.min.js"></script>',
  "<script>\nconsole.log($);\n</script>",
  "<script>\nconsole.log(222);\n</script>"
];
```

我们的 React 组件, 会是这样的:

```jsx
import React, { useMemo } from "react";
import useAttachScript from "../hooks/useAttachScript";
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

  useAttachScript(scriptStrList);

  return <div dangerouslySetInnerHTML={{ __html: markup }} ref={ref} />;
}
// 使用: codeBlock 就是问题背景中列出的 codeBlock
// <CustomCode codeBlock={codeBlock} />
```

### 手动构造 script 节点

可以从组件代码中看到这样一个 hook: `useAttachScript` . 现在我们开始实现这个 hook, 它做的事情是: 处理 `scriptStrList` 然后用 `appendChild` 的形式插入我们的 `script` 标签:

```jsx
import { useEffect } from "react";

export default function useAttachScript(scriptStrList = []) {
  useEffect(() => {
    if (scriptStrList.length === 0) return;
    appendScriptList(scriptStrList.join());
  }, [scriptStrList]);
}

const appendScriptList = scriptMarkup => {
  const scriptHTMLCollection = getScriptHTMLCollection(scriptMarkup);
  // 获取 div 中的 script 标签列表, scriptHTMLCollection 的类型为 HTMLCollection, 而不是 NodeList
  // 因此实现一个 cloneScript 方法进行转换
  const scriptNodeList = [...scriptHTMLCollection].map(str => cloneScript(str)); 
	scriptNodeList.forEach(script => {
    document.head.appendChild(script);
  });
};

const getScriptHTMLCollection = scriptMarkup => {
  // 手动创建一个 div 用以获取 script 标签
  let divElem = document.createElement("div");
  divElem.innerHTML = scriptMarkup;
  return divElem.getElementsByTagName("script")
};

const cloneScript = sourceScript => {
  let script = document.createElement("script");

  Array.from(sourceScript.attributes).forEach(attr => {
    script.setAttribute(attr.name, attr.value);
  });

  script.innerHTML = sourceScript.innerHTML;

  return script;
};
```

以上的代码看似已经没有大问题了, 但是对于最开始的 html 字符串示例, 我们发现了一个问题: 有可能抛出 `$ is not defined` 的错误, 虽然是代码本身的问题, 但我们还是希望再做出一些优化.

### 确保各个标签按照先后顺序执行

由于我们的业务场景限制, 接口下发的 html 内容可能是运营人员或者产品经理所编写的. 所以我们在实现时要尽可能地避免代码出错, 在程序层面确保各个标签按照先后顺序执行.

`useAttachScript` 是在组件渲染完之后执行的, 因此不必担心我们的处理影响页面主要部分的渲染.

那么开始优化 `useAttachScript` :

```jsx
import { useEffect } from "react";

export default function useAttachScript(scriptStrList = []) {
  useEffect(() => {
    if (scriptStrList.length === 0) return;
    appendScriptList(scriptStrList.join());
  }, [scriptStrList]);
}

const appendScriptList = async scriptMarkup => {
  const scriptHTMLCollection = getScriptHTMLCollection(scriptMarkup);
  // 获取 div 中的 script 标签列表, scriptHTMLCollection 的类型为 HTMLCollection, 而不是 NodeList
  // 因此实现一个 cloneScript 方法进行转换
  const scriptNodeList = [...scriptHTMLCollection].map(str => cloneScript(str));
  // 将 forEach 改造成 for of, 因为 forEach 中不支持 async/await
  for (const scriptElem of scriptNodeList) {
    await appendScript(scriptElem);
  }
};

const appendScript = scriptElem => {
  return new Promise((resolve, reject) => {
    let { attributes = {} } = scriptElem;
    let { src } = attributes;
    if (src) {
      // 如果有需要加载的外部脚本, 等加载完成之后再插入下一个脚本
      scriptElem.onload = resolve;
      scriptElem.onerror = reject;
    } else {
			// 否则直接插入
      resolve();
    }
    document.head.appendChild(scriptElem);
  });
};

const getScriptHTMLCollection = scriptMarkup => {
  // 手动创建一个 div 用以获取 script 标签
  let divElem = document.createElement("div");
  divElem.innerHTML = scriptMarkup;
  return divElem.getElementsByTagName("script");
};

const cloneScript = sourceScript => {
  let script = document.createElement("script");

  Array.from(sourceScript.attributes).forEach(attr => {
    script.setAttribute(attr.name, attr.value);
  });

  script.innerHTML = sourceScript.innerHTML;

  return script;
};
```

至此, 我们的 React 组件就能够同时支持服务端和客户端渲染了.

最终代码示例: [Github Repo](https://github.com/icyfish/react-app/blob/master/src/components/CustomCode.js)

## 参考

- [script tag create with innerHTML of a div doesn't work](https://stackoverflow.com/questions/13390588/script-tag-create-with-innerhtml-of-a-div-doesnt-work/13392818#13392818)
- [ES6 In Depth: Iterators and the for-of loop](https://hacks.mozilla.org/2015/04/es6-in-depth-iterators-and-the-for-of-loop/)