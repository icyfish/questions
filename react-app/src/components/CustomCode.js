import React, { useMemo } from "react";
import useAttachScript from "../hooks/useAttachScript";
import useDelegateEvent from "../hooks/useDelegateEvent";
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

  let eventType = "click";
  let selector = ".moreLink";

  let ref = useDelegateEvent(eventType, selector, (e, targetNode) => {
    
    let clickLinkHttp = targetNode.getAttribute("data-url");
    let clickLinkApp = targetNode.getAttribute("data-appurl");
    let clickLinkMiniProgram = targetNode.getAttribute("data-miniprogramurl");

    handleClick({
      clickLinkHttp,
      clickLinkApp,
      clickLinkMiniProgram
    });
  });

  useAttachScript(scriptStrList);

  return <div dangerouslySetInnerHTML={{ __html: markup }} ref={ref} />;
}

const handleClick = options => {
  // 针对多个链接区分平台的点击处理, 这里不展开
  console.log(options);
};
