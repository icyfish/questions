// import "./styles.css";

// document.getElementById("app").innerHTML = `<h1>Hello </h1>`;

const target = {
  thisValEqualsProxy() {
    return this === proxy;
  }
};

const proxy = new Proxy(target, {});
// const proxy = new Proxy(target, {});

console.log(target.thisValEqualsProxy());
console.log(proxy.thisValEqualsProxy());
