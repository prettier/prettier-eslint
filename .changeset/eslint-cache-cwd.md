---
"prettier-eslint": patch
---

Include the effective `cwd` in the ESLint instance and config cache keys, so a `process.cwd()` change no longer returns an entry resolved for a different directory.
