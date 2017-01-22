require('babel-polyfill');

const isFunction = val => (typeof val === 'function');
const isPromise = val => (val.then && isFunction(val.then));

function fallbackWrapper(generator) {
  const iterator = generator();

  function handleReturned(returned) {
    if (!returned.done) {
      let value = returned.value;
      if (isFunction(value)) {
        value = returned.value();
      }

      if (isPromise(value)) {
        // eslint-disable-next-line no-use-before-define
        value.then(loopNext, loopError);
      } else {
        process.nextTick(() => {
          // eslint-disable-next-line no-use-before-define
          loopNext(value);
        });
      }
    }
  }

  function loopNext(val) {
    const returned = iterator.next(val);
    handleReturned(returned);
  }

  function loopError(e) {
    const returned = iterator.throw(e);
    handleReturned(returned);
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

const fpListGenerator = function* fpListGenerator(func, countdownStart) {
  let countdown = countdownStart;
  while (countdown >= 0) {
    yield func;
    countdown -= 1;
    if (countdown === 0) {
      return;
    }
    if (countdown < 0) {
      countdown = 0;
    }
  }
};

module.exports = {
  fallback,

  retry(fp, times) {
    return fallback(fpListGenerator(fp, times));
  },
};
