# Examples

## gulp

We can wrap `prettier-eslint` with a plugin to provide a simple interface

### Task

```js
var prettierEslint = require('./plugins/prettier-eslint');

gulp.task('js:format', function () {
  return gulp
    .src('[source glob]')
    .pipe(prettierEslint())
    .pipe(gulp.dest('[dest folder]')); // same folder to overwrite files
});
```

### Plugin (prettier-eslint.js)

(using [through2][through2] to help deal with streams)

```js
var through = require('through2');
var prettierEslint = require('prettier-eslint');

const options = {
  eslintConfig: {
    parserOptions: {
      ecmaVersion: 7
    },
    rules: {
      semi: ['error', 'never']
    }
  },
  prettierOptions: {
    bracketSpacing: true
  }
};

module.exports = function () {
  return through.obj(format);

  function format(file, encoding, callback) {
    if (file.isNull()) {
      return callback(null, file);
    }

    if (file.isStream()) {
      return callback(
        new utils.PluginError('prettier-eslint', "doesn't support Streams")
      );
    }

    const sourceCode = file.contents.toString();
    const formatted = prettierEslint({
      ...config,
      text: sourceCode
    });

    file.contents = new Buffer(formatted, encoding);

    return callback(null, file);
  }
};
```

[through2]: https://github.com/rvagg/through2
