import { ICommand } from "@enzsft/cli";
import chalk from "chalk";
import { exec } from "child_process";
import { EOL } from "os";
import { createConsoleLogger } from "../logger";
import { devOption } from "../options/dev";
import { includeOption } from "../options/include";
import { filterPackages } from "../packages";
import { IAddCommandOptions, IPackage } from "../types";

/**
 * Create the add command.
 * This command is used to add NPM packages to packages in the mono repo.
 * If the package name matches one in the mono repo then it is locally linked.
 * @param packages
 */
export const createAddCommand = (
  packages: IPackage[],
): ICommand<IAddCommandOptions> => ({
  description: "Install packages from NPM or the mono repo.",
  handler: async (
    installPackageNames: string[],
    options: IAddCommandOptions,
  ): Promise<void> => {
    // Determine the target packages, must match filter
    const targetPackages = filterPackages(packages, options.include);

    // Log out all the packages to be installed and in what packages
    const toolLogger = createConsoleLogger();
    toolLogger.log(`Installing ${chalk.greenBright(
      installPackageNames.join(", "),
    )} in the following packages:
  ${targetPackages.map(p => chalk.blueBright(p.name)).join(`${EOL}  `)}`);

    for (const pkg of targetPackages) {
      // Add the package via Yarn in the package directory
      const devCommandPard = options.dev ? "--dev" : "";
      const runner = exec(
        `yarn add ${installPackageNames.join(" ")} ${devCommandPard}`,
        {
          cwd: pkg.__dir,
        },
      );

      // Create logger prefixed for the executing package
      const scriptLogger = createConsoleLogger({ prefix: `[${pkg.name}]` });

      // Log stdout as normal logs
      runner.stdout.on("data", data => {
        scriptLogger.log(data.toString());
      });

      // Log stderr as errors
      runner.stderr.on("data", data => {
        scriptLogger.error(data.toString());
      });

      await new Promise(
        (resolve, reject): void => {
          runner.on("exit", code => {
            // Reject if the code is non zero
            if (code !== 0) {
              toolLogger.error(
                `Install failed in ${chalk.blueBright(
                  pkg.name,
                )}. Yarn exited with error code ${code} 🤕`,
              );
              return reject({ code });
            }

            // Resolve on successful code 0
            toolLogger.log(
              `Install in ${chalk.blueBright(pkg.name)} is done 🎉`,
            );
            return resolve();
          });
        },
      );
    }
  },
  name: "add",
  options: [devOption, includeOption],
});
