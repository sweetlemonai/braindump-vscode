# `.bd` Syntax Inventory (pre-rewrite)

Source of truth for the rewrite. Every construct listed here **must still highlight**
after Step 2. If a construct is missing from the rewrite, that is a regression.

- Grammar: [syntaxes/braindump.tmLanguage.json](../syntaxes/braindump.tmLanguage.json)
- Theme:   [themes/braindump-color-theme.json](../themes/braindump-color-theme.json)
- Language config: [language-configuration.json](../language-configuration.json)
- Build script: [src/build.mjs](../src/build.mjs) — this builds the *themes*, not
  the grammar. The grammar is hand-written JSON; no build step generates it.
- Visual reference: [images/all.png](../images/all.png)

Grammar `scopeName` is `source.bd`. Language id is `braindump`, extension `.bd`.

All existing scope names are non-standard (e.g. `h1.braindump`, `star.braindump`).
None of them inherit from TextMate conventions like `markup.*` / `entity.*`, which
is precisely why highlighting only shows up under the bundled theme — this is the
bug the rewrite fixes.

---

## Construct table

Column definitions:
- **Example** — a literal line from a `.bd` file.
- **Pattern** — the regex in the grammar today (escaping preserved from JSON).
- **Scope** — the current non-standard scope name the grammar emits.
- **Themed?** — whether `themes/braindump-color-theme.json` styles this scope.
- **Notes** — anchoring, captures, or known issues.

### Block-level line starters (anchored `^`)

| # | Construct | Example | Pattern | Scope | Themed? | Notes |
|---|---|---|---|---|---|---|
| 1 | H1 heading | `# Heading 1` | `^([\s+]*(#\s))(.*)` | `h1.braindump` | Y | Hard-coded `foreground` in grammar (`#e47a0a`). |
| 2 | H2 heading | `## Heading 2` | `^([\s+]*(##\s))(.*)` | `h2.braindump` | Y | |
| 3 | H3 heading | `### Heading 3` | `^([\s+]*(###\s))(.*)` | `h3.braindump` | Y | H4/H5/H6 not in grammar. |
| 4 | Underline 1 | `_ something` | `^([\s+]*(_\s))(.*)` | `d1.braindump` | **N** | Tokenised but no theme rule; not shown in `all.png`. |
| 5 | Underline 2 | `__ something` | `^([\s+]*(__\s))(.*)` | `d2.braindump` | **N** | Same — dead-ish. |
| 6 | Category 1 | `= Category 1` | `^([\s+]*(=\s))(.*)` | `eq.braindump` | Y | |
| 7 | Category 2 | `== Category 2` | `^([\s+]*(==\s))(.*)` | `eqeq.braindump` | Y | |
| 8 | Category 3 | `=== Category 3` | `^([\s+]*(===\s))(.*)` | `eqeqeq.braindump` | Y | |
| 9 | Section 1 | `+ Section 1` | `^([\s]*([+]\s))(.*)` | `plus.braindump` | Y | |
| 10 | Section 2 | `++ Section 2` | `^([\s]*(\+\+\s))(.*)` | `plusplus.braindump` | Y | |
| 11 | Section 3 | `+++ Section 3` | `^([\s]*(\+\+\+\s))(.*)` | `plusplusplus.braindump` | Y | |
| 12 | Item 1 | `- item 1` | `^([\s]*(-\s))(.*)` | `minus.braindump` | Y | |
| 13 | Item 2 | `-- item 2` | `^([\s]*(--\s))(.*)` | `minusminus.braindump` | Y | |
| 14 | Item 3 | `--- item 3` | `^([\s]*(---\s))(.*)` | `minusminusminus.braindump` | Y | |
| 15 | Important 1 | `* important 1` | `^([\s]*(\*\s))(.*)` | `star.braindump` | Y | |
| 16 | Important 2 | `** important 2` | `^([\s]*(\*\*\s))(.*)` | `starstar.braindump` | Y | |
| 17 | Important 3 | `*** important 3` | `^([\s]*(\*\*\*\s))(.*)` | `starstarstar.braindump` | Y | |
| 18 | Question 1 | `? question 1` | `^([\s]*(\?\s))(.*)` | `question.braindump` | Y | |
| 19 | Question 2 | `?? question 2` | `^([\s]*(\?\?\s))(.*)` | `questionquestion.braindump` | Y | |
| 20 | Question 3 | `??? question 3` | `^([\s]*(\?\?\?\s))(.*)` | `questionquestionquestion.braindump` | Y | |
| 21 | Mention | `@ mention` | `^([\s]*(\@))(.*)` | `mention.braindump` | Y | Anchored — only at start of line, and no trailing space required. Does **not** match mid-line `@alice`. |
| 22 | Admiration | `! admiration` | `^([\s]*(\!\s))(.*)` | `exclamation.braindump` | Y | |
| 23 | Command `>` 1 | `> command 1` | `^([\s+]*([>]\s))(.*)` | `gt.braindump` | Y | |
| 24 | Command `>>` 2 | `>> command 2` | `^([\s+]*(\>\>\s))(.*)` | `gtgt.braindump` | Y | |
| 25 | Command `>>>` 3 | `>>> command 3` | `^([\s+]*(\>\>\>\s))(.*)` | `gtgtgt.braindump` | Y | |
| 26 | Command `<` 1 | `< command 1` | `^([\s+]*([<]\s))(.*)` | `lt.braindump` | Y | |
| 27 | Command `<<` 2 | `<< command 2` | `^([\s+]*(\<\<\s))(.*)` | `ltlt.braindump` | Y | |
| 28 | Command `<<<` 3 | `<<< command 3` | `^([\s+]*(\<\<\<\s))(.*)` | `ltltlt.braindump` | Y | |
| 29 | Comment line | `// comment` | `^([\s+]*(//\s))(.*)` | `comment.braindump` | Y | Requires trailing space after `//`. |
| 30 | Parenthesis line | `(Parentheses)` | `^([\s+]*(\(.*\)\s))(.*)` | `parenthesis.braindump` | Y | Match requires a space **after** the closing paren. Bare `(Parentheses)` at EOL also matches in practice (regex is permissive on `.*`). Repository entry is a single pattern (no `patterns` array) — behaves as a pattern; works. |
| 31 | Bracket line | `[array, ...]` | `^([\s+]*(\[.*\]\s))(.*)` | `bracket.braindump` | Y | As above. |
| 32 | Curly bracket line | `{curly brackets}` | `^([\s+]*(\{.*\}\s))(.*)` | `curlybracket.braindump` | Y | As above. |
| 33 | URL line | `http://website.com` | `^(http\|https)(.*)` | `link.braindump` | Y | Matches any line *starting* with `http`/`https` — so mid-line URLs are **not** highlighted. |

