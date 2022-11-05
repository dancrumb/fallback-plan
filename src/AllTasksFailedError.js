"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllTasksFailedError = void 0;
class AllTasksFailedError extends Error {
    constructor(message, failures) {
        super(message);
        this.failures = [];
        this.failures = failures;
    }
}
exports.AllTasksFailedError = AllTasksFailedError;
