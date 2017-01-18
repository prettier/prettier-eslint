# prettier-eslint

Formats your JavaScript using [`prettier`][prettier] followed by [`eslint --fix`][eslint]

[![Build Status][build-badge]][build]
[![Code Coverage][coverage-badge]][coverage]
[![Dependencies][dependencyci-badge]][dependencyci]
[![version][version-badge]][package]
[![downloads][downloads-badge]][npm-stat]
[![MIT License][license-badge]][LICENSE]

[![All Contributors](https://img.shields.io/badge/all_contributors-4-orange.svg?style=flat-square)](#contributors)
[![PRs Welcome][prs-badge]][prs]
[![Donate][donate-badge]][donate]
[![Code of Conduct][coc-badge]][coc]
[![Roadmap][roadmap-badge]][roadmap]
[![Examples][examples-badge]][examples]

[![Watch on GitHub][github-watch-badge]][github-watch]
[![Star on GitHub][github-star-badge]][github-star]
[![Tweet][twitter-badge]][twitter]

## The problem

[`prettier`][prettier] can do some really fantastic automatic formatting. And one of the nice things about it is how
opinionated it is. Unfortunately it's either not opinionated enough in some respects and other opinions differ from my
own.

## This solution

This formats your code via `prettier`, and then passes the result of that to `eslint --fix`. This way you can get the
benefits of `prettier`'s superior formatting capabilities, but also benefit from the configuration capabilities of
`eslint`.

## Installation

This module is distributed via [npm][npm] which is bundled with [node][node] and should be installed as one of your
project's `devDependencies`:

```
npm install --save-dev prettier-eslint
```

## Usage

### Example

```javascript
const format = require('prettier-eslint')

// notice, no semicolon in the original text
const sourceCode = 'const {foo} = bar'

const options = {
  text: sourceCode,
  eslintConfig: {
    parserOptions: {
      ecmaVersion: 7,
    },
    rules: {
      semi: ['error', 'never'],
    },
  },
  prettierOptions: {
    bracketSpacing: true,
  },
}

const formatted = format(options)

// notice no semicolon in the formatted text
formatted // const { foo } = bar
```

### options

#### text (String)

The source code to format.

#### filePath (?String)

The path of the file being formatted can be used in leu of `eslintConfig` (eslint will be used to find the relevant
config for the file).

#### eslintConfig (?Object)

The config to use for formatting with ESLint. If this is provided, then `filePath` is not necessary.

#### prettierOptions (?Object)

The options to pass for formatting with `prettier`. If not provided, `prettier-eslint` will attempt to create the
options based on the `eslintConfig` (whether that's provided or derived via `filePath`.

#### disableLog (?Boolean)

When there's an error, `prettier-eslint` will log it to the console. To disable this behavior you can either pass
`disableLog` as an option to the call to `format` or you can set: `format.options.disableLog = true` to disable it
"globally."

#### eslintPath (?String)

By default, `prettier-eslint` will try to find your project's version of `eslint` (and `prettier`). If it cannot find
one, then it will use the version that `prettier-eslint` has installed locally. If you'd like to specify a path to the
`eslint` module you would like to have `prettier-eslint` use, then you can provide the full path to it with the
`eslintPath` option.

#### prettierPath (?String)

This is basically the same as `eslintPath` except for the `prettier` module.

### throws

`prettier-eslint` will propagate errors when either `prettier` or `eslint` fails for one reason or another. In addition
to propagating the errors, it will also log a specific message indicating what it was doing at the time of the failure.

## Inspiration

- [`prettier`][prettier]
- [`eslint`][eslint]

## Other Solutions

None that I'm aware of. Feel free to file a PR if you know of any other solutions.

## Related

- [`prettier-eslint-atom`](https://github.com/kentcdodds/prettier-eslint-atom) - Atom plugin

## Contributors

Thanks goes to these people ([emoji key][emojis]):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
| [<img src="https://avatars.githubusercontent.com/u/1500684?v=3" width="100px;"/><br /><sub>Kent C. Dodds</sub>](https://kentcdodds.com)<br />[💻](https://github.com/kentcdodds/prettier-eslint/commits?author=kentcdodds) [📖](https://github.com/kentcdodds/prettier-eslint/commits?author=kentcdodds) 🚇 [⚠️](https://github.com/kentcdodds/prettier-eslint/commits?author=kentcdodds) | [<img src="https://avatars.githubusercontent.com/u/5554486?v=3" width="100px;"/><br /><sub>Gyandeep Singh</sub>](http://gyandeeps.com)<br />👀 | [<img src="https://avatars.githubusercontent.com/u/682584?v=3" width="100px;"/><br /><sub>Igor Pnev</sub>](https://github.com/exdeniz)<br />[🐛](https://github.com/kentcdodds/prettier-eslint/issues?q=author%3Aexdeniz) | [<img src="https://avatars.githubusercontent.com/u/813865?v=3" width="100px;"/><br /><sub>Benjamin Tan</sub>](https://demoneaux.github.io/)<br />💁 |
| :---: | :---: | :---: | :---: |
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors][all-contributors] specification. Contributions of any kind welcome!

## LICENSE

MIT

[prettier]: https://github.com/jlongster/prettier
[eslint]: http://eslint.org/
[npm]: https://www.npmjs.com/
[node]: https://nodejs.org
[build-badge]: https://img.shields.io/travis/kentcdodds/prettier-eslint.svg?style=flat-square
[build]: https://travis-ci.org/kentcdodds/prettier-eslint
[coverage-badge]: https://img.shields.io/codecov/c/github/kentcdodds/prettier-eslint.svg?style=flat-square
[coverage]: https://codecov.io/github/kentcdodds/prettier-eslint
[dependencyci-badge]: https://dependencyci.com/github/kentcdodds/prettier-eslint/badge?style=flat-square
[dependencyci]: https://dependencyci.com/github/kentcdodds/prettier-eslint
[version-badge]: https://img.shields.io/npm/v/prettier-eslint.svg?style=flat-square
[package]: https://www.npmjs.com/package/prettier-eslint
[downloads-badge]: https://img.shields.io/npm/dm/prettier-eslint.svg?style=flat-square
[npm-stat]: http://npm-stat.com/charts.html?package=prettier-eslint&from=2016-04-01
[license-badge]: https://img.shields.io/npm/l/prettier-eslint.svg?style=flat-square
[license]: https://github.com/kentcdodds/prettier-eslint/blob/master/other/LICENSE
[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs]: http://makeapullrequest.com
[donate-badge]: https://img.shields.io/badge/$-support-green.svg?style=flat-square
[donate]: http://kcd.im/donate
[coc-badge]: https://img.shields.io/badge/code%20of-conduct-ff69b4.svg?style=flat-square
[coc]: https://github.com/kentcdodds/prettier-eslint/blob/master/other/CODE_OF_CONDUCT.md
[roadmap-badge]: https://img.shields.io/badge/%F0%9F%93%94-roadmap-CD9523.svg?style=flat-square
[roadmap]: https://github.com/kentcdodds/prettier-eslint/blob/master/other/ROADMAP.md
[examples-badge]: https://img.shields.io/badge/%F0%9F%92%A1-examples-8C8E93.svg?style=flat-square
[examples]: https://github.com/kentcdodds/prettier-eslint/blob/master/other/EXAMPLES.md
[github-watch-badge]: https://img.shields.io/github/watchers/kentcdodds/prettier-eslint.svg?style=social
[github-watch]: https://github.com/kentcdodds/prettier-eslint/watchers
[github-star-badge]: https://img.shields.io/github/stars/kentcdodds/prettier-eslint.svg?style=social
[github-star]: https://github.com/kentcdodds/prettier-eslint/stargazers
[twitter]: https://twitter.com/intent/tweet?text=Check%20out%20prettier-eslint!%20https://github.com/kentcdodds/prettier-eslint%20%F0%9F%91%8D
[twitter-badge]: https://img.shields.io/twitter/url/https/github.com/kentcdodds/prettier-eslint.svg?style=social
[emojis]: https://github.com/kentcdodds/all-contributors#emoji-key
[all-contributors]: https://github.com/kentcdodds/all-contributors
