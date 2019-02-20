import { ensureDirSync, existsSync, removeSync } from "fs-extra";
import mockConsole, { RestoreConsole } from "jest-mock-console";
import { resolve } from "path";
import { exec } from "../exec";

describe("exec", () => {
  const fixtureDir = resolve(process.cwd(), "__temp_fixture__exec");
  let restoreConsole: RestoreConsole;

  beforeEach(() => {
    restoreConsole = mockConsole();
    ensureDirSync(fixtureDir);
  });

  afterEach(() => {
    restoreConsole();
    removeSync(fixtureDir);
  });

  it("should exec the command", async () => {
    await exec("touch", ["1.txt"], { cwd: fixtureDir });

    expect(existsSync(resolve(fixtureDir, "1.txt"))).toBe(true);
  });

  it("should reject if the command does not exist", async () => {
    expect.assertions(1);

    try {
      await exec("touch-does-not-exist", [], { cwd: fixtureDir });
    } catch (error) {
      expect(error).not.toBeNull();
    }
  });

  it("should if the command fails", async () => {
    expect.assertions(1);

    try {
      await exec("touch -this-surely-does=not-exist", [], { cwd: fixtureDir });
    } catch (code) {
      expect(code).not.toBeNull();
    }
  });
});