### Line-level with captures

| # | Construct | Example | Pattern | Scope(s) | Themed? | Notes |
|---|---|---|---|---|---|---|
| 34 | Key-value | `key: value` | `^([\S\s].*(:))\s(.*)` | `keyvalue.braindump` with captures `key.keyvalue.braindump`, `colon.keyvalue.braindump`, `value.keyvalue.braindump` | Y | Greedy match; on lines with multiple `:` it captures up to the **last** colon. An alternative `matchX` is kept in the JSON but ignored by the engine. |
| 35 | Ordered list | `1. list item` | `([0-9]+[/.])([^0-9])(.*)` | `ol.braindump` with captures `start.ol.braindump`, `end.ol.braindump`, `end.ol.braindump` | Y (start+end) | **Not** anchored to `^` — any `123. x` substring matches. Accepts `.` **or** `/`. |
| 36 | Alpha list | `a. list item a` | `([A-Za-z0-9]+[/.])([^0-9])(.*)` | `ul.braindump` with captures `start.ul.braindump`, `end.ul.braindump`, `end.ul.braindump` | Y (start+end) | Overlaps with `ol`; `ol` runs first so digits go to `ol`. Also not anchored. |

### Inline delimited spans

| # | Construct | Example | Begin / End | Scope | Themed? | Notes |
|---|---|---|---|---|---|---|
| 37 | Double-quoted string | `"ipsum"` | `"` … `"` | `dquote.braindump` | Y | Inner `\\\\.` escape rule present. |
| 38 | Backtick string | `` `ipsum` `` | `` ` `` … `` ` `` | `tquote.braindump` | Y | Same escape rule. |
| 39 | Single-quoted string | `'amet'` | `'` … `'` | `squote.braindump` | **N** | **BUG** — patterns list references `#squote`, repository key is `_squote`. Include silently fails, and the theme has no `squote.braindump` rule either. Effectively dead today. Rewrite should resurrect it under a `string.quoted.single.bd` scope. |

