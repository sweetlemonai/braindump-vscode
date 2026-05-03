# Changelog

## 1.2.0 — 2026-05-02

Full rewrite as a purely declarative grammar extension.

- Registers `braindump` language for `.bd` files.
- TextMate grammar with custom `*.braindump` scopes covering headings, categories, sections, questions, alerts, comments, lists (numbered + lettered), bullets, priority, forward / back refs, key:value, brace / paren / bracket lines, mentions, flags, URLs, strings, fenced code.
- Three-depth coloring (`#`, `=`, `+`, `?`, `-`, `*`, `>`, `<`).
- `configurationDefaults.editor.tokenColorCustomizations` applies light + dark palettes only inside `.bd` files (scope-suffix isolation, top-level rules + `[*Light*]` glob override).
- Sample `sample.bd` with positive, negative, and edge-case coverage.
