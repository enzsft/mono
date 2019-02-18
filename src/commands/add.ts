import { ICommand } from "@enzsft/cli";
import chalk from "chalk";
import { exec } from "child_process";
import { readJson, writeJson } from "fs-extra";
import { EOL } from "os";
import { resolve as resolvePath } from "path";
import { createConsoleLogger } from "../logger";
import { devOption } from "../options/dev";
import { includeOption } from "../options/include";
import { filterPackages, getPackageName, getPackageVersion } from "../packages";
import { IAddCommandOptions, IMonoRepo, IPackage } from "../types";

/**
 * Create the add command.
 * This command is used to add NPM packages to packages in the mono repo.
 * If the package name matches one in the mono repo then it is locally linked.
 * @param packages
 */
export const createAddCommand = (
  packages: IPackage[],
  monoRepo: IMonoRepo | null,
): ICommand<IAddCommandOptions> => ({
  description: "Install dependencies from NPM or your local mono repo.",
  handler: async (
    installPackageNames: string[],
    options: IAddCommandOptions,
  ): Promise<void> => {
    const logger = createConsoleLogger();

    // Can't continue if not in a mono repo
    if (!monoRepo) {
      logger.warn("Unable to locate your mono repo 😰");
      return;
    }

    // Determine the target packages, must match filter
    const targetPackages = filterPackages(packages, options.include);

    if (targetPackages.length === 0) {
      logger.warn("No packages found 😰");
      return;
    }

    // Determine install package names that exist in the local mono repo
    const localInstallPackageNames = installPackageNames.filter(n =>
      packages.find(p => p.name === getPackageName(n)),
    );

    // Packages not deemed to be local to the mono repo are NPM packages
    const npmPackages: IPackage[] = await Promise.all(
      installPackageNames
        .filter(n => !localInstallPackageNames.includes(getPackageName(n)))
        .map(async n => {
          const versionSpec = await getPackageVersion(n, packages);
          return {
            __dir: "", // don't care about this for install
            license: "", // or this
            name: getPackageName(n),
            version: `${versionSpec.modifier}${versionSpec.version}`,
          };
        }),
    );

    // Filter out local mono repo packages
    const localPackages: IPackage[] = await Promise.all(
      installPackageNames
        .filter(n => localInstallPackageNames.includes(getPackageName(n)))
        .map(async n => {
          const versionSpec = await getPackageVersion(n, packages);
          return {
            __dir: "", // don't care about this for install
            license: "", // or this
            name: getPackageName(n),
            version: `${versionSpec.modifier}${versionSpec.version}`,
          };
        }),
    );

    // Final list of packages to install
    const installPackages = [...npmPackages, ...localPackages];

    // Log out all the target packages
    logger.log(
      `Installing into the following packages:${EOL}${chalk.blueBright(
        targetPackages.map(p => p.name).join(EOL),
      )}`,
    );

    // Package.json key to write dependnecies into
    const dependencyKey = options.dev ? "devDependencies" : "dependencies";

    // Write the dependencies into all package.jsons
    logger.log("Writing dependencies to packages... ✏️");

    for (const pkg of targetPackages) {
      // Need to filter out packages that match the target package.
      // We do not want to try and install the package in itself
      const filteredPackages = installPackages.filter(p => p.name !== pkg.name);

      // Only bother doing this install if there are packages
      if (filteredPackages.length > 0) {
        // Write packages to the package.json
        const packageJsonFilePath = resolvePath(pkg.__dir, "package.json");
        const packageJson = await readJson(packageJsonFilePath);

        // Need to ensure key exists to add to it
        if (packageJson[dependencyKey] === undefined) {
          packageJson[dependencyKey] = {};
        }

        // Now add packages to the key
        for (const installPackage of filteredPackages) {
          packageJson[dependencyKey][installPackage.name] = `${
            installPackage.version
          }`;
        }

        // Save the file
        await writeJson(packageJsonFilePath, packageJson, { spaces: 2 });
      }
    }

    // Running a Yarn install will install all packages from NPM and link local packages.
    // We don't simply run `yarn workspace add abc` for each package because it is slower
    // This way we only make yarn work once.
    const runner = exec("yarn", { cwd: monoRepo.__dir });

    // Log stdout as normal logs
    runner.stdout.on("data", data => {
      logger.log(data.toString());
    });

    // Log stderr as errors
    runner.stderr.on("data", data => {
      logger.error(data.toString());
    });

    await new Promise(
      (resolve, reject): void => {
        runner.on("exit", code => {
          // Reject if the code is non zero
          if (code !== 0) {
            return reject({ code });
          }

          // Resolve on successful code 0
          logger.log(`Install is done ✌️`);
          return resolve();
        });
      },
    );
  },
  name: "add",
  options: [devOption, includeOption],
});
