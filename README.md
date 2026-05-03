<div align="center">
  <img src="https://raw.githubusercontent.com/sweetlemonai/braindump-language/main/images/braindump.png" alt="Braindump logo" width="128" />
  <h1>Braindump</h1>
  <p><strong>A note-taking syntax for people who think in plain text.</strong></p>
</div>

---

Braindump is a small set of line-leading symbols (`#`, `+`, `-`, `?`, `!`, `>`, `<`, `//`) that turn a plain text file into a structured note, without ever leaving plain text.

There's no preview mode. No compile step. What you type is what you read.

Open a `.bd` file. Start typing. Your notes get color-coded as you go.

![Braindump sample note in a dark theme](https://raw.githubusercontent.com/sweetlemonai/braindump-language/main/images/note.png)

## Why another note format?

Markdown was designed for documents you publish. Braindump is designed for notes you _keep_: the running thoughts, todo lists, meeting scribbles, half-formed ideas, and project plans you write for yourself.

That distinction matters because of one design choice: **Braindump has no source/preview split**. In Markdown, you write `## Heading` and flip to a preview to see it styled. In Braindump, the `##` stays visible and gets colored. There's no edit-mode, no read-mode, no toggle. You write your notes once and read them in the same view.

That single rule, "what you type is what you see," shapes everything. The syntax is short enough to remember. The symbols are unambiguous. Your eye finds structure instantly because the markers are right there in the text.

## What Braindump isn't

Braindump isn't a Markdown replacement, a wiki, or a personal-knowledge-management system. It doesn't link between files, doesn't render to HTML, doesn't have plugins. It's syntax highlighting for plain text notes. That's the whole pitch.

## The syntax

Every Braindump file is built from a handful of line-leading markers and a few inline tokens. That's the whole language.

<!-- ![Braindump syntax rendered in a dark theme](https://raw.githubusercontent.com/sweetlemonai/braindump-language/main/images/syntax.png) -->

### Structure

```braindump
# Top-level heading
## Subheading
### Sub-subheading

= Category
== Subcategory
=== Sub-subcategory

+ Section
++ Subsection
+++ Sub-subsection
```

Three structural registers, each with three depth levels. `#` for the document outline. `=` for grouping. `+` for naming things you're about to elaborate. Most notes use one or two; few use all three.

### Lists

```braindump
- bullet item
- another bullet

1. ordered item
2. second item
3. third

a. lettered item
b. second
```

Bullets are marker-colored (the body stays default text). Numbered and lettered lists are whole-line colored.

### Annotations

```braindump
? open question
! important
* starred
@alice mentioned
// a comment to yourself
```

Quick markers for the moments you reach for them. `?` for things you don't know yet. `!` for things you can't forget. `*` for things you want to come back to. `@name` for people. `//` for asides.

### References

```braindump
> things going forward, commands, sends, next steps
< things coming back, references, sources, prior context
```

Two arrows for two directions. Use `>` when the line is something you're sending out (a command to run, a message to send, a follow-up to do). Use `<` when the line points back to where something came from (a source, a callback, prior context).

### Tasks

```braindump
[ ] open task
[x] completed task
```

Click the checkbox to toggle, or use `Cmd+Shift+Enter` (Mac) / `Ctrl+Shift+Enter` (Windows/Linux) on the line. Open and completed tasks look the same except for the `x` itself — no strikethrough, no dimming.

### Inline tokens

```braindump
key: value pairs work mid-document
"double-quoted strings" stand out
https://example.com URLs are clickable
--flag CLI flags get their own color
```

These work anywhere: beginning, middle, or end of any line. Email addresses (`foo@bar.com`) and URL query strings (`?q=1`) are handled correctly so they don't trigger false matches.

### Bracket-line labels

```braindump
(parentheses on their own line become a label)
[brackets on their own line become a label]
{braces on their own line become a label}
```

Standalone bracket-lines are colored as labels. Inline parentheticals like "by the way (this aside)" stay plain. Only full-line bracket pairs get treated as labels.

## Syntax at a glance

| Construct                  | What it does                                  | Coloring                                             |
| -------------------------- | --------------------------------------------- | ---------------------------------------------------- |
| `# heading` `## …` `### …` | Heading, three depths                         | Whole line                                           |
| `= category` `==` `===`    | Category, three depths                        | Whole line                                           |
| `+ section` `++` `+++`     | Section, three depths                         | Whole line                                           |
| `? question` `??` `???`    | Question (italic), three depths               | Whole line                                           |
| `! alert`                  | Alert (bold)                                  | Whole line                                           |
| `// comment`               | Line comment (italic)                         | Whole line                                           |
| `1.` `a.` `A.`             | Numbered / lettered list                      | Whole line                                           |
| `> forward` `>>` `>>>`     | Forward reference, three depths               | Whole line                                           |
| `< back` `<<` `<<<`        | Back reference, three depths                  | Whole line                                           |
| `- bullet` `--` `---`      | Bullet, three depths                          | Marker only                                          |
| `* important` `**` `***`   | Priority, three depths                        | Red marker, bold body text                           |
| `[ ]` `[x]`                | Open / completed task                         | Bracket trio colored, body always default text       |
| `key: value`               | Key/value pair                                | Key colored; value colored in light, default in dark |
| `(line)` `[line]` `{line}` | Bracket / brace lines                         | Whole line, distinct char and content colors         |
| `@mention` / `@ mention`   | Mention                                       | Token only                                           |
| `--flag`                   | CLI flag                                      | Token only                                           |
| `https://…`                | URL, underlined                               | Token only                                           |
| `"double"`                 | String                                        | Token only                                           |
| ` ``` ` … ` ``` `          | Fenced code block, suspends all tokens inside | Block                                                |

Full positive, negative, and edge-case coverage lives in `sample.bd`.

## What you get

**Outline panel.** Press `Cmd+Shift+O` (Mac) / `Ctrl+Shift+O` (Windows/Linux) — or open the Outline view in the sidebar — to navigate the structure of your note. The outline is **indentation-driven, three levels max**:

- Level 1: every `#` / `##` / `###` heading (depth distinction collapsed; all flat at top level)
- Level 2: lines at the shallowest non-zero indent inside each heading's body, regardless of marker
- Level 3: lines at the next-deeper indent

Anything more deeply indented than level 3 is excluded. Comments (`//`) and fenced code blocks are excluded too. The entry name is the line text with the marker preserved.

**Status bar.** A compact indicator at the bottom-right shows the shape of the current file:

```
1234w  ?3  √4/12
```

Word count, then `?` + open question count (only if there are any), then `√` + done/total task count (only if there are any tasks). Disappears entirely when the active editor isn't a `.bd` file. Updates as you type.

**Tasks.** Two new line types:

```
[ ] open task
[x] completed task   (X also accepted)
```

The bracket trio is colored. Body text stays default — done and open tasks look identical except for the `x` itself, no strikethrough or dimming. Toggle by **single-clicking the bracket** (cursor changes to a pointer on hover), **Cmd/Ctrl-clicking the body text**, or pressing `Cmd+Shift+Enter` (Mac) / `Ctrl+Shift+Enter` (Win/Linux) on a task line. The cursor stays put when toggled. Pressing the keybinding on a non-task line is a silent no-op.

Disambiguator vs. bracket-line labels: a task has exactly a single space, `x`, or `X` between the brackets. `[Bracket label here]`, `[a]`, `[xy]` all stay bracket-line labels.

**Mention completion.** Type `@` in a `.bd` file and a completion dropdown shows every `@name` already used in this file, sorted by how often you use them. Email addresses (`foo@bar.com`) and URL fragments don't pollute the list.

**Bullet zebra.** Long uniform `-` bullet lists get alternating-row coloring on the body text so the eye picks up rhythm. Marker stays its lavender color; only the body text alternates. The zebra index resets on every blank line and on every non-bullet line — two separate runs don't share an index. Numbered lists (`1.`), lettered lists (`a.`), and tasks (`[ ]`) are excluded. Updates without a reload when you switch between light and dark themes.

## How the colors work

Colors are contributed via `configurationDefaults.editor.tokenColorCustomizations` in `package.json`. Every grammar scope ends in `.braindump` so the rules only fire inside `.bd` files. Nothing else in your editor is affected.

The dark palette is the default. The light palette is contributed via the `[*Light*]` theme-name glob, which matches "Default Light+", "GitHub Light", "Solarized Light", "Quiet Light", and similar. Themes that are visually light but don't include `Light` in their name will receive the dark palette by default; see Troubleshooting below for the workaround.

## Customizing colors

Open the panel via `Cmd+Shift+P` → **"Braindump: Customize colors"**. Pick one of the four bundled presets (Original, Muted, High contrast, Light) for a one-click palette, or fine-tune individual token colors with the per-token color pickers below. Customizations save to your user `settings.json` under the `[braindump]` scope, and persist across machines via VS Code Settings Sync.

## Troubleshooting

**My notes aren't colored.** Check the bottom-right of the status bar. If it says "Plain Text," click it and pick "Braindump" from the list. Saving with a `.bd` extension should make this automatic next time.

**The wrong palette is loading.** Braindump auto-detects light/dark based on the active theme name. If your theme is light but doesn't include "Light" in its name, add this to your User Settings (JSON):

```json
"editor.tokenColorCustomizations": {
  "[Your Theme Name]": {
    // copy the [*Light*] block from this extension's package.json here
  }
}
```

**`Cmd+Shift+Enter` doesn't toggle tasks.** Another extension may have claimed the keybinding. Open Keyboard Shortcuts (`Cmd+K Cmd+S`), search for `cmd+shift+enter`, and look for the conflict. As a fallback, you can also click the `[ ]` or `[x]` directly to toggle.

**The outline is empty.** The file isn't being recognized as Braindump. Same fix as the first item: pick "Braindump" from the language picker in the status bar.

## Issues and feedback

Bugs and feature requests: [github.com/sweetlemonai/braindump-vscode](https://github.com/sweetlemonai/braindump-vscode).

Release notes: [CHANGELOG.md](CHANGELOG.md).

## Contributing

Issues and PRs welcome. The grammar lives in [`syntaxes/braindump.tmLanguage.json`](syntaxes/braindump.tmLanguage.json); colors live in `package.json` under `contributes.configurationDefaults`.

## License

MIT.
