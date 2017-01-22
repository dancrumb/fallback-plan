require('babel-polyfill');

const isFunction = val => (typeof val === 'function');
const isPromise = val => (val.then && isFunction(val.then));

function fallbackWrapper(generator) {
  const iterator = generator();

  // eslint-disable-next-line no-use-before-define
  const loopNext = val => handleReturned(iterator.next(val));
  // eslint-disable-next-line no-use-before-define
  const loopError = val => handleReturned(iterator.throw(val));

  function handleReturned(returned) {
    if (!returned.done) {
      try {
        const value = isFunction(returned.value) ? returned.value() : returned.value;

        if (isPromise(value)) {
          value.then(loopNext, loopError);
        } else {
          process.nextTick(() => {
            loopNext(value);
          });
        }
      } catch (e) {
        loopError(e);
      }
    }
  }

  loopNext();
}

function fallback(fpList) {
  return new Promise((resolve, reject) => {
    fallbackWrapper(function* g() {
      let finalError;
      // eslint-disable-next-line no-restricted-syntax
      for (const fp of fpList) {
        try {
          return resolve(yield fp);
        } catch (e) {
          finalError = e;
        }
      }
      return reject(finalError);
    });
  });
}

const sourceGenerator = function* sourceGenerator(val, times) {
  let countdown = times;
  const infinite = times === 0;
  while (infinite || countdown > 0) {
    yield val;
    countdown -= 1;
  }
};

module.exports = {
  fallback,

  retry(fp, times) {
    return fallback(sourceGenerator(fp, times));
  },
};
