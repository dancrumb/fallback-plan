graceful-degrade
================
[![NPM](https://nodei.co/npm/graceful-degrade.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/graceful-degrade/)

[![Code Climate](https://codeclimate.com/github/dancrumb/graceful-degrade/badges/gpa.svg)](https://codeclimate.com/github/dancrumb/graceful-degrade)
[![Test Coverage](https://codeclimate.com/github/dancrumb/graceful-degrade/badges/coverage.svg)](https://codeclimate.com/github/dancrumb/graceful-degrade/coverage)
[![Build Status](https://travis-ci.org/dancrumb/graceful-degrade.svg?branch=master)](https://travis-ci.org/dancrumb/graceful-degrade)
[![dependencies Status](https://david-dm.org/dancrumb/graceful-degrade/status.svg)](https://david-dm.org/dancrumb/graceful-degrade)

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
getResource('A')
    .catch(() => getResource('B'))
    .catch(() => getResource('C'))
    .then(useResource);
```

That's fine, but it's statically defined... let's do better.

You *could* construct this chain with

```
[
    () => getResource('A'),
    () => getResource('B'),
    () => getResource('C') 
].reduce((chain, resourceGetter) => {
    if(chain) {
        return chain.then(useResource, resourceGetter);
    }
    return resourceGetter();
});
```

This is better, but it requires you to define an array of Promises (or Promise sources).
This might not be best for you.

Using `graceful-degrade` you could construct it like this:
```
p.fallback([
    () => getResource('A'),
    () => getResource('B'),
    () => getResource('C')
]).then(useResource);
```

But you could also construct it like this:

```
p.fallback((function* (r) {
    for (let i = 0; i < r.length; i++) { 
        yield getResource(r[i]); 
    }
})(['A', 'B', 'C'])
).then(useResource);

```

# Installation

```
npm i -S graceful-degrade
```

# License
This module is provided under the [MIT License](MIT).

[MIT]: https://spdx.org/licenses/MIT