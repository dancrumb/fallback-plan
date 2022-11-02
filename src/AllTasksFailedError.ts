export class AllTasksFailedError extends Error {
  readonly failures: readonly Error[] = [];
  constructor(message: string, failures: readonly Error[]) {
    super(message);
    this.failures = failures;
  }
}
