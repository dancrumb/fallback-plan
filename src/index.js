"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cycle = exports.retry = exports.fallback = exports.TaskFailureTracker = void 0;
const isFunction = (val) => typeof val === 'function';
/**
 * This class is just for tracking past failures while working through
 * a list of tasks
 */
class TaskFailureTracker {
    constructor(failures) {
        this.failures = [];
        this.failures = failures;
    }
}
exports.TaskFailureTracker = TaskFailureTracker;
/**
 * This reducer iterates over a list of Tasks and attempts each one.
 *
 * For each one that fails, it returns a TaskFailureTracker object that contains a list
 * of past failures. This is currently used to capture the final failure, but in future
 * releases could be used for logging or debugging.
 *
 * @returns
 */
const reducer = (params = []) => {
    return async (previousResult, task) => {
        const previousOutcome = await previousResult;
        if (!(previousOutcome instanceof TaskFailureTracker)) {
            return previousOutcome;
        }
        try {
            return await Promise.resolve().then(() => isFunction(task) ? task(...params) : task);
        }
        catch (e) {
            return new TaskFailureTracker(previousOutcome.failures.concat(e));
        }
    };
};
/**
 * This function resolves a list of tasks to either a successful value or a TaskFailureTracker
 * @param tasks - list of tasks to resolve
 * @param params - parameters to pass to each task instance
 * @returns
 */
const resolveList = (tasks, params = []) => tasks.reduce(reducer(params), Promise.resolve(new TaskFailureTracker([])));
/**
 * `fallback` takes an array of {@link Task}s and uses it as a fallback plan. For each value in
 * the array, if it doesn't resolve to a successful value, the fallback plan will try the next.
 *
 * This returns a Promise that resolves to the successful value or rejects with the final error in
 * the plan.
 *
 * @param tasks - the {@link Task}s that you want in your plan; none of these can take any parameter
 */
const fallback = async (tasks) => {
    const result = await resolveList(tasks);
    if (result instanceof TaskFailureTracker) {
        throw result.failures[result.failures.length - 1];
    }
    return result;
};
exports.fallback = fallback;
/**
 * Retries a single task up to `times` times, with a delay of `delay`ms between each attempt.
 *
 * If `times` is zero, it repeats until it is successful
 *
 * Returns when an attempt at a task is successful
 *
 * @example
 *
 * ```
 * // A task with a 1s timeout
 * const task = Promise.race([() => getResource('foo'), new Promise((_,rej) => setTimeout(rej,1000))]);
 * retry(() => getResource('foo').timeout(1000), 5)
 *   .then(useResource);
 * ```
 *
 * This will attempt to get `foo` up to 5 times. It will stop trying when it gets it.
 *
 * @param task - the {@link Task} to keep trying
 * @param times - the number of times to keep trying; defaults to 0 which means keep trying until successful
 * @param delay - the number of milliseconds to wait between tries; defaults to no wait
 * @returns
 */
const retry = async (task, times = 0, delay = 0) => {
    let countdown = times;
    const infinite = times === 0;
    while (infinite || countdown > 0) {
        const result = await reducer([])(Promise.resolve(new TaskFailureTracker([])), task);
        if (!(result instanceof TaskFailureTracker)) {
            return result;
        }
        countdown -= 1;
        await new Promise((res) => setTimeout(res, delay));
    }
    return null;
};
exports.retry = retry;
/**
 * Steps through a single task with differing parameters and returns the results of the first successful one
 * or last failed one
 *
 * @example
 * For example:
 * ```
 * cycle([
 *   'foo',
 *   'foo2',
 *   'foo4'
 * ], getResource).then(useResource);
 * ```
 *
 * This is handy for when the only thing that changes between the steps in your plan are parameters.
 *
 * @param parameters - a list of the parameters to pass to the {@link Task}. If the task takes multiple parameters, these should be
 *                     represented as a list
 * @param task - the {@link Task} to execute
 */
const cycle = (parameters, task) => {
    let tasks = [];
    if (!isFunction(task)) {
        tasks = parameters.map(() => task);
    }
    else {
        tasks = parameters.map((p) => async () => task(...p));
    }
    return (0, exports.fallback)(tasks);
};
exports.cycle = cycle;
