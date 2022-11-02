const isFunction = (val: unknown): val is Function => typeof val === 'function';

type Task<R, P extends unknown[] = []> =
  | ((...args: P) => Promise<R>)
  | ((...args: P) => R)
  | R
  | Promise<R>;

class TaskFailureTracker {
  readonly failures: unknown[] = [];
  constructor(failures: unknown[]) {
    this.failures = failures;
  }
}

const reducer = <P extends unknown[] = []>(params: P = [] as unknown as P) => {
  return async <R>(previous: Promise<R | TaskFailureTracker>, task: Task<R, P>) => {
    const prev = await previous;
    if (!(prev instanceof TaskFailureTracker)) {
      return prev;
    }
    try {
      if (isFunction(task)) {
        return await Promise.resolve().then(() => task(...params));
      }
      return await task;
    } catch (e) {
      return new TaskFailureTracker(prev.failures.concat(e));
    }
  };
};

const resolveList = <R, P extends unknown[] = []>(
  tasks: Task<R, P>[],
  params: P = [] as unknown as P
) =>
  tasks.reduce<Promise<R | TaskFailureTracker>>(
    reducer(params),
    Promise.resolve(new TaskFailureTracker([]))
  );

export const fallback = async <R>(sources: Task<R>[]) => {
  const result = await resolveList(sources);
  if (result instanceof TaskFailureTracker) {
    throw result.failures[result.failures.length - 1];
  }
  return result;
};

const cycleGenerator = <P extends unknown[], R>(
  parameters: P[],
  task: Task<R, P>
): Task<R>[] => {
  if (!isFunction(task)) {
    return parameters.map(() => task);
  }
  return parameters.map<Task<R>>((p) => async () => task(...p));
};

export const retry = async <R>(task: Task<R>, times = 0, delay = 0) => {
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

export const cycle = <P extends unknown[], R>(parameters: P[], task: Task<R, P>) => {
  return fallback(cycleGenerator(parameters, task));
};
