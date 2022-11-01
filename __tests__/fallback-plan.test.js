import sinon from "sinon";

import plan from "../src/index";

const fail = (x) => () => Promise.reject(x);
const pass = (x) => () => Promise.resolve(x);

describe("fallback-plan", () => {
  describe("fallback", () => {
    it("returns a single resolved Promise's value", () =>
      expect(plan.fallback([pass(42)], Promise)).to.eventually.equal(42));
    it("returns a single rejected Promise's reason", () =>
      expect(plan.fallback([fail(31)], Promise)).to.be.rejectedWith(31));
    it("returns the first resolved Promise's value", () =>
      Promise.all([
        expect(plan.fallback([fail(1), pass(2)], Promise)).to.eventually.equal(
          2
        ),
        expect(
          plan.fallback([fail(1), fail(2), pass(3)], Promise)
        ).to.eventually.equal(3),
        expect(
          plan.fallback([pass(1), pass(2), pass(3)], Promise)
        ).to.eventually.equal(1),
        expect(
          plan.fallback([fail(1), pass(2), fail(3)], Promise)
        ).to.eventually.equal(2),
      ]));
    it("returns the last rejected Promise's value", () =>
      Promise.all([
        expect(plan.fallback([fail(1), fail(2)], Promise)).to.be.rejectedWith(
          2
        ),
        expect(
          plan.fallback([fail(1), fail(2), fail(3)], Promise)
        ).to.be.rejectedWith(3),
      ]));
    it("only requires a single resolved Promise to resolve", () =>
      Promise.all([
        expect(
          plan.fallback([pass(1), fail(2), fail(3), fail(4)], Promise)
        ).to.eventually.equal(1),
        expect(
          plan.fallback([fail(1), pass(2), fail(3), fail(4)], Promise)
        ).to.eventually.equal(2),
        expect(
          plan.fallback([fail(1), fail(2), pass(3), fail(4)], Promise)
        ).to.eventually.equal(3),
        expect(
          plan.fallback([fail(1), fail(2), fail(3), pass(4)], Promise)
        ).to.eventually.equal(4),
      ]));
    it("supports values in the input list", () =>
      Promise.all([expect(plan.fallback([42])).to.eventually.equal(42)]));
    it("supports functions in the input list", () =>
      Promise.all([
        expect(plan.fallback([() => 42])).to.eventually.equal(42),
        expect(plan.fallback([() => () => {}])).to.eventually.be.a("function"),
      ]));
    it("supports Promises in the input list", () =>
      Promise.all([
        expect(plan.fallback([Promise.resolve(42)])).to.eventually.equal(42),
      ]));
    it("supports functions that throw and treats them like a rejection", () =>
      Promise.all([
        expect(
          plan.fallback([
            () => {
              throw new Error();
            },
          ])
        ).to.be.rejected,
      ]));
  });

  describe("retry", () => {
    it("supports multiple retries up to a given number", () => {
      const badSpy = sinon.stub().returns(Promise.reject(2));
      return plan.retry(badSpy, 5, Promise).catch(() => {
        expect(badSpy).to.have.callCount(5);
      });
    });

    it("supports unbounded multiple retries", () => {
      let countdown = 20;
      const multiSpy = sinon.spy(() => {
        countdown -= 1;
        if (countdown) {
          return Promise.reject(countdown);
        }
        return Promise.resolve(100);
      });
      return plan.retry(multiSpy, 0, Promise).then((value) => {
        expect(multiSpy).to.have.callCount(20);
        expect(value).to.equal(100);
      });
    });
  });

  describe("cycle", () => {
    it("cycles through sets of parameters for the same function", () =>
      Promise.all([
        expect(
          plan.cycle([[1], [2], [3]], (x) => Promise.resolve(x))
        ).to.eventually.equal(1),
        expect(
          plan.cycle(
            [[Promise.reject(1)], [Promise.reject(2)], [Promise.resolve(3)]],
            (x) => x
          )
        ).to.eventually.equal(3),
      ]));
  });
});
