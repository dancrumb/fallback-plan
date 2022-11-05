export declare class AllTasksFailedError extends Error {
    readonly failures: readonly Error[];
    constructor(message: string, failures: readonly Error[]);
}
