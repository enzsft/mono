module.exports = {
  moduleFileExtensions: ["ts", "js", "json", "node"],
  modulePathIgnorePatterns: ["/.build/"],
  testPathIgnorePatterns: ["/node_modules/", "/.build/"],
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(js|ts)$",
  transform: {
    "^.+\\.(js|ts)$": "ts-jest",
  },
  watchPathIgnorePatterns: ["__mono_repo_fixture__"],
};
