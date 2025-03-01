/**
 * @param {Function} func
 * @param {number} wait
 * @return {Function}
 */
function debounce(func, wait = 0) {
  let timeoutID = null;
  return function (...args) {
    // Keep a reference to `this` so that
    // func.apply() can access it.
    const context = this;
    clearTimeout(timeoutID);

    timeoutID = setTimeout(function () {
      timeoutID = null; // Not strictly necessary but good to do this.
      func.apply(context, args);
    }, wait);
  };
}

const debouncedA = debounce(() => console.log('debounced', 1000));

debouncedA();
// timeoutID = null
// timeoutID = 1



debouncedA();
// 

const debouncedB = debounce(() => console.log('debounced', 1000));



