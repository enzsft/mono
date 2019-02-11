import { ICommand } from "@enzsft/cli";
import chalk from "chalk";
import { exec } from "child_process";
import { readJson, writeJson } from "fs-extra";
import { EOL } from "os";
import { resolve as resolvePath } from "path";
import { createConsoleLogger } from "../logger";
import { devOption } from "../options/dev";
import { includeOption } from "../options/include";
import { extractPackageName, filterPackages } from "../packages";
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
    const toolLogger = createConsoleLogger();

    // Determine the target packages, must match filter
    const targetPackages = filterPackages(packages, options.include);

    // Determine install package names that exist in the local mono repo
    // These will need to be installed differently to packages from NPM
    const localInstallPackageNames = installPackageNames.filter(n =>
      packages.find(p => p.name === extractPackageName(n)),
    );

    // Packages not deemed to be local to the mono repo are NPM packages
    const npmInstallPackageNames = installPackageNames.filter(
      n => !localInstallPackageNames.includes(extractPackageName(n)),
    );

    // Filter out local mono repo packages
    const localPackages = packages.filter(p =>
      localInstallPackageNames.find(n => n.startsWith(p.name)),
    );

    // Log out all the packages to be installed and in what packages
    toolLogger.log(
      `Installing ${chalk.greenBright(
        installPackageNames.join(", "),
      )} in the following packages:${EOL}${targetPackages
        .map(p => chalk.blueBright(p.name))
        .join(`${EOL}`)}`,
    );

    // Package by package install requested dependencies
    for (const pkg of targetPackages) {
      /**
       * Install packages from the local mono repo
       */

      // Need to filter out packages that match the target package.
      // We do not want to try and install the package in itself
      const filteredLocalPackages = localPackages.filter(
        p => p.name !== pkg.name,
      );

      // Only bother doing this install if there are packages
      if (filteredLocalPackages.length > 0) {
        toolLogger.log("Linking local packages... 🚚");

        // Write local mono repo packages to the package.json first
        // The following yarn installation will link these
        const packageJsonFilePath = resolvePath(pkg.__dir, "package.json");
        const packageJson = await readJson(packageJsonFilePath);
        const dependencyKey = options.dev ? "devDependencies" : "dependencies";

        // Need to ensure key exists to add to it
        if (packageJson[dependencyKey] === undefined) {
          packageJson[dependencyKey] = {};
        }
        // Now all add packages to the key
        for (const localPackage of filteredLocalPackages) {
          packageJson[dependencyKey][localPackage.name] = `^${
            localPackage.version
          }`;
        }
        await writeJson(packageJsonFilePath, packageJson, { spaces: 2 });

        // Running a Yarn install will now link all these packages
        await exec("yarn install");
        toolLogger.log("All linked ✌️");
      }

      /**
       * Install packages from NPM
       */

      // Need to filter out packages that match the target package.
      // We do not want to try and install the package in itself
      const filteredNpmInstallPackageNames = npmInstallPackageNames.filter(
        n => extractPackageName(n) !== pkg.name,
      );

      // Only bother doing this install if there are packages
      if (filteredNpmInstallPackageNames.length > 0) {
        // Create logger prefixed for the executing package
        const executorLogger = createConsoleLogger({ prefix: `[${pkg.name}]` });

        // If they are dev dependencies then append --dev
        const devCommandPart = options.dev ? "--dev" : "";

        // Add the package via Yarn in the package directory
        executorLogger.log("Installing packages from NPM... 🚚");
        const runner = exec(
          `yarn add ${filteredNpmInstallPackageNames.join(
            " ",
          )} ${devCommandPart}`,
          {
            cwd: pkg.__dir,
          },
        );

        // Log stdout as normal logs
        runner.stdout.on("data", data => {
          executorLogger.log(data.toString());
        });

        // Log stderr as errors
        runner.stderr.on("data", data => {
          executorLogger.error(data.toString());
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
    }
  },
  name: "add",
  options: [devOption, includeOption],
});
