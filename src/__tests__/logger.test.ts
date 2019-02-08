import mockConsole, { RestoreConsole } from "jest-mock-console";
import { createConsoleLogger, defaultPrefix, levelPrefixes } from "../logger";

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

  it("should log to the console with the default prefix and log level", () => {
    const logger = createConsoleLogger();
    const log = "test";

    logger.log(log);
    logger.warn(log);
    logger.error(log);

    expect(globalConsole.log).toHaveBeenCalledTimes(1);
    expect(globalConsole.warn).toHaveBeenCalledTimes(1);
    expect(globalConsole.error).toHaveBeenCalledTimes(1);

    expect(globalConsole.log.mock.calls[0][0]).toBe(
      `${defaultPrefix} ${levelPrefixes.log}: ${log}`,
    );
    expect(globalConsole.warn.mock.calls[0][0]).toBe(
      `${defaultPrefix} ${levelPrefixes.warn}: ${log}`,
    );
    expect(globalConsole.error.mock.calls[0][0]).toBe(
      `${defaultPrefix} ${levelPrefixes.error}: ${log}`,
    );
  });

  it("should log to the console with the given prefix and log level", () => {
    const prefix = "prefix: ";
    const logger = createConsoleLogger({ prefix });
    const message = "test";

    logger.log(message);
    logger.warn(message);
    logger.error(message);

    expect(globalConsole.log).toHaveBeenCalledTimes(1);
    expect(globalConsole.warn).toHaveBeenCalledTimes(1);
    expect(globalConsole.error).toHaveBeenCalledTimes(1);

    expect(globalConsole.log.mock.calls[0][0]).toBe(
      `${prefix} ${levelPrefixes.log}: ${message}`,
    );
    expect(globalConsole.warn.mock.calls[0][0]).toBe(
      `${prefix} ${levelPrefixes.warn}: ${message}`,
    );
    expect(globalConsole.error.mock.calls[0][0]).toBe(
      `${prefix} ${levelPrefixes.error}: ${message}`,
    );
  });

  it("should format multi line logs", () => {
    const logger = createConsoleLogger();
    // log with multiple lines, leading whitespace,
    // traiing whitespace and blank last line
    const message = `line1
    line2
  line3  
`;

    logger.log(message);
    logger.warn(message);
    logger.error(message);

    expect(globalConsole.log).toHaveBeenCalledTimes(1);
    expect(globalConsole.warn).toHaveBeenCalledTimes(1);
    expect(globalConsole.error).toHaveBeenCalledTimes(1);

    expect(globalConsole.log.mock.calls[0][0]).toBe(`${defaultPrefix} ${
      levelPrefixes.log
    }: line1
${defaultPrefix} ${levelPrefixes.log}: line2
${defaultPrefix} ${levelPrefixes.log}: line3`);
    expect(globalConsole.warn.mock.calls[0][0]).toBe(`${defaultPrefix} ${
      levelPrefixes.warn
    }: line1
${defaultPrefix} ${levelPrefixes.warn}: line2
${defaultPrefix} ${levelPrefixes.warn}: line3`);
    expect(globalConsole.error.mock.calls[0][0]).toBe(`${defaultPrefix} ${
      levelPrefixes.error
    }: line1
${defaultPrefix} ${levelPrefixes.error}: line2
${defaultPrefix} ${levelPrefixes.error}: line3`);
  });
});
