---
"prettier-eslint": patch
---

With `indent: tab`, read `tabWidth` from `max-len` the way ESLint does, so a positional line length (`['error', 120]`) is no longer used as the tab width.
