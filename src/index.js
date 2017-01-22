require('babel-polyfill');

function isPromise(val) {
  return val.then && (typeof val.then === 'function');
}

function fallbackWrapper(generator) {
  const iterator = generator();

  function loopNext(val) {
    const returned = iterator.next(val);
    handleReturned(returned);
  }

  function loopError(e) {
    const returned = iterator.throw(e);
    handleReturned(returned);
  }

  function handleReturned(returned) {
    if (!returned.done) {
      if (isPromise(returned.value)) {
        returned.value.then(loopNext, loopError);
      } else {
        process.nextTick(() => {
          loopNext(returned.value);
        });
      }
    }
  }

  loopNext();
}

function fallback(fpList, Promise) {
  return new Promise((resolve, reject) => {
    fallbackWrapper(function* g() {
      let finalError;
      for (const fp of fpList) {
        try {
          const result = yield fp();
          return resolve(result);
        } catch (e) {
          finalError = e;
        }
      }
      reject(finalError);
    });
  });
}

module.exports = {
  fallback,

  retry(fp, times, Promise) {
    let countdown = times;
    const gen = function* () {
      while (times >= 0) {
        yield fp;
        countdown -= 1;
        if (times === 0) {
          return;
        }
        if (times < 0) {
          countdown = 0;
        }
      }
    };

    return fallback(gen(), Promise);
  },
};
