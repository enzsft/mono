// tslint:disable no-console
import chalk from "chalk";
import { EOL } from "os";
import { Logger, LoggerOptions } from "./types";

/**
 * Default prefix used when none is provided
 */
export const defaultPrefix = chalk.magenta("mono: ");

/**
 * Strip leading and trailing whitespace from each line of
 * the message and prefix each line
 *
 * @param {string} prefix Message prefix
 * @param {string} message Message to format
 * @returns {string} Formatted string
 */
const format = (prefix: string, message: string): string =>
  message
    .split(EOL) // OS specific end of line character
    // Remove last line if it is an empty string
    .filter(
      (line: string, index: number, array: string[]) =>
        !(index === array.length - 1 && line.trim().length === 0),
    )
    .map((line: string): string => `${prefix}${line.trimRight()}`)
    .join(EOL);

/**
 * Create a logger that logs to stdout/stderr
 *
 * @param {Object} options Logger options
 * @returns {Object} A console logger
 */
export const createConsoleLogger = (
  options: LoggerOptions = { prefix: defaultPrefix },
): Logger => ({
  error: (message: string): void => {
    console.error(format(options.prefix, message));
  },
  log: (message: string): void => {
    console.log(format(options.prefix, message));
  },
  warn: (message: string): void => {
    console.warn(format(options.prefix, message));
  },
});
