require('babel-polyfill');

const isFunction = val => (typeof val === 'function');
const isPromise = val => (val.then && isFunction(val.then));

function wrapper(generator) {
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

function fallback(sources) {
  return new Promise((resolve, reject) => {
    wrapper(function* g() {
      let lastError;
      // eslint-disable-next-line no-restricted-syntax
      for (const source of sources) {
        try {
          return resolve(yield source);
        } catch (e) {
          lastError = e;
        }
      }
      return reject(lastError);
    });
  });
}

const sourceReplicator = function* sourceGenerator(val, times) {
  let countdown = times;
  const infinite = times === 0;
  while (infinite || countdown > 0) {
    yield val;
    countdown -= 1;
  }
};

const cycleGenerator = function* cycleGenerator(parameters, func) {
  for (let i = 0; i < parameters.length; i += 1) {
    yield func(...parameters[i]);
  }
};

module.exports = {
  fallback,

  retry(source, times = 0) {
    return fallback(sourceReplicator(source, times));
  },

  cycle(parameters, func) {
    return fallback(cycleGenerator(parameters, func));
  },
};
