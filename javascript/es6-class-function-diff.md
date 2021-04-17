<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  

- [如何区分 ES6 Class 和普通的函数](#%E5%A6%82%E4%BD%95%E5%8C%BA%E5%88%86-es6-class-%E5%92%8C%E6%99%AE%E9%80%9A%E7%9A%84%E5%87%BD%E6%95%B0)
  - [Reference](#reference)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# 如何区分 ES6 Class 和普通的函数

toString Representation Requirements:

> The string representation must have the syntax of a FunctionDeclaration, FunctionExpression, GeneratorDeclaration, GeneratorExpression, ClassDeclaration, ClassExpression, ArrowFunction, MethodDefinition, or GeneratorMethod depending upon the actual characteristics of the object.

```js
function isClass(func) {
  return typeof func === 'function' 
    && /^class\s/.test(Function.prototype.toString.call(func));
}
```

## Reference

- [How do you check the difference between an ECMAScript 6 class and function?](https://stackoverflow.com/questions/29093396/how-do-you-check-the-difference-between-an-ecmascript-6-class-and-function)
- [Spec - Function.prototype.toString()](https://262.ecma-international.org/6.0/#sec-function.prototype.tostring)