// https://mp.weixin.qq.com/s?__biz=MzA4Njc2MTE3Ng==&mid=2456151398&idx=1&sn=c3351d6c9eb166035f2fa97a1b0b3a0a&chksm=88528ed1bf2507c797c05a4423bbc53e6e450c05d3da6bc6ad1825487712c156903891890c7c&token=1869489865&lang=zh_CN&scene=21#wechat_redirect

const isFunction = obj => typeof obj === "function";
const isObject = obj => !!(obj && typeof obj === "object");
const isThenable = obj => (isFunction(obj) || isObject(obj)) && "then" in obj;
const isPromise = promise => promise instanceof Promise;

const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

function Promise(f) {
  this.result = null;
  this.state = PENDING;
  this.callbacks = [];

  let onFulfilled = value => transition(this, FULFILLED, value);
  let onRejected = reason => transition(this, REJECTED, reason);

  let ignore = false;
  let resolve = value => {
    if (ignore) return;
    ignore = true;
    resolvePromise(this, value, onFulfilled, onRejected);
  };
  let reject = reason => {
    if (ignore) return;
    ignore = true;
    onRejected(reason);
  };

  try {
    f(resolve, reject);
  } catch (error) {
    reject(error);
  }
}

Promise.prototype.then = function (onFulfilled, onRejected) {
  return new Promise((resolve, reject) => {
    let callback = { onFulfilled, onRejected, resolve, reject };
    console.log(this);
    if (this.state === PENDING) {
      this.callbacks.push(callback);
    } else {
      setTimeout(() => handleCallback(callback, this.state, this.result), 0);
    }
  });
};

const handleCallback = (callback, state, result) => {
  let { onFulfilled, onRejected, resolve, reject } = callback;
  try {
    if (state === FULFILLED) {
      isFunction(onFulfilled) ? resolve(onFulfilled(result)) : resolve(result);
    } else if (state === REJECTED) {
      isFunction(onRejected) ? resolve(onRejected(result)) : reject(result);
    }
  } catch (error) {
    reject(error);
  }
};

const handleCallbacks = (callbacks, state, result) => {
  while (callbacks.length) handleCallback(callbacks.shift(), state, result);
};

const transition = (promise, state, result) => {
  if (promise.state !== PENDING) return;
  promise.state = state;
  promise.result = result;
  setTimeout(() => handleCallbacks(promise.callbacks, state, result), 0);
};

const resolvePromise = (promise, result, resolve, reject) => {
  if (result === promise) {
    let reason = new TypeError("Can not fufill promise with itself");
    return reject(reason);
  }

  if (isPromise(result)) {
    return result.then(resolve, reject);
  }

  if (isThenable(result)) {
    try {
      let then = result.then;
      if (isFunction(then)) {
        return new Promise(then.bind(result)).then(resolve, reject);
      }
    } catch (error) {
      return reject(error);
    }
  }

  resolve(result);
};
