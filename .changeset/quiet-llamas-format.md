---
"prettier-eslint": patch
---

Improve repeated formatting performance by caching ESLint instances and resolved configs, and by skipping expensive log serialization unless verbose logging is enabled.
