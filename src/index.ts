#! /usr/bin/env node

import { createCli } from "@enzsft/cli";
import { createRunCommand } from "./commands/run";
import { getPackages } from "./packages";

getPackages(process.cwd()).then(packages => {
  const cli = createCli({
    commands: [createRunCommand(packages)],
    description: "Manage JavaScript mono repos with ease. 😲",
    name: "mono",
  });

  return cli.start(process.argv).catch(() => process.exit(1));
});
