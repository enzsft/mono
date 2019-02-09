// tslint:disable no-console
import chalk from "chalk";
import { EOL } from "os";
import { ILogger, ILoggerOptions } from "./types";

/**
 * Default prefix used when none is provided
 */
export const defaultPrefix = chalk.magenta("[mono]");

/**
 * Prefixes for log levels. These are applied internally
 */
export const levelPrefixes = {
  error: chalk.red("error"),
  log: chalk.green("info"),
  warn: chalk.yellow("warn"),
};

/**
 * Strip leading and trailing whitespace from each line of
 * the message and prefix each line
 * @param prefix
 * @param message
 */
const format = (prefix: string, level: string, message: string): string =>
  message
    .split(EOL) // OS specific end of line character
    // Remove last line if it is an empty string
    .filter(
      (line: string, index: number, array: string[]) =>
        !(index === array.length - 1 && line.trim().length === 0),
    )
    .map((line: string): string => `${prefix} ${level}: ${line.trimRight()}`)
    .join(EOL);

/**
 * Create a logger that logs to stdout/stderr
 */
export const createConsoleLogger = (
  options: ILoggerOptions = { prefix: defaultPrefix },
): ILogger => ({
  error: (message: string): void => {
    console.error(format(options.prefix, levelPrefixes.error, message));
  },
  log: (message: string): void => {
    console.log(format(options.prefix, levelPrefixes.log, message));
  },
  warn: (message: string): void => {
    console.warn(format(options.prefix, levelPrefixes.warn, message));
  },
});
