/**
 * 分离出script标签和html/css内容
 */
export function separateScript(codeBlock = "") {
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
  const result = codeBlock.replace(scriptRe, "</script");
  return result;
}
