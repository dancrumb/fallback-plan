import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import pf from '../src/index';

chai.use(chaiAsPromised);
chai.use(sinonChai);

const expect = chai.expect;

const fail = x => () => Promise.reject(x);
const pass = x => () => Promise.resolve(x);

describe('promise-fallback', () => {
  describe('fallback', () => {
    it('returns a single resolved Promise\'s value', () => expect(pf.fallback([pass(42)], Promise)).to.eventually.equal(42));
    it('returns a single rejected Promise\'s reason', () => expect(pf.fallback([fail(31)], Promise)).to.be.rejectedWith(31));
    it('returns the first resolved Promise\'s value', () => Promise.all([
      expect(pf.fallback([fail(1), pass(2)], Promise)).to.eventually.equal(2),
      expect(pf.fallback([fail(1), fail(2), pass(3)], Promise)).to.eventually.equal(3),
      expect(pf.fallback([pass(1), pass(2), pass(3)], Promise)).to.eventually.equal(1),
      expect(pf.fallback([fail(1), pass(2), fail(3)], Promise)).to.eventually.equal(2),
    ]));
    it('returns the last rejected Promise\'s value', () => Promise.all([
      expect(pf.fallback([fail(1), fail(2)], Promise)).to.be.rejectedWith(2),
      expect(pf.fallback([fail(1), fail(2), fail(3)], Promise)).to.be.rejectedWith(3),
    ]));
    it('only requires a single resolved Promise to resolve', () => Promise.all([
      expect(pf.fallback([pass(1), fail(2), fail(3), fail(4)], Promise)).to.eventually.equal(1),
      expect(pf.fallback([fail(1), pass(2), fail(3), fail(4)], Promise)).to.eventually.equal(2),
      expect(pf.fallback([fail(1), fail(2), pass(3), fail(4)], Promise)).to.eventually.equal(3),
      expect(pf.fallback([fail(1), fail(2), fail(3), pass(4)], Promise)).to.eventually.equal(4),
    ]));
  });

  describe('retry', () => {
    it('supports multiple retries up to a given number', () => {
      const badSpy = sinon.stub().returns(Promise.reject(2));
      return pf.retry(badSpy, 5, Promise).catch(() => {
        expect(badSpy).to.have.callCount(5);
      });
    });

    it('supports unbounded multiple retries', () => {
      let countdown = 20;
      const multiSpy = sinon.spy(() => {
        countdown -= 1;
        if (countdown) {
          return Promise.reject(countdown);
        }
        return Promise.resolve(100);
      });
      return pf.retry(multiSpy, 0, Promise).then((value) => {
        expect(multiSpy).to.have.callCount(20);
        expect(value).to.equal(100);
      });
    });
  });
});
