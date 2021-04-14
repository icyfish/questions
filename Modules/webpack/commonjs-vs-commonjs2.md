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