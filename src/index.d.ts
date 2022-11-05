/**
 * A Task is something that ultimately resolves to a value.
 *
 * In general usage, a Task will be a function that returns a value, or a Promise that resolves to a value.
 * The intent of this module is that some Tasks in your plan are ones that you don't want to run
 * unless you have to.
 *
 * They can also just be plain values; these are most useful as a final step in a plan where you want to have
 * a guaranteed value (and not an error path)
 *
 * @typeParam R - The return type of your Task
 * @typeParam P - A tuple that represents the parameter types of your Task. This can be left off for Tasks that take no
 *                parameters
 */
export declare type Task<R = void, P extends unknown[] = []> = ((...args: P) => Promise<R>) | ((...args: P) => R) | R | Promise<R>;
/**
 * This class is just for tracking past failures while working through
 * a list of tasks
 */
export declare class TaskFailureTracker {
    readonly failures: unknown[];
    constructor(failures: unknown[]);
}
/**
 * `fallback` takes an array of {@link Task}s and uses it as a fallback plan. For each value in
 * the array, if it doesn't resolve to a successful value, the fallback plan will try the next.
 *
 * This returns a Promise that resolves to the successful value or rejects with the final error in
 * the plan.
 *
 * @param tasks - the {@link Task}s that you want in your plan; none of these can take any parameter
 */
export declare const fallback: <R>(tasks: Task<R, []>[]) => Promise<R>;
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
export declare const retry: <R>(task: Task<R, []>, times?: number, delay?: number) => Promise<R | null>;
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
export declare const cycle: <P extends unknown[], R>(parameters: P[], task: Task<R, P>) => Promise<R>;
