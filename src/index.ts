#! /usr/bin/env node

import { createCli } from "@enzsft/cli";
import { createAddCommand } from "./commands/add";
import { createRemoveCommand } from "./commands/remove";
import { createRunCommand } from "./commands/run";
import { getMonoRepo } from "./mono-repo";
import { getPackages } from "./packages";
import { createListCommand } from "./commands/list";
import { createFindCommand } from "./commands/find";

const run = async (): Promise<void> => {
  const cwd = process.cwd();
  const monoRepo = await getMonoRepo(cwd);
  const packages = await getPackages(cwd);

  const cli = createCli({
    commands: [
      createAddCommand(packages, monoRepo),
      createRunCommand(packages, monoRepo),
      createRemoveCommand(packages, monoRepo),
      createListCommand(packages, monoRepo),
      createFindCommand(packages, monoRepo, cwd),
    ],
    description: "Manage JavaScript mono repos with ease. 😲",
    name: "mono",
    version: require("./package.json").version,
  });

  return cli.start(process.argv).catch(() => process.exit(1));
};

run();
