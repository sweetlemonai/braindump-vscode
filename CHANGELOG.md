# Changelog

## 1.5.0 — 2026-05-03

- **Heading folding.** `#` / `##` / `###` heading lines and depth-1 `=` lines now collapse to a folding range, scoped by depth (a `##` folds until the next `##` or `#`; a `=` folds until the next `=` or any `#`).
- **Zebra no longer clobbers inline tokens.** Strings, mentions, URLs, and `--flags` keep their own color on alt-colored bullet rows; the zebra decoration now skips inline-token ranges instead of painting over them.
- **`@` mention rewrite.** Two rules: `@word` stops at the first whitespace; `@ word word word` extends to end of line. A trailing `// comment` on a `@ ` line terminates the mention and renders as a comment. `foo@bar.com` is still plain text.
- **Bracket / paren coloring restored after save.** The colors panel now writes the punctuation scopes alongside the content scopes, so a saved palette no longer drops the `(` `)` `[` `]` colors.
- **Editable list-alt (zebra) color.** New "List alt row" entry in the colors panel; saved alongside other tokens, picked up live by the zebra decoration.

## 1.4.1 — 2026-05-03

- README rewrite for clarity, plus screenshots of the customization panel and refreshed syntax sample.

## 1.4.0 — 2026-05-03

- **Color customization panel.** New command `Braindump: Customize colors` opens a webview with five preset palettes (Original, Minimal, Sunset, Ocean, Light) and a per-token color picker for every depth-1 token. Customizations save to user `settings.json` under the `[braindump]` scope; depth-2/3 colors auto-derive as 10%/20% darker.
- **Syntax reference command.** `Braindump: Show syntax reference` opens an untitled `.bd` buffer demonstrating every marker in idiomatic usage.
- **File icon.** `.bd` files now show a dedicated icon in the editor tab and (where supported) the file explorer.
- **Multi-word keys.** Key/value highlighting now accepts space-separated keys (`due date: tomorrow`), not just single-word identifiers.
- **Back marker recolor.** `<` / `<<` / `<<<` shifted from blue to sage green so they no longer collide with the cyan category (`=`) family while still pairing with the teal forward (`>`).
- Task body Cmd/Ctrl-click underline no longer extends across the leading space between the bracket and the body text.

## 1.3.0 — 2026-05-03

First release with runtime code (TS + esbuild bundle).

- **Outline.** Indentation-driven, three levels max. Level 1 = every heading, Level 2 = shallowest indent inside the heading's body, Level 3 = next-deeper indent. Excludes comments and fenced code blocks.
- **Status bar.** `<words>w  ?<open questions>  √<done>/<total tasks>` — segments only appear when they have something to report. Hides on non-`.bd` files.
- **Tasks.** New `[ ]` / `[x]` / `[X]` line type. Bracket-only coloring (matches the `+` section pink). Toggle by single-click on the bracket, Cmd/Ctrl-click on the body, or `Cmd+Shift+Enter` keybinding. Disambiguated from bracket-line labels.
- **Mention completion.** Typing `@` lists every `@name` already used in the file, sorted by frequency. Emails excluded.
- **Bullet zebra.** Even-indexed rows in a `-` bullet run get a slightly modulated body color. Resets on blank or non-bullet lines. Theme-switch reactive without reload.
- **Bracket pair colorization disabled** for `.bd` files so VS Code's built-in colorizer doesn't override our scope-based bracket colors.
- Bracket-line rule relaxed: trailing content after the closing `]` is now allowed (line-start anchor preserved).

## 1.2.0 — 2026-05-02

Full rewrite as a purely declarative grammar extension.

- Registers `braindump` language for `.bd` files.
- TextMate grammar with custom `*.braindump` scopes covering headings, categories, sections, questions, alerts, comments, lists (numbered + lettered), bullets, priority, forward / back refs, key:value, brace / paren / bracket lines, mentions, flags, URLs, strings, fenced code.
- Three-depth coloring (`#`, `=`, `+`, `?`, `-`, `*`, `>`, `<`).
- `configurationDefaults.editor.tokenColorCustomizations` applies light + dark palettes only inside `.bd` files (scope-suffix isolation, top-level rules + `[*Light*]` glob override).
- Sample `sample.bd` with positive, negative, and edge-case coverage.
