# Code Splitting 在生产项目中的应用

## 修改 entry 配置

针对包含多组件的 UI 组件库, 区分入口, 打包为不同的文件, 使用方通过 npm 包路径的方式引入对应的 UI 组件. 

**在项目中引入 UI 组件:**

```js
// 引入组件
import SideWidgets from "YourUILib/dist/desktop/SideWidgets/index";
// 引入样式组件
import SideWidgetsStyle from "YourUILib/dist/desktop/SideWidgets/style";
```

**webpack 配置:**
```js 
// webpack.prod.config.js 
const merge = require("webpack-merge");
const baseConfig = require("./webpack.common.config.js");
const buildMap = require("./buildMap.json");
const BUILD_TARGET_PATH = path.resolve(__dirname, "../dist");

module.exports = merge(baseConfig, {
  entry: buildMap,
  output: {
    path: BUILD_TARGET_PATH,
    filename: "[name].js",
    libraryTarget: "commonjs2"
  },
  // ... other configurations
});
```
```json
// buildMap.json
{
  "mobile/common/style": "./src/components/common/CommonMobileStyle.tsx",
  "desktop/SideWidgets/index": "./src/components/desktop/SideWidgets/index.tsx",
  "desktop/SideWidgets/style": "./src/components/desktop/SideWidgets/style.tsx",
  "desktop/CouponWithPromoCode/index": "./src/components/desktop/CouponWithPromoCode/index.tsx",
  "desktop/CouponWithPromoCode/style": "./src/components/desktop/CouponWithPromoCode/style.tsx",
  "mobile/CouponWithPromoCode/index": "./src/components/mobile/CouponWithPromoCode/index.tsx",
  "mobile/CouponWithPromoCode/style": "./src/components/mobile/CouponWithPromoCode/style.tsx",
  // ...
}
```

## 使用 SplitChunksPlugin 拆分文件

```js
module.exports = {
  //...
  optimization: {
    splitChunks: {
      cacheGroups: {
        xxxStyle: {
          // 处理样式文件的拆分
          name: "xxxStyle",
          test: (mod, chunks) => {
            return (
              mod.context.includes("xxx") &&
              mod.constructor.name === "CssModule"
            );
          },
          chunks: "all" // 从所有类型的 chunks 中提取相关代码
        },
        SideWidgets: {
          name: "SideWidgets",
          test(mod, chunks) {
            const regex = /YourUILib(\/|\\)dist(\/|\\)desktop(\/|\\)SideWidgets/;
            return mod.context.match(regex);
          },
          chunks: "all"
        }
      }
    }
  }
};

```

## Dynamic Imports 


## Reference

- [Code Splitting](https://webpack.js.org/guides/code-splitting/)