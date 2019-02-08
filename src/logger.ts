// tslint:disable no-console
import chalk from "chalk";
import { EOL } from "os";
import { ILogger, ILoggerOptions } from "./types";

/**
 * Default prefix used when none is provided
 */
export const defaultPrefix = chalk.magenta("mono: ");

/**
 * Strip leading and trailing whitespace from each line of
 * the message and prefix each line
 * @param prefix
 * @param message
 */
const format = (prefix: string, message: string): string =>
  message
    .split(EOL) // OS specific end of line character
    .map((line: string): string => `${prefix}${line.trim()}`)
    .join(EOL);

/**
 * Create a logger that logs to stdout/stderr
 */
export const createConsoleLogger = (
  options: ILoggerOptions = { prefix: defaultPrefix },
): ILogger => ({
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