---

## Constructs the current grammar does **not** recognise

These appear in the spec's Step 2 scope map but have **no** equivalent in the
current grammar. Adding them in the rewrite is a new feature, not a
preservation obligation:

- H4–H6 (`####` – `######`)
- Markdown-style todos `[ ]`, `[x]`, `[-]`
- Hash tags `#project` (mid-line)
- `@mention` mid-line
- Wiki links `[[note]]`
- URLs mid-line
- Bold `**x**`, italic `*x*` / `_x_`, strikethrough `~~x~~` **inline** (the
  current grammar only uses `*`, `**`, `***`, `_`, `__` as **line starters**)
- Inline code `` `x` `` as distinct from a backtick-delimited string span — the
  current `tquote` rule already covers the tokenisation, but emits a
  non-standard scope.
- Fenced code blocks ```` ```lang ```` — not recognised at all.
- Blockquote `> quoted` — the current `gt` rule exists but is a one-liner, not a
  block. Behaviour overlaps.
- Priority markers `!`, `!!`, `!!!` — the current grammar only has `!` (as
  `exclamation`) and `*` / `**` / `***` (as `star*`). There is no graded
  priority notion. Mapping in the rewrite needs a decision (see Open
  Questions).
- Dates `2026-04-19`, `@today`
- Horizontal rule `---` — the current grammar matches `---` as a *list item 3*
  prefix (`minusminusminus`), not a separator.

## Known bugs / quirks worth flagging

1. **Broken `squote` include** (#39 above). Safe to fix in the rewrite.
2. **H4-H6 don't exist.** The rewrite's Step 2 scope map covers them; decide
   whether they should highlight as headings or fall back to body text.
3. **`d1` / `d2` (`_ foo`, `__ foo`) are tokenised but not themed.** Either
   drop them, or assign a real scope.
4. **`ol` / `ul` are not line-anchored.** Any mid-line `1.` or `a.` currently
   highlights. Likely accidental. Rewrite should probably anchor with `^\s*`.
5. **`link` only matches line-start URLs.** Mid-line URLs are not highlighted.
   The rewrite should match URLs anywhere.
6. **`comment.braindump` requires a trailing space** after `//`. Lines like
   `//no-space` don't highlight. Rewrite should relax this.
7. **Priority collision.** The spec proposes `!!!` / `!!` / `!` for priorities.
   The current grammar's `*`/`**`/`***` (important) and `?`/`??`/`???`
   (question) and `!`/`exclamation` cover similar territory. Step 2 needs to
   decide whether "priority" in the spec refers to the existing
   `star*`/`exclamation` families, or is a **new** construct.

## Scope-name convention going forward

Every construct in this table must map to a standard TextMate scope in the
rewrite, per the scope map in the spec. The general rule:

- Pick the closest standard root (`markup.*`, `entity.*`, `keyword.*`,
  `constant.*`, `string.*`, `comment.*`, `punctuation.definition.*`).
- Append `.bd` as the leaf so our theme can override precisely.
- If no standard scope fits, extend the scope map in the spec **before**
  inventing a new root.

## Open questions for Step 2

1. **Priority vs. star/exclamation collision.** Is `!`/`!!`/`!!!` meant to
   replace `exclamation` / `starstar` / `starstarstar`, or be a separate
   construct? See known-bugs #7.
2. **H4–H6.** Do we add them (the spec implies yes), given no existing notes
   use them?
3. **`d1`/`d2` underscore-prefix lines.** Keep (and assign a real scope), or
   drop?
4. **`---` — horizontal rule or list-item-3?** Mutually exclusive. Spec calls
   for HR (`meta.separator.bd`); current grammar treats it as a list item.
   Flag this as a semantics change: existing notes that relied on `---` as a
   deep list item will render differently.
5. **`@` without trailing space.** Current grammar matches `@mention` only at
   line start and without requiring a space. Step 2's `variable.other.mention`
   scope is mid-line. Does line-start `@mention` (the current behaviour) stay
   supported as a special case, or collapse into the generic mid-line rule?
