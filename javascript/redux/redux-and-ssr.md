<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Redux 与服务端渲染](#redux-%E4%B8%8E%E6%9C%8D%E5%8A%A1%E7%AB%AF%E6%B8%B2%E6%9F%93)
  - [服务端的 redux](#%E6%9C%8D%E5%8A%A1%E7%AB%AF%E7%9A%84-redux)
  - [准备工作](#%E5%87%86%E5%A4%87%E5%B7%A5%E4%BD%9C)
    - [安装依赖](#%E5%AE%89%E8%A3%85%E4%BE%9D%E8%B5%96)
  - [服务端](#%E6%9C%8D%E5%8A%A1%E7%AB%AF)
    - [处理请求](#%E5%A4%84%E7%90%86%E8%AF%B7%E6%B1%82)
    - [插入初始的组件 HTML 和 State](#%E6%8F%92%E5%85%A5%E5%88%9D%E5%A7%8B%E7%9A%84%E7%BB%84%E4%BB%B6-html-%E5%92%8C-state)
  - [客户端](#%E5%AE%A2%E6%88%B7%E7%AB%AF)
  - [准备初始状态](#%E5%87%86%E5%A4%87%E5%88%9D%E5%A7%8B%E7%8A%B6%E6%80%81)
    - [处理请求参数](#%E5%A4%84%E7%90%86%E8%AF%B7%E6%B1%82%E5%8F%82%E6%95%B0)
    - [异步获取状态](#%E5%BC%82%E6%AD%A5%E8%8E%B7%E5%8F%96%E7%8A%B6%E6%80%81)
    - [安全考虑](#%E5%AE%89%E5%85%A8%E8%80%83%E8%99%91)
  - [参考](#%E5%8F%82%E8%80%83)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Redux 与服务端渲染

## 服务端的 redux

使用 Redux 进行服务端渲染, 我们还必须将应用的状态在响应中一同返回, 只有这样, 客户端才可以消费这个初始状态. 这点十分重要, 因为如果我们在生成 HTML 之前预加载了这些数据, 客户端当然也需要读取这些数据. 否则, 客户端生成的 HTML 与服务端生成的 HTML 无法一致, 同时如果不传递初始状态 的话, 客户端就得重新请求一次数据, 而这完全没有必要.

那么如何把这些数据传递给客户端呢:

- 针对每一次请求, 都需要创建一个全新的 Redux store;
- 选择性地分发某些 action;
- 从 store 中提取出 state;
- 将 state 传给客户端;

这样的话, 在客户端就能够基于服务端传递的 state 初始化一个全新的 Redux store. Redux 在服务端**唯一**需要做的事情就是提供我们应用所需要的**初始状态** .

## 准备工作

在下面的例子中, 我们将开始学习如何设置服务端渲染, 会使用最简单的[计数器应用](https://github.com/reduxjs/redux/tree/master/examples/counter)作为我们的教程, 学习服务端是如何基于每一个请求提前渲染 state 的.

### 安装依赖

在本例中, 我们会使用 [Express](https://expressjs.com/) 来构建一个简单的 web 服务器. 与此同时, 还需要安装 React-Redux.

```shell
npm install express react-redux
```

## 服务端

我们的服务端代码大概是这样的. 我们将会设置一个 [Express 中间件](http://expressjs.com/en/guide/using-middleware.html), 使用 [app.use](http://expressjs.com/en/5x/api.html#app.use) 处理来自服务器的所有请求. 如果你对 Express 或者中间件的概念不太了解也没有关系, 只需要知道, 当每一次请求到达我们的服务器, `handleRender` 函数都会被调用.

除了以上两个依赖之外, 由于我们还使用了 ES6 和 JSX 语法, 因此必须用 [Babel](https://babeljs.io/) (想要了解详情见这个[例子](https://github.com/babel/example-node-server))以及处理 React 代码相关的一些 Babel 预置插件集([React preset](https://babeljs.io/docs/en/babel-preset-react/))

`server.js`

```js
import path from "path";
import Express from "express";
import React from "react";
import { createStore } from "redux";
import { Provider } from "react-redux";
import counterApp from "./reducers";
import App from "./containers/App";

const app = Express();
const port = 3000;

// 静态文件的处理
app.use("/static", Express.static("static"));

// 服务端接受任一请求, handleRender 就会被调用
app.use(handleRender);

// 在后续的章节中会实现这些方法的具体细节
function handleRender(req, res) {
  /* ... */
}
function renderFullPage(html, preloadedState) {
  /* ... */
}

app.listen(port);
```

### 处理请求

我们要做的第一件事情就是针对每一次请求, 都创建一个新的 Redux store 实例 (**也是服务端和客户端的最主要区别, 网页只需要满足一个用户需求, 但是服务器会接受到很多客户端请求**). 这个实例的唯一作用就是为我们的应用提供初始化状态.

渲染时, 我们会将根组件 `<App />` 包裹在一个 `<Provider>` 中, 使得所有在组件树中的组件都能够读取我们的 store, 就像在 ["Redux 基础": UI 与 React](https://redux.js.org/tutorials/fundamentals/part-5-ui-react) 中提到的一样.

服务端渲染最重要的步骤是: 在传送初始 HTML 给客户端之前, 我们需要先渲染这段 HTML, 针对这步, 我们用的是 [ReactDOMServer.renderToString()](https://reactjs.org/docs/react-dom-server.html#rendertostring) 方法.

然后我们再通过 `store.getState()` 从 Redux store 中获取初始状态. 在 `renderFullPage` 方法中, 我们能看到这是如何实现的.

```js
import { renderToString } from "react-dom/server";

function handleRender(req, res) {
  // 创建一个新的 Redux store 实例
  const store = createStore(counterApp);

  // 将组件转换成 HTML 字符串形式
  const html = renderToString(
    <Provider store={store}>
      <App />
    </Provider>
  );

  // 从 Redux store 中获取初始的 state
  const preloadedState = store.getState();

  // 将拼装好的 HTML 传给客户端
  res.send(renderFullPage(html, preloadedState));
}
```

### 插入初始的组件 HTML 和 State

服务端需要做的最后一步是将初始的 HTML 和初始状态插入已经准备好在客户端渲染的模板中. 为了传递 state, 我们会添加一个 `<script>` 标签, 并将 `preloadedState` 赋值给 `window.__PRELOADED_STATE__`.

在客户端就能通过 `window.__PRELOADED_STATE__` 读取到 `preloadedState`.

与此同时, 我们还会在渲染的 HTML 中添加一个 script 标签, 以添加构建工具打包的 JS 文件, 会在客户端执行. 这个 JS 在生产阶段是一个静态文件, 在开发阶段则会关联到我们的支持热重载的开发环境服务器.

```js
function renderFullPage(html, preloadedState) {
  return `
    <!doctype html>
    <html>
      <head>
        <title>Redux Universal Example</title>
      </head>
      <body>
        <div id="root">${html}</div>
        <script>
          // WARNING: See the following for security issues around embedding JSON in HTML:
          // https://redux.js.org/recipes/server-rendering/#security-considerations
          window.__PRELOADED_STATE__ = ${JSON.stringify(preloadedState).replace(
            /</g,
            "\\u003c"
          )}
        </script>
        <script src="/static/bundle.js"></script>
      </body>
    </html>
    `;
}
```

## 客户端

客户端所做的事情就很直观了. 从 `window.__PRELOADED_STATE__` 读取预加载状态, 将这个初始状态传到 `createStore()` 函数中, 作为客户端的初始状态.

现在来看看我们的客户端代码:

`client.js`

```js
import React from "react";
import { hydrate } from "react-dom";
import { createStore } from "redux";
import { Provider } from "react-redux";
import App from "./containers/App";
import counterApp from "./reducers";

// Grab the state from a global variable injected into the server-generated HTML
const preloadedState = window.__PRELOADED_STATE__;

// Allow the passed state to be garbage-collected
delete window.__PRELOADED_STATE__;

// Create Redux store with initial state
const store = createStore(counterApp, preloadedState);

hydrate(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
);
```

你可以选择自己喜欢的构建工具(Webpack, Browserify 等等)来将相关文件打包到 `static/bundle.js` 中.

当页面开始加载的时候, JS 文件也被加载并执行, [ReactDOM.hydrate()](https://reactjs.org/docs/react-dom.html#hydrate)(注水处理, 给 HTML 标签加上事件处理器. )方法会复用服务端喷出的 HTML, 关联客户端的 React 实例与服务端的虚拟 DOM. 这样的话, 我们在客户端和服务端的初始状态 就是一致的, 所有组件也都是在客户端和服务端复用, 因此最终的生成的真实 DOM 自然也是一致的.

至此, 服务端渲染的工作就已经完成了.

但是最终的结果还是比较粗糙. 它做的只是从动态代码中渲染出一个静态的视图. 接下来需要做的是构建一个支持动态初始状态 的应用, 这样, 它输出的视图也能够是动态的.

## 准备初始状态

客户端能够持续执行代码, 因此它能够接受一个空的初始状态, 然后在程序的执行过程或者用户的交互过程中不断获取它所需要的状态. 而在服务端, 渲染流程是同步的, 同时我们只有一次机会渲染我们的视图. 因此必须在请求的过程中, 就能够处理这个初始状态, 也就是需要及时处理输入或者是读取外部状态(比如说来自 API 请求或者是数据库的数据).

### 处理请求参数

对于服务端代码来说, 唯一的输入就是浏览器首次加载页面时发出的请求. 你可以选择在服务器启动的时机修改配置, 但是在这种情况下的配置并不是动态的.

发送给服务器的请求中包含了很多信息, 包括请求的 URL 信息, 包括 query 参数等, 这些参数信息对 [React Router](https://github.com/ReactTraining/react-router) 来说用处很大. 与此同时, 这次请求的请求头中还包含了 `cookie` (鉴权信息等), 以及一些请求体信息. 现在我们来看看如何利用 query 参数的信息来设置计数器应用的初始状态.

`server.js`

```js
import qs from "qs";
import { renderToString } from "react-dom/server";

function handleRender(req, res) {
  // 读取 query 中的参数作为计数器的初始值
  const params = qs.parse(req.query);
  const counter = parseInt(params.counter, 10) || 0;

  // 构造初始状态
  let preloadedState = { counter };

  // 根据初始状态创建一个 Redux store 实例
  const store = createStore(counterApp, preloadedState);

  // 将组件转换成 HTML 字符串以便之后渲染
  const html = renderToString(
    <Provider store={store}>
      <App />
    </Provider>
  );

  // 从 Redux store 中获取初始状态
  const finalState = store.getState();

  // 将处理好的完整 HTML 传送给客户端
  res.send(renderFullPage(html, finalState));
}
```

我们的代码是 Express 的 `Request` 对象中读取相关信息, 并经过服务端的中间件进行层层处理. 其中 query 参数从字符串被转换成了数字, 然后用以设置初始状态. 如果你在浏览器中访问[ http://localhost:3000/?counter=100](http://localhost:3000/?counter=100)会发现计数器的初始值为 100. 在所渲染的 HTML 中也会看到计数器输出的值是 100, 同时 `__PRELOADED_STATE__` 中也包含 动态的 `counter` 的值.

### 异步获取状态

服务端渲染过程中需要解决的一个最常见问题就是处理异步获取的状态. 在服务端, 渲染流程是原生同步的. 因此我们要做的是将所有异步请求转换成同步的操作.

最简单的方式是在同步的代码中传入回调函数. 在我们的场景下, 这个回调函数要做的就是引用响应对象, 然后将我们处理好的 HTML 结果传送给客户端. 别着急, 这部操作不像看起来那么难.

来看我们的例子, 我们会假设有一个外部数据源, 包含了计数器的初始值(计数器服务). 我们将伪造一些数据(假设来源是我们的计数器服务), 通过这部分数据来构造我们的初始状态. 下面开始构造 API 调用:

`api/counter.js`

```js
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

export function fetchCounter(callback) {
  setTimeout(() => {
    callback(getRandomInt(1, 100));
  }, 500);
}
```

重申一次, 这只是伪造的 API 调用数据, 我们会利用 `setTimeout` 来模拟网络请求, 响应时间为 500 毫秒(实际应用的响应时间肯定会快过它). 同时我们传入的回调函数会异步地返回任意一个数字. 如果你是用的是基于 `Promise` 的 API, 那么结果就要在 `then` 处理函数中返回.

在服务端, 我们简单地将当前的代码包装到 `fetchCounter` 函数中, 在回调函数中获取我们的结果:

`server.js`

```js
// Add this to our imports
import { fetchCounter } from "./api/counter";
import { renderToString } from "react-dom/server";

function handleRender(req, res) {
  // 异步调用我们的 mock API
  fetchCounter(apiResult => {
    // 从请求的 query 参数中读取初始的计数器值, 没有设置的话则默认为 0
    const params = qs.parse(req.query);
    const counter = parseInt(params.counter, 10) || apiResult || 0;

    // 构建初始状态
    let preloadedState = { counter };

    // 创建一个新的 Redux store 实例
    const store = createStore(counterApp, preloadedState);

    // 将组件转换为 HTML 字符串
    const html = renderToString(
      <Provider store={store}>
        <App />
      </Provider>
    );

    // 从 Redux store 中获取初始状态
    const finalState = store.getState();

    // 将处理好的完整 HTML 传送给客户端
    res.send(renderFullPage(html, finalState));
  });
}
```

因为我们在回调函数中调用了 `res.send()`, 服务器会始终保持这次链接, 直到回调函数执行之后才会发送相关数据. 对于每一个服务器请求, 我们都会发现有一个 500 毫秒的延迟. 在实际应用过程中, 我们还需要加上一些容错和超时处理.

### 安全考虑

我们的代码中加入了一些依赖用户输入生成的内容, 因此应用的安全风险也变大了. 特别需要防范的是 XSS 攻击和代码注入的风险.

在我们的例子中, 我们会采用一个比较原始的方式来保证安全性. 当我们从 URL 的 query 参数中获取所需要的计数值时, 我们使用了 `parseInt` 方法来处理这个参数, 确保转换之后的参数一定是数字. 如果不这样处理的话, 就很有可能在 HTML 中展示出有风险的数据, 比如用户给计数器赋值为 script 标签文本: `?counter=</script><script>doSomethingBad();</script>`

我们所构建的只是教学性质的简单应用, 因此将值转换成数字已经足够安全. 但是如果你是在生产环境中处理更加复杂的用户录入的话, 这样做是远远不够的, 在这种情况下, 可以用一个合适的过滤函数来处理, 比如[xss-filters](https://github.com/yahoo/xss-filters).

除此之外, 还可以再添加一层安全保护, `JSON.stringify` 很容易被脚本注入, 例如以下代码:

```json
{
  "user": {
    "username": "NodeSecurity",
    "bio": "as</script><script>alert('You have an XSS vulnerability!')</script>"
  }
}
```

为了避免这个问题, 我们需要采取一些措施混淆 JSON 字符串中包含的危险数据. 可以简单地加一个字符串替换, 比如: `JSON.stringify(state).replace(/</g, '\\u003c')`, 或者使用功能更完备的库: [serialize-javascript](https://github.com/yahoo/serialize-javascript).

## 参考

- [Redux 与服务端渲染](https://redux.js.org/recipes/server-rendering)
