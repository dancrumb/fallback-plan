# Fallback Plan

[![NPM](https://nodei.co/npm/fallback-plan.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/fallback-plan/)

[![Code Climate](https://codeclimate.com/github/dancrumb/fallback-plan/badges/gpa.svg)](https://codeclimate.com/github/dancrumb/fallback-plan)
[![Test Coverage](https://codeclimate.com/github/dancrumb/fallback-plan/badges/coverage.svg)](https://codeclimate.com/github/dancrumb/fallback-plan/coverage)
[![Build Status](https://travis-ci.org/dancrumb/fallback-plan.svg?branch=master)](https://travis-ci.org/dancrumb/fallback-plan)
[![dependencies Status](https://david-dm.org/dancrumb/fallback-plan/status.svg)](https://david-dm.org/dancrumb/fallback-plan)

Wouldn't it be nice if everything went smoothly?

Sure it would, but networks are unreliable and sources aren't always present.

As a result, a lot of the code we write is dealing with things when they go wrong.

This module is designed to help you with that.

## Dealing with failure

Let's say you're trying to do the following: You want to access an online resource and, if that's 
not available or corrupted, you'll try a different one and, if that's not available or corrupted, 
you'll try a local file and, if that's not available or corrupted, you'll just resort to something default.

Something like this might ensue:

```
getRemoteResource('foo')
    .catch(() => getRemoteResource('foo2'))
    .catch(() => getLocalResource('foo3'))
    .catch(() => getDefault())
    .then(handleResource);
```

That's not the worse code in the world, but it's not very dynamic.

It _could_ be built with:

```
[
    () => getRemoteResource('foo'),
    () => getRemoteResource('foo2'),
    () => getLocalResource('foo3'),
    () => getDefault()
].reduce((chain, resourceGetter) => {
    if(chain) {
        return chain.catch(resourceGetter);
    }
    return resourceGetter();
}).then(handleResource);
```
This solves the non-dynamic problem, but we've now got a hulking great reducer in your code
whose purpose is not exactly obvious.

In addition, this all assumes that your sources return promises. Some of them may be accessed
synchronously. Promisifying them may not really be warranted.

Enter `fallback-plan`

# Usage

Using the `fallback-plan`, the code above could be rewritten:

```
plan.fallback([
    () => getRemoteResource('foo'),
    () => getRemoteResource('foo2'),
    () => getLocalResource('foo3'),
    () => getDefault()
]).then(useResource);
```

Actually, you could go a step further, since the call to `getDefault` has no parameters:
```
plan.fallback([
    () => getRemoteResource('foo'),
    () => getRemoteResource('foo2'),
    () => getLocalResource('foo3'),
    getDefault
]).then(useResource);
```
since `fallback` handles:

- plain values
- Promises that resolve a value
- functions that return Promises
- functions that return a value

# API

## fallback
The basic case allows you to provide a fallback plan.

`plan.fallback` takes an [iterable][iterable] and uses it as a fallback plan. For each value in
the iterable, if it doesn't resolve to a successful value, the fallback plan will try the next.

This returns a Promise that resolves to the successful value or rejects with the final error in
the plan.

## retry
A special case of the fallback plan is to just retry a few times. `fallback-plan` supports this.

Using [`bluebird`][bluebird]'s timeout capability:

```
plan.retry(() => getResource('foo').timeout(1000), 5)
    .then(useResource);
```

This will attempt to get `foo` up to 5 times. It will stop trying when it gets it.

You can retry indefinitely with:
```
plan.retry(() => getResource('foo').timeout(1000))
    .then(useResource);
```
## cycle
Another special case is a single function and just cycling through sets of parameters until some
succeed.

For example:

```
plan.cycle([
    'foo',
    'foo2',
    'foo4'
], getResource).then(useResource);
```

This is handy for when the only thing that changes between the steps in your plan are parameters.

## Nesting

Since all of the fallback plan options return a Promise, you can nest them:

```
plan.fallback([
    plan.cycle([
        'foo',
        'foo2'
    ], getRemoteResource),
    () => getLocalResource('foo3'),
    getDefault
]).then(useResource);
```

# Installation

```
npm i -S fallback-plan
```

# Some relevant thoughts

Some things to consider:

## Why not just use Promise.race or Promise.any?
These types of methods are pretty cool, but they execute *all* of the Promises in order to determine
which finishes first.

If you have a fallback plan with numerous possible options and some of these are costly, the last thing
you want to do is to fire them off unnecessarily. `fallback-plan` only calls a function
that returns a Promise if it needs to.

## Why use functions that return Promises rather than Promises themselves?
Same reason as above. If you did:

```
plan.fallback([
    getRemoteResource('foo'),
    getRemoteResource('foo2'),
    getLocalResource('foo3'),
    getDefault
]).then(useResource);
```

then you would have requested `'foo'`, `'foo2'` and `'foo3'`... even if `'foo'` comes back 
without a problem!


# License
This module is provided under the [MIT License](MIT).

[MIT]: https://spdx.org/licenses/MIT
[bluebird]: http://bluebirdjs.com/
[iterable]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#iterable