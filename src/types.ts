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
