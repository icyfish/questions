// JavaScript专题之跟着underscore学防抖
// https://github.com/mqyqingfeng/Blog/issues/22

let count = 1;
const container = document.getElementById("container");
const cancel = document.getElementById("cancel");

function debounce(func, wait, immediate) {
  let timeout;
  let result;

  function later(args) {
    if (timeout) clearTimeout(timeout);
    if (immediate) {
      // 第一次立刻执行, 后续隔一段时间之后才触发
      let callNow = !timeout;
      timeout = setTimeout(() => {
        timeout = null;
      }, wait);
      if (callNow) result = func.call(this, args);
    } else {
      // 每次触发之后都等一段时间再执行
      timeout = setTimeout(() => {
        // 异步操作 返回函数值没有意义, 因此不返回
        func.call(this, args);
      }, wait);
    }
    return result;
  }
  later.cancel = () => {
    if (!timeout) return;
    clearTimeout(timeout);
    timeout = null;
  };
  return later;
}

function getUserAction() {
  container.innerHTML = count++;
}

const setUserAction = debounce(getUserAction, 1000, true);
container.onmousemove = setUserAction;
cancel.onclick = setUserAction.cancel;
