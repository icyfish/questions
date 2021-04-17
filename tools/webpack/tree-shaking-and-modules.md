<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  

- [为什么 tree-shaking 的功能只有 ECMAScript modules 模块能够支持](#%E4%B8%BA%E4%BB%80%E4%B9%88-tree-shaking-%E7%9A%84%E5%8A%9F%E8%83%BD%E5%8F%AA%E6%9C%89-ecmascript-modules-%E6%A8%A1%E5%9D%97%E8%83%BD%E5%A4%9F%E6%94%AF%E6%8C%81)
  - [静态模块结构](#%E9%9D%99%E6%80%81%E6%A8%A1%E5%9D%97%E7%BB%93%E6%9E%84)
    - [静态模块结构使得我们在打包时可以移除无用代码](#%E9%9D%99%E6%80%81%E6%A8%A1%E5%9D%97%E7%BB%93%E6%9E%84%E4%BD%BF%E5%BE%97%E6%88%91%E4%BB%AC%E5%9C%A8%E6%89%93%E5%8C%85%E6%97%B6%E5%8F%AF%E4%BB%A5%E7%A7%BB%E9%99%A4%E6%97%A0%E7%94%A8%E4%BB%A3%E7%A0%81)
  - [Reference](#reference)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# 为什么 tree-shaking 的功能只有 ECMAScript modules 模块能够支持

## 静态模块结构

静态模块结构使得我们在编译阶段就能够确定需要导入和导出的内容, 只需要根据源码内容, 不需要执行代码.

ECMAScript 模块语法, 在定义语法规范时:

- 限制模块的导入/导出位置只能在文件的顶部.
- 不可以将导入/导出的声明嵌套在条件语句中.
- 导入/导出的模块名只能是字符串常量.

以上三个特性, 确保了 ES 模块是静态的结构.

而 CommonJS 模块不是静态的, 只有当代码执行了, 才能够知道被导入和导出的模块是什么.

```js
var my_lib;
if (Math.random()) {
    my_lib = require('foo');
} else {
    my_lib = require('bar');
}

if (Math.random()) {
    exports.baz = ···;
}
```

### 静态模块结构使得我们在打包时可以移除无用代码

在前端开发中, 模块经常是这样被处理的:

- 开发阶段, 代码经常以多个小模块的形式存在.
- 发布阶段, 这些模块又被合并打包为一个较大的文件.

需要执行打包的原因如下:

1. 打包之后, 只需要读取少量的文件, 就能够加载所有的模块.
1. 压缩一个打包后的文件比压缩多个文件的效率更高.
1. 在打包时, 没有被使用的导出模块会被移除, 也对性能有极大的优化.

在 HTTP/1 规范下, 第1个原因十分重要, 因为请求一个文件的成本很高. 不过在 HTTP/2 规范下, 情况又不一样了. 

第3个原因自始至终都十分吸引人. 只有静态模块结构才能够帮助我们实现第3点.

## Reference

- [静态模块结构](https://exploringjs.com/es6/ch_modules.html#static-module-structure)