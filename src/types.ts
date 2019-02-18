/**
 * A mono repo (important package.json info essentially)
 */
export interface IMonoRepo {
  /**
   * The directory this mon repo config is located in. Meta data not found in the package.json
   */
  __dir: string;
  /**
   * License
   */
  license: string;
  /**
   * Name
   */
  name: string;
  /**
   * Private (valid Yarn Workspace mono repos are always private)
   */
  private: boolean;
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
   * The directory this package is located in. Meta data not found in the package.json
   */
  __dir: string;
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
}

/**
 * NPM package version spec
 */
export interface IVersionSpec {
  /**
   * Version such as 1.0.0
   */
  version: string;
  /**
   * Version modifier such as ^
   */
  modifier: string;
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
 * Add command options
 */
export interface IAddCommandOptions {
  /**
   * Specify dependencies are dev dependencies
   */
  dev: boolean;
  /**
   * Filter string for package names
   */
  include: string;
}

/**
 * Remove command options
 */
export interface IRemoveCommandOptions {
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
