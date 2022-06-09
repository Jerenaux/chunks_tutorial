module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ["airbnb-base", "plugin:prettier/recommended"],
  parser: "@babel/eslint-parser",
  parserOptions: {
    ecmaVersion: 2021,
    requireConfigFile: false,
  },
  rules: {
    "import/no-unresolved": 2,
    "import/no-commonjs": 2,
    "no-console": 0,
    "import/prefer-default-export": 0,
    "import/no-default-export": 1,
    "import/extensions": [2, "ignorePackages"],
    "import/no-extraneous-dependencies": ["error", { devDependencies: true }],
    "no-param-reassign": ["error"],
    "sort-imports": ["error", { ignoreDeclarationSort: true }],
  },
};
