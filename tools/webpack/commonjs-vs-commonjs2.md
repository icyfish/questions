<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  

- [libraryTarget 这个配置中的 commonjs 和 commonjs2 有什么区别](#librarytarget-%E8%BF%99%E4%B8%AA%E9%85%8D%E7%BD%AE%E4%B8%AD%E7%9A%84-commonjs-%E5%92%8C-commonjs2-%E6%9C%89%E4%BB%80%E4%B9%88%E5%8C%BA%E5%88%AB)
  - [CommonJS 是什么](#commonjs-%E6%98%AF%E4%BB%80%E4%B9%88)
    - [CommonJS 模块规范](#commonjs-%E6%A8%A1%E5%9D%97%E8%A7%84%E8%8C%83)
    - [AMD (Asynchronous Module Definition) 模块规范](#amd-asynchronous-module-definition-%E6%A8%A1%E5%9D%97%E8%A7%84%E8%8C%83)
  - [题目问题解答](#%E9%A2%98%E7%9B%AE%E9%97%AE%E9%A2%98%E8%A7%A3%E7%AD%94)
  - [Reference](#reference)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# libraryTarget 这个配置中的 commonjs 和 commonjs2 有什么区别

## CommonJS 是什么

CommonJS 是一类模块规范, ES6之前, JavaScript 语言本身并不支持模块系统, 因此社区发展出了一些模块规范, 在 ECMAScript 5 模块系统中, 最突出的是 **CommonJS** 和 **AMD** 模块规范.

### CommonJS 模块规范

示例:

```js
var importedFunc1 = require('./other-module1.js').importedFunc1;
var importedFunc2 = require('./other-module2.js').importedFunc2;

// Body
function internalFunc() {
  // ···
}
function exportedFunc() {
  importedFunc1();
  importedFunc2();
  internalFunc();
}

// Exports
module.exports = {
  exportedFunc: exportedFunc,
};
```
主要特点:

- 语法精简
- 专为同步加载与服务器设计

**NodeJS 的内置模块是基于 CommonJS 模块规范实现的, 它在此基础上多实现了一些功能.**

### AMD (Asynchronous Module Definition) 模块规范

示例:

```js
define(['./other-module1.js', './other-module2.js'],
  function (otherModule1, otherModule2) {
    var importedFunc1 = otherModule1.importedFunc1;
    var importedFunc2 = otherModule2.importedFunc2;

    function internalFunc() {
      // ···
    }
    function exportedFunc() {
      importedFunc1();
      importedFunc2();
      internalFunc();
    }
    
    return {
      exportedFunc: exportedFunc,
    };
  });
```
主要特点:

- 语法稍复杂, 使得 AMD 有能力不依赖 `eval()` 语法或是编译步骤即可进行使用.
- 专为异步加载与浏览器设计

基于AMD模块规范所实现的库中, 最出名的是 [RequireJS](https://requirejs.org/)

## 题目问题解答

当 `libraryTarget` 值为 `commonjs` 时, 输出的内容完全依照 commonjs 规范.
而当值为 `commonjs2` 时, 输出的内容依照 NodeJS 模块规范. 为什么叫 commonjs2, 从本文的第一部分中就能找到答案了

## Reference

- [What is commonjs2](https://github.com/webpack/webpack/issues/1114)
- [ECMAScript 5 module systems](https://exploringjs.com/es6/ch_modules.html#_ecmascript-5-module-systems)