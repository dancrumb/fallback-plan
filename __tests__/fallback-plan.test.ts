import {describe, expect, it, jest} from '@jest/globals';

import {fallback, retry, cycle} from '../src/index';

const fail = (x: unknown) => () => Promise.reject(x);
const succeed = (x: unknown) => () => Promise.resolve(x);

describe('fallback-plan', () => {
  describe('fallback', () => {
    it("returns a single resolved Promise's value", () =>
      expect(fallback([succeed(42)])).resolves.toBe(42));
    it("returns a single rejected Promise's reason", () =>
      expect(fallback([fail(31)])).rejects.toBe(31));
    it("returns the first resolved Promise's value", () =>
      Promise.all([
        expect(fallback([fail(1), succeed(2)])).resolves.toBe(2),
        expect(fallback([fail(1), fail(2), succeed(3)])).resolves.toBe(3),
        expect(fallback([succeed(1), succeed(2), succeed(3)])).resolves.toBe(1),
        expect(fallback([fail(1), succeed(2), fail(3)])).resolves.toBe(2),
      ]));
    it("returns the last rejected Promise's value", () =>
      Promise.all([
        expect(fallback([fail(1), fail(2)])).rejects.toBe(2),
        expect(fallback([fail(1), fail(2), fail(3)])).rejects.toBe(3),
      ]));
    it('only requires a single resolved Promise to resolve', () =>
      Promise.all([
        expect(fallback([succeed(1), fail(2), fail(3), fail(4)])).resolves.toBe(1),
        expect(fallback([fail(1), succeed(2), fail(3), fail(4)])).resolves.toBe(2),
        expect(fallback([fail(1), fail(2), succeed(3), fail(4)])).resolves.toBe(3),
        expect(fallback([fail(1), fail(2), fail(3), succeed(4)])).resolves.toBe(4),
      ]));
    it('supports values in the input list', () =>
      Promise.all([expect(fallback([42])).resolves.toBe(42)]));
    it('supports functions in the input list', () =>
      Promise.all([
        expect(fallback([() => 42])).resolves.toBe(42),
        expect(fallback([() => () => {}])).resolves.toBeInstanceOf(Function),
      ]));
    it('supports Promises in the input list', () =>
      Promise.all([expect(fallback([Promise.resolve(42)])).resolves.toBe(42)]));
    it.skip('supports functions that throw and treats them like a rejection', () =>
      Promise.all([
        expect(
          fallback([
            () => {
              throw new Error('Demo error');
            },
          ])
        ).rejects,
      ]));
  });

  describe('retry', () => {
    it('supports multiple retries up to a given number', () => {
      const badSpy = jest.fn(() => Promise.reject(2));
      return retry(badSpy, 5).catch(() => {
        expect(badSpy).toHaveBeenCalledTimes(5);
      });
    });

    it('supports unbounded multiple retries', () => {
      let countdown = 20;
      const multiSpy = jest.fn(() => {
        countdown -= 1;
        if (countdown) {
          return Promise.reject(countdown);
        }
        return Promise.resolve(100);
      });
      return retry(multiSpy, 0).then((value) => {
        expect(multiSpy).toHaveBeenCalledTimes(20);
        expect(value).toEqual(100);
      });
    });
  });

  describe('cycle', () => {
    it('cycles through sets of parameters for the same function', () =>
      Promise.all([
        expect(cycle([[1], [2], [3]], (x) => Promise.resolve(x))).resolves.toBe(1),
        expect(
          cycle(
            [[Promise.reject(1)], [Promise.reject(2)], [Promise.resolve(3)]],
            (x) => x
          )
        ).resolves.toBe(3),
      ]));
    it('handles cycling when the task is just a value', () =>
      Promise.all([expect(cycle([[1], [2], [3]], 42)).resolves.toBe(42)]));
  });
});
