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