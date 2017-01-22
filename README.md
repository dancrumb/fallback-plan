promise-fallback
================
[![NPM](https://nodei.co/npm/promise-fallback.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/promise-fallback/)

[![Code Climate](https://codeclimate.com/github/dancrumb/promise-fallback/badges/gpa.svg)](https://codeclimate.com/github/dancrumb/promise-fallback)
[![Test Coverage](https://codeclimate.com/github/dancrumb/promise-fallback/badges/coverage.svg)](https://codeclimate.com/github/dancrumb/promise-fallback/coverage)
[![Build Status](https://travis-ci.org/dancrumb/promise-fallback.svg?branch=master)](https://travis-ci.org/dancrumb/promise-fallback)
[![dependencies Status](https://david-dm.org/dancrumb/promise-fallback/status.svg)](https://david-dm.org/dancrumb/promise-fallback)

A Promise represents a value which may (or may not) be available now or in the future.

In general, such values are the result of an asynchronous process, either because they are being 
retrieved from an external source (like a web page or a hard drive) or because they are 
computationally intensive (and are done in a thread to avoid locking up the main event loop).

But you knew that already.

Sometimes, when you have a Promise and it is rejected, rather than resolved, you want to
have a fallback. Recently, I've come across two such use cases:

- Request resource A, if unavailable, try B, if unavailable, try C
- Request resource A, if unavailable, wait and try again. Repeat up to 3 times.

With ES2015 Promises:

```
getResource('A').then(useResource)
    .catch((e) => {
        return getResource('B');
    }).then(useResource)
    .catch((e) => {
            return getResource('C');
    }).then(useResource);
```

Now, you *could* construct this chain with

```
[
    (e) => { return getResource('B') },
    (e) => { return getResource('C') }
].reduce(chain, (errHandler) => {
    return chain.then(useResource).catch(errHandler);
}, getResource('A'));
```

Or, using `promise-fallback` you could construct it like this:
```
p.fallback([
    () => getResource('A'),
    () => getResource('B'),
    () => getResource('C')
]).then(useResource);
```

# Installation

```
npm i -S promise-fallback
```

# License
This module is provided under the [MIT License](MIT).

[MIT]: https://spdx.org/licenses/MIT