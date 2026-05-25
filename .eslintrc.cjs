module.exports = {
  root: true,
  ignorePatterns: ["dist/", "node_modules/"],
  overrides: [
    {
      files: ["src/**/*.ts"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        tsconfigRootDir: __dirname,
        sourceType: "module",
      },
      plugins: ["@typescript-eslint"],
      rules: {},
    },
  ],
};
