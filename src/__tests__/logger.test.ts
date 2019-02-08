import mockConsole, { RestoreConsole } from "jest-mock-console";
import { createConsoleLogger, defaultPrefix } from "../logger";

describe("createConsoleLogger", () => {
  let restoreConsole: RestoreConsole;
  let globalConsole: any;

  beforeEach(() => {
    restoreConsole = mockConsole();

    // Reassign the global console which has been mocked because
    // it allows us to reassign the type so we can access logs without
    // TypeScript conplaining
    globalConsole = global.console;
  });

  afterEach(() => {
    restoreConsole();
  });

  it("should log to the console with the default prefix", () => {
    const logger = createConsoleLogger();
    const log = "test";

    logger.log(log);
    logger.warn(log);
    logger.error(log);

    expect(globalConsole.log).toHaveBeenCalledTimes(1);
    expect(globalConsole.warn).toHaveBeenCalledTimes(1);
    expect(globalConsole.error).toHaveBeenCalledTimes(1);

    expect(globalConsole.log.mock.calls[0][0]).toBe(`${defaultPrefix}${log}`);
    expect(globalConsole.warn.mock.calls[0][0]).toBe(`${defaultPrefix}${log}`);
    expect(globalConsole.error.mock.calls[0][0]).toBe(`${defaultPrefix}${log}`);
  });

  it("should log to the console with the given prefix", () => {
    const prefix = "prefix: ";
    const logger = createConsoleLogger({ prefix });
    const message = "test";
    const expectedLog = `${prefix}${message}`;

    logger.log(message);
    logger.warn(message);
    logger.error(message);

    expect(globalConsole.log).toHaveBeenCalledTimes(1);
    expect(globalConsole.warn).toHaveBeenCalledTimes(1);
    expect(globalConsole.error).toHaveBeenCalledTimes(1);

    expect(globalConsole.log.mock.calls[0][0]).toBe(expectedLog);
    expect(globalConsole.warn.mock.calls[0][0]).toBe(expectedLog);
    expect(globalConsole.error.mock.calls[0][0]).toBe(expectedLog);
  });

  it("should format multi line logs", () => {
    const logger = createConsoleLogger();
    // log with multiple lines, leading whitespace and traiing whitespace
    const message = `line1
    line2
  line3  `;
    const expectedLog = `${defaultPrefix}line1
${defaultPrefix}line2
${defaultPrefix}line3`;

    logger.log(message);
    logger.warn(message);
    logger.error(message);

    expect(globalConsole.log).toHaveBeenCalledTimes(1);
    expect(globalConsole.warn).toHaveBeenCalledTimes(1);
    expect(globalConsole.error).toHaveBeenCalledTimes(1);

    expect(globalConsole.log.mock.calls[0][0]).toBe(expectedLog);
    expect(globalConsole.warn.mock.calls[0][0]).toBe(expectedLog);
    expect(globalConsole.error.mock.calls[0][0]).toBe(expectedLog);
  });
});
