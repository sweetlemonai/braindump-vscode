# Change Log

All notable changes to the Braindump extension are documented here. Format
follows [Keep a Changelog](https://keepachangelog.com/).

## 1.1.0 — 2026-04-20

### Added

- Fixed Braindump color palette for `.bd` files. Colors no longer depend
  on the active VS Code theme — the extension paints its own palette via
  editor decorations. Dark and light variants auto-select based on the
  current VS Code color mode.

### Changed

- Extension is no longer categorized as a theme pack, so installing it
  no longer prompts you to change your VS Code theme.

### Removed

- Bundled `Braindump Dark` and `Braindump Light` themes. Use any VS Code
  theme you like; `.bd` files keep their own colors regardless.

## 1.0.0 — 2026-04-20

Full rewrite. `.bd` highlighting now works in **any** theme, the bundled
themes are refreshed and optional, and the extension ships a layer of
smart features on top of the grammar.

### Added

- **Bundled themes: `Braindump Dark` and `Braindump Light`.** Generated
  from a single typed palette (`scripts/build-themes.ts`) with shared
  semantic role names across both variants.
- **Outline / document symbols.** Headings (`#` / `##` / `###`),
  categories (`=` / `==` / `===`), and sections (`+` / `++` / `+++`)
  each form a 3-level nested `Namespace` tree in the outline view,
  breadcrumbs, and `Go to Symbol in Editor…`. Questions (`?`) and
  admirations (`!`) appear as flat `Event` symbols so open items are
  easy to skim.
- **Callout cycle command.** `braindump.cycleAnnotation`, bound to
  <kbd>Cmd+Enter</kbd> (macOS) / <kbd>Ctrl+Enter</kbd>
  (Windows/Linux) when an editor has a `.bd` file focused. Cycles the
  selected line(s) through none → `?` → `!` → `*` → none. Multi-line
  selections use the first non-blank line to determine the transition
  and apply it uniformly; leading whitespace preserved.
- **Mention completion.** Typing `@` in a `.bd` file opens a picker of
  every `@name` used anywhere in the workspace, deduplicated
  case-insensitively and sorted by frequency with per-item count.
  Hyphenated names (`@carol-smith`) are supported; email addresses
  (`foo@bar.com`) are guarded against in both the index and the
  picker.
- **Workspace-wide index.** In-memory index of every `.bd` file in the
  workspace, kept live via `FileSystemWatcher` and dirty-buffer
  re-indexing (250 ms debounce). Backs mention completion and the
  status bar counter; no persistence, rebuilt on activation.
- **Status bar counter.** Right-aligned item shows a callout count for
  the active `.bd` file, with an optional workspace-wide split. Click
  opens a quick-pick of every matching line; selection jumps to the
  line.
- **Language configuration.** Heading-family folding for all three
  level-1/2/3 prefixes, `@mention` word pattern (so double-click
  selects `@alice` as one word), and backtick added to auto-closing /
  surrounding pairs.
- **Snippets.** `today` → `YYYY-MM-DD`, `h1`/`h2`/`h3` → heading
  scaffolds, `q` → `? `, `imp` → `! `, `kv` → `key: value`.
- **Configuration surface.** Two settings: `braindump.statusBar.track`
  (`questions` / `important` / `starred` / `off`; default
  `questions`) and `braindump.statusBar.scope` (`file` / `workspace` /
  `off`; default `file`).
- **Sample document.** `examples/sample.bd` exercises every construct,
  for theme-palette review and regression checks.

### Changed

- **Grammar emits standard TextMate scope names** with a `.bd` leaf
  (e.g. `markup.heading.1.bd`, `keyword.other.annotation.question.bd`,
  `string.quoted.double.bd`), so every VS Code theme colors `.bd`
  files out of the box. Every construct in
  [docs/current-syntax.md](docs/current-syntax.md) still highlights.
- **Bundled theme renamed** from `braindump` to `Braindump Dark`, with
  `Braindump Light` added as a new variant. Users who had
  `"workbench.colorTheme": "braindump"` selected will need to re-pick
  from the theme picker — syntax highlighting now works without any
  theme switch, so the re-pick is optional.
- **`engines.vscode`** bumped to `^1.85.0` (was `^1.37.0`).
- **Tooling modernized.** TypeScript (`strict: true`) with
  esbuild-bundled `dist/extension.js`, ESLint + Prettier, GitHub
  Actions CI running typecheck / lint / grammar snapshots / unit
  tests / production bundle / `vsce package` dry-run. Theme build
  replaced by `scripts/build-themes.ts` (invoke via `npm run
  build:themes`).

### Fixed

- **Single-quoted strings highlight.** The old grammar had an include
  typo (`#squote` pointing at `_squote`), so `'amet'` silently fell
  through to plain text. Now scoped as `string.quoted.single.bd`.
- **String scopes no longer bleed across lines, and apostrophes in
  prose no longer open strings at all.** An apostrophe in words like
  `shouldn't` / `don't` / `what's` no longer starts a single-quote
  string that runs until the next stray `'` on the same line. String
  begins (`"`, `'`, `` ` ``) now require a word-boundary context —
  start of line, whitespace, or one of `([{,.:;` — so word-internal
  apostrophes, measurement marks (`5'9"`), and the like stay plain
  text. String spans also terminate at end-of-line if unclosed.
- **Line-starter markers no longer match a word followed by a dot at
  end of line.** `hello.` used to be colored as an alpha-list because
  the trailing newline satisfied the `\s+` between marker and content.
  All line-starter patterns (headings, categories, sections, items,
  starred, questions, admiration, commands, underscores, mentions,
  ordered list, alpha list, key:value) now use `[ \t]+` for the
  marker–content separator so `\n` can't stand in for a space.
- **Ordered list markers no longer match mid-line.** A sentence like
  `see item 3.` used to tokenise as a list item because the pattern
  was not line-anchored. Now it must start the line (after optional
  whitespace).
- **`//` comment no longer requires a trailing space.** `//no-space`
  is now a comment. A `//(?!/)` guard keeps `://` in a URL from being
  re-tokenised.

### Removed

- The old bundled theme (`themes/braindump-color-theme.json`) and
  obsolete theme-build scripts (`src/build.mjs`, `src/workbench/`,
  `src/colors.mjs`, `src/syntax.mjs`, `src/createSyntax.mjs`,
  `src/buildTheme.mjs`, `src/buildAllThemes.mjs`,
  `src/makeThemePath.mjs`). Replaced by `scripts/build-themes.ts`.
- `themes/uva.json`, `vscodecustom.css`, and the hand-rolled
  `release:*` scripts.
- `language-configuration.json`'s `blockComment` entry — `.bd` has no
  block-comment syntax.

### Notes

- Deferred to follow-ups (see
  [docs/future-additions.md](docs/future-additions.md)): nested scope
  highlighting for URLs and mentions inside strings and line-level
  parens/brackets/braces, `onEnterRules` for list continuation, and
  any form of rendered/preview mode.

## 0.0.10

- Initial published state, pre-rewrite. Syntax highlighting only
  visible when the bundled `braindump` theme was selected.
