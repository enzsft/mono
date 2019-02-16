import { wait } from "../wait";

describe("wait", () => {
  it("should resolve", async () => {
    await wait(1);
  });
});
