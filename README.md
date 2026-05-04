# Braindump

**A note-taking syntax for people who think in plain text.**

A small set of line-leading symbols (`#`, `+`, `-`, `?`, `!`, `>`, `<`, `//`) turn a plain text file into a structured note — without ever leaving plain text.

There's no preview mode. No compile step. What you type is what you read.

<p align="center">
  <img src="https://raw.githubusercontent.com/sweetlemonai/braindump-language/main/images/note.png" alt="Braindump Colors" width="600" />
</p>

## Why braindump

Markdown was designed for documents you publish. Braindump is designed for notes you _keep_: running thoughts, todo lists, meeting scribbles, half-formed ideas, project plans you write for yourself.

That distinction matters because of one design choice: **braindump has no source/preview split.** In Markdown, you write `## Heading` and flip to a preview to see it styled. In braindump, the `##` stays visible and gets colored. There's no edit-mode, no read-mode, no toggle. You write your notes once and read them in the same view.

That single rule — what you type is what you see — shapes everything. The syntax is short enough to remember, the symbols are unambiguous, and your eye finds structure instantly because the markers are right there in the text.

Braindump isn't a Markdown replacement, a wiki, or a personal-knowledge-management system. It doesn't link between files, render to HTML, or have plugins. It's syntax highlighting for plain text notes. That's the whole pitch.

## What you get

**Tasks.** Write `[ ]` for an open task, `[x]` for done. Click the checkbox to toggle, or `Cmd+Click` (Mac) / `Ctrl+Click` (Win/Linux) anywhere on the task body. Done and open look the same except for the `x` itself — no strikethrough, no dimming, just clean state.

**Customizable colors.** Open `Cmd+Shift+P` → **"Braindump: Customize colors"** to pick from five bundled presets (Original, Minimal, Sunset, Ocean, Light) or fine-tune individual token colors. The panel exposes a row for every visible token, including a separate **key**, **value**, and **separator** triple for each of the four key/value forms (`:`, `=`, `=>`, `->`), and primary + alt colors for each list family (bullet, numbered, lettered). Customizations save to your user settings and sync across machines via VS Code Settings Sync. To disable zebra alternation for a list type, set its primary and alt colors to the same value.

**Outline panel.** Press `Cmd+Shift+O` (Mac) / `Ctrl+Shift+O` (Win/Linux) to navigate any braindump file by its structure. Headings, sections, and indented items become a three-level outline you can jump through.

**Status bar.** Word count, open question count, and done/total task ratio for the current file. Updates as you type. Disappears when the active editor isn't a `.bd` file.

**Mention completion.** Type `@` and get a dropdown of every `@name` already used in the file, sorted by frequency. Email addresses and URL fragments don't pollute the list.

**List zebra.** Long uniform runs of `-` bullets, numbered lists (`1.` `2.` …), or lettered lists (`a.` `b.` …) get alternating-row coloring on the body text so the eye picks up rhythm. Each family has its own primary and alt color slots. Resets at every blank line or when the family changes. Tasks are excluded.

**Code blocks with language highlighting.** Fenced blocks (` ``` `) embed real syntax highlighting for ten languages — `typescript`/`ts`, `javascript`/`js`, `python`/`py`, `json`, `bash`/`sh`, `html`, `css`, `sql`, `yaml`, `markdown`. Bare or unknown-language fences render plain. Braindump tokens never bleed in.

**Light & dark palettes.** Auto-detected from your active VS Code theme name. Colors render the same regardless of which theme you have active — your theme stays untouched outside `.bd` files.

<p align="center">
  <img src="https://raw.githubusercontent.com/sweetlemonai/braindump-language/main/images/colors.png" alt="Braindump Colors" width="600" />
</p>

## A taste of the syntax

```braindump
# Trip to Lisbon
## Logistics
    + Flights
        - book ALA → LIS
        ? cheaper midweek?
    + Hotel
        - near the water
        ! confirm by Friday

## People
    @ alice handling visa
    @ bob meeting us there

// remember to renew passport before 30 days
```

## Syntax reference

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
| `key: value`               | Key/value pair (colon)                        | Key, separator, and value each colorable             |
| `key = value`              | Key/value pair (equals)                       | Same as above, distinct separator scope              |
| `key => value`             | Key/value pair (fat arrow)                    | Same as above, distinct separator scope              |
| `key -> value`             | Key/value pair (thin arrow)                   | Same as above, distinct separator scope              |
| `(line)` `[line]` `{line}` | Bracket / brace lines                         | Whole line, distinct char and content colors         |
| `@mention`                 | Mention                                       | Token only                                           |
| `--flag`                   | CLI flag                                      | Token only                                           |
| `https://…`                | URL, underlined                               | Token only                                           |
| `"double"`                 | String                                        | Token only                                           |
| ` ``` ` … ` ``` `          | Fenced code block, suspends all tokens inside | Block                                                |

For every marker with worked examples, run `Braindump: Show syntax reference` from the command palette, or open [`sample.bd`](sample.bd).

## Troubleshooting

**My notes aren't colored.** Check the bottom-right of the status bar. If it says "Plain Text," click it and pick "Braindump." Saving with a `.bd` extension makes this automatic next time.

**The wrong palette loads.** Braindump auto-detects light/dark by theme name. If your light theme doesn't include "Light" in its name, add this to your User Settings (JSON):

```json
"editor.tokenColorCustomizations": {
  "[Your Theme Name]": {
    // copy the [*Light*] block from this extension's package.json here
  }
}
```

**The outline is empty.** The file isn't being recognized as braindump. Same fix as the first item.

## Issues and contributing

Bugs and feature requests: [github.com/sweetlemonai/braindump-vscode](https://github.com/sweetlemonai/braindump-vscode).

The grammar lives in [`syntaxes/braindump.tmLanguage.json`](syntaxes/braindump.tmLanguage.json); colors live in `package.json` under `contributes.configurationDefaults`.

## License

MIT.
