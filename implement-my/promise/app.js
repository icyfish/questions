// application code

class Thenable {
  constructor(num) {
    this.num = num;
  }
  then(resolve, reject) {
    console.log(resolve); // function() { native code }
    // resolve with this.num*2 after the 1 second
    setTimeout(() => resolve(this.num * 2), 1000); // (**)
  }
}

new MyPromise(resolve => resolve(1))
  .then(result => {
    console.log(result, "after normal");
    return new Thenable(result); // (*)
  })
  .then(result => {
    return new MyPromise((resolve, reject) => {
      console.log(result, "after thenable");
      setTimeout(() => resolve(result * 2), 1000);
    });
  })
  .then(result => {
    console.log(result, "after promise");
    return result * 2;
  });
