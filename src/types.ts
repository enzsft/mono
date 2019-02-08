/**
 * A mono repo (important package.json info essentially)
 */
export interface IMonoRepo {
  /**
   * License
   */
  license: string;
  /**
   * Name
   */
  name: string;
  /**
   * Version
   */
  version: string;
  /**
   * Globs used to locate workspaces that contain packages
   */
  workspaces: string[];
}

/**
 * A package (important package.json info essentially)
 */
export interface IPackage {
  /**
   * License
   */
  license: string;
  /**
   * Name
   */
  name: string;
  /**
   * NPM scripts, these can be executed by this tool
   */
  scripts?: { [key: string]: string };
  /**
   * Version
   */
  version: string;
  /**
   * The directory this package is located in. Meta data not found in the package.json
   */
  __dir: string;
}

/**
 * Run command options
 */
export interface IRunCommandOptions {
  /**
   * Filter string for package names
   */
  include: string;
}

/**
 * Simple logger
 */
export interface ILogger {
  /**
   * Log
   */
  log: (message: string) => void;
  /**
   * Log warning
   */
  warn: (message: string) => void;
  /**
   * Log error
   */
  error: (message: string) => void;
}

/**
 * Logger options
 */
export interface ILoggerOptions {
  /**
   * Prefix for every line of the log message
   */
  prefix: string;
}
