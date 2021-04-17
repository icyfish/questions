<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  

- [Node.js 中 exports 和 module.exports 的区别](#nodejs-%E4%B8%AD-exports-%E5%92%8C-moduleexports-%E7%9A%84%E5%8C%BA%E5%88%AB)
  - [Reference](#reference)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Node.js 中 exports 和 module.exports 的区别

```js
// app.js
console.log(module);
```

```shell
node app.js
```

```js
Module {
  id: '.',
  path: '/Users/fish/Github/blog/nodejs/exports',
  exports: {},
  filename: '/Users/fish/Github/blog/nodejs/exports/app.js',
  loaded: false,
  children: [],
  paths: [
    '/Users/fish/Github/blog/nodejs/exports/node_modules',
    '/Users/fish/Github/blog/nodejs/node_modules',
    '/Users/fish/Github/questions/node_modules',
    '/Users/fish/Github/node_modules',
    '/Users/fish/node_modules',
    '/Users/node_modules',
    '/node_modules'
  ]
}
```

```js
// app.js
exports.a = "A";
console.log(module);
```

```js
Module {
  id: '.',
  path: '/Users/fish/Github/blog/nodejs/exports',
  exports: { a: 'A' },
  filename: '/Users/fish/Github/blog/nodejs/exports/app.js',
  loaded: false,
  children: [],
  paths: //...
}
```

从以上代码可以看出, `exports` 是 `module.exports` 的引用:

```js
// app.js
exports.a = "A";
console.log(exports === module.exports); // true
console.log(module.exports); // { a: 'A' }
```

不过情况并非始终是这样, 当我们对 `module.exports` 赋值时, 这个引用关系立刻会失效.

```js
module.exports = { a: "A" };
exports.b = "B";
console.log(exports === module.exports);
console.log(module);
```

```js
false
Module {
  id: '.',
  path: '/Users/fish/Github/blog/nodejs/exports',
  exports: { a: 'A' },
  filename: '/Users/fish/Github/blog/nodejs/exports/app.js',
  loaded: false,
  children: [],
  paths: //...
}
```

`exports` 是引用 `module.exports` 的快捷方式, 但是不要太依赖它!


## Reference

- [Node.js: exports vs module.exports](https://www.hacksparrow.com/nodejs/exports-vs-module-exports.html)