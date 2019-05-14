const fs = require.requireActual("fs");

const handledMethods = {
  readFile: true,
  readFileSync: true
};

function wrapFileSystem(fsToWrap) {
  return new Proxy(fsToWrap, {
    get: (target, key) => {
      const value = target[key];

      if (!handledMethods.hasOwnProperty(key)) {
        // return the original method if it's not one we want to wrap
        return value;
      }

      // eslint-disable-next-line func-names
      return jest.fn(function(filePath, ...args) {
        if (filePath.endsWith("package.json")) {
          return JSON.stringify({
            name: "fake",
            version: "0.0.0",
            // this empty prettier config entry prevents the config resolver from continuing to search for a config
            prettier: {}
          });
        } else if (/\.[jt]s$/.test(filePath)) {
          return "var fake = true";
        }

        // eslint-disable-next-line babel/no-invalid-this
        return value.call(this, filePath, ...args);
      });
    }
  });
}

module.exports = wrapFileSystem(fs);
