// 100 行代码实现 Promises/A+ 规范
// https://mp.weixin.qq.com/s?__biz=MzA4Njc2MTE3Ng==&mid=2456151398&idx=1&sn=c3351d6c9eb166035f2fa97a1b0b3a0a&chksm=88528ed1bf2507c797c05a4423bbc53e6e450c05d3da6bc6ad1825487712c156903891890c7c&token=1869489865&lang=zh_CN&scene=21#wechat_redirect

const isFunction = obj => typeof obj === "function";
const isObject = obj => typeof obj === "object" && obj !== null;
const isThenable = obj => (isFunction(obj) || isObject(obj)) && "then" in obj;
const isPromise = promise => promise instanceof MyPromise;

const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

function MyPromise(callbackFunc) {
  this.state = PENDING;
  this.result = null;
  this.callbacks = [];

  let onFulfilled = value => transition(this, FULFILLED, value);
  let onRejected = reason => transition(this, REJECTED, reason);

  const resolveAbnormalValue = value => {
    if (isPromise(value)) {
      return value.then(onFulfilled, onRejected);
    }
    if (isThenable(value)) {
      return new MyPromise(() => value.then(onFulfilled, onRejected));
    }
    onFulfilled(value);
  };

  let ignore = false;
  const resolve = value => {
    if (ignore) return;
    ignore = true;
    resolveAbnormalValue(value);
  };
  const reject = reason => {
    if (ignore) return;
    ignore = true;
    onRejected(reason);
  };
  callbackFunc(resolve, reject);
}

MyPromise.prototype.then = function (onFulfilled, onRejected) {
  return new MyPromise((resolve, reject) => {
    let callback = { onFulfilled, onRejected, resolve, reject };
    if (this.state === PENDING) {
      this.callbacks.push(callback);
    } else {
      setTimeout(() => handleCallback(callback, this.state, this.result), 0);
    }
  });
};

const transition = (promise, state, result) => {
  if (state === PENDING) return;
  promise.state = state;
  promise.result = result;
  const callbacks = promise.callbacks;
  if (callbacks.length === 0) return;
  setTimeout(() => {
    handleCallback(callbacks.shift(), state, result);
  }, 0);
};

const handleCallback = (callback, state, result) => {
  const { onFulfilled, onRejected, resolve, reject } = callback;
  if (state === FULFILLED) {
    isFunction(onFulfilled) ? resolve(onFulfilled(result)) : resolve(result);
  } else if (state === REJECTED) {
    isFunction(onRejected) ? resolve(onRejected(result)) : reject(result);
  }
};
