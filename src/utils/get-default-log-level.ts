/* global process */

/**
 * Retrieves the default log level from the environment variables.
 *
 * This function checks for the `LOG_LEVEL` environment variable and returns its value.
 * If `LOG_LEVEL` is not defined, it defaults to `'warn'`.
 *
 * @returns {string} The log level (`'error'`, `'warn'`, `'info'`, `'debug'`, `'trace'`, etc.).
 *
 * @example
 * ```ts
 * const logLevel = getDefaultLogLevel();
 * console.log(logLevel); // Output: 'warn' (if LOG_LEVEL is not set)
 * ```
 */
export const getDefaultLogLevel = (): string => {
  return process.env.LOG_LEVEL || 'warn';
};
