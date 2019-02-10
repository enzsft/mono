#! /usr/bin/env node

import { createCli } from "@enzsft/cli";
import { createAddCommand } from "./commands/add";
import { createRunCommand } from "./commands/run";
import { getPackages } from "./packages";

getPackages(process.cwd()).then(packages => {
  const cli = createCli({
    commands: [createAddCommand(packages), createRunCommand(packages)],
    description: "Manage JavaScript mono repos with ease. 😲",
    name: "mono",
    version: require("./package.json").version,
  });

  return cli.start(process.argv).catch(() => process.exit(1));
});
