import { useEffect } from "react";

export default function useAttachScript(scriptStrList = []) {
  useEffect(() => {
    appendScriptList(scriptStrList);
  }, [scriptStrList]);
}

const appendScriptList = async (scriptList = []) => {
  if (scriptList.length === 0) return;
  await appendScript(scriptList[0]);
  await appendScriptList(scriptList.slice(1));
};

const appendScript = script => {
  return new Promise((resolve, reject) => {
    let scriptElem = createScript(script);
    let { attributes = {} } = scriptElem;
    let { src } = attributes;
    if (src) {
      scriptElem.onload = resolve;
      scriptElem.onerror = reject;
    } else {
      resolve();
    }
    document.head.appendChild(scriptElem);
  });
};

const cloneScript = sourceScript => {
  let script = document.createElement("script");

  Array.from(sourceScript.attributes).forEach(attr => {
    script.setAttribute(attr.name, attr.value);
  });

  script.innerHTML = sourceScript.innerHTML;

  return script;
};

const createScript = scriptMarkup => {
  let div = document.createElement("div");

  div.innerHTML = scriptMarkup;

  let script = cloneScript(div.firstElementChild);

  return script;
};
