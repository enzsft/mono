import { exec as doExec, ExecOptions } from "child_process";
import { createConsoleLogger } from "./logger";

/**
 * Exec a command and stream stdout/stderr to the console.
 *
 * @param command
 * @param options
 */
export const exec = (command: string, options: ExecOptions): Promise<void> => {
  const execLogger = createConsoleLogger({ prefix: "" });

  const runner = doExec(command, options);

  // Log stdout as normal logs
  runner.stdout.on("data", data => {
    execLogger.log(data.toString());
  });

  // Log stderr as errors
  runner.stderr.on("data", data => {
    execLogger.error(data.toString());
  });

  return new Promise(
    (resolve, reject): void => {
      runner.on("exit", code => {
        // Reject if the code is non zero
        if (code !== 0) {
          return reject({ code });
        }

        // Resolve on successful code 0
        const logger = createConsoleLogger();
        logger.log(`All done ✌️`);
        return resolve();
      });
    },
  );
};
