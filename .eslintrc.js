const config = {
  extends: ["kentcdodds", "kentcdodds/jest"],
  parser: "babel-eslint",
  rules: {
    "valid-jsdoc": "off",
    "max-len": "off",
    "space-before-function-paren": [
      "error",
      {
        anonymous: "never",
        named: "never",
        asyncArrow: "always",
      },
    ],
    "comma-dangle": ["error", "never"],
    "arrow-parens": ["error", "as-needed"],
  },
};

module.exports = config;
