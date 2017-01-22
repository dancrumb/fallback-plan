require('babel-polyfill');

function isPromise(val) {
  return val.then && (typeof val.then === 'function');
}

function fallbackWrapper(generator) {
  const iterator = generator();

  function handleReturned(returned) {
    if (!returned.done) {
      if (isPromise(returned.value)) {
        // eslint-disable-next-line no-use-before-define
        returned.value.then(loopNext, loopError);
      } else {
        process.nextTick(() => {
          // eslint-disable-next-line no-use-before-define
          loopNext(returned.value);
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
          const result = yield fp();
          return resolve(result);
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
