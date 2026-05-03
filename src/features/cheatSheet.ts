import * as vscode from 'vscode';

export const SHOW_CHEAT_SHEET_COMMAND = 'braindump.showCheatSheet';

const CHEAT_SHEET = `# Braindump syntax reference
## Quick tour of every marker

This file is itself a braindump file. Every marker below is colored
the way it will appear in your own notes.

# Containers (whole-line color)
## Use these for document structure

# Heading           the spine of the document
## Sub-heading      one level deeper
### Sub-sub         third level

= Category          a bucket that groups peers
== Sub-category     nested category
=== Deep category   third level

+ Section           a named thing you're elaborating on
++ Sub-section      nested
+++ Deep section    third level


# Items (marker only — text stays default)

- bullet item       a peer in a list
-- nested bullet    deeper
--- deeper still    third level

* important         marker is red, text default
** more important
*** most important

> forward ref       a command, invocation, or pointer forward
>> deeper
>>> deepest

< back ref          a quote, source, or pointer back
<< deeper
<<< deepest


# Annotations (line modifiers)

? open question     italic green
?? deeper question
??? deepest

! alert             bold yellow
@ alice             mention — the @ and name
// comment          italic muted purple
                    /// triple slash is plain text


# Lists

1. numbered list    whole line gold
2. second item
10. tenth item

a. lettered list    whole line gold
b. second item


# Key-value and labels

name: braindump     just the key is colored
status: shipped     value stays default

_ underscore label  rare, but supported


# Brackets (three distinct signatures)

(parens label)      gold outside, olive inside
[bracket label]     olive outside, gold inside
{brace label}       whole line pink


# Inline tokens

Edit at https://example.com or ping @bob about it.
"double-quoted strings" are colored.
'single' and \`backticks\` render as plain text.
--flag (no space after dashes) is a CLI flag.


# Try it

Close this file and create your own .bd file anywhere.
All the colors above will work in your file too — the
extension applies to every .bd file regardless of which
VS Code theme you have active.
`;

export async function showCheatSheet(): Promise<void> {
  const doc = await vscode.workspace.openTextDocument({
    language: 'braindump',
    content: CHEAT_SHEET,
  });
  const targetColumn = vscode.window.activeTextEditor
    ? vscode.ViewColumn.Beside
    : vscode.ViewColumn.Active;
  await vscode.window.showTextDocument(doc, { viewColumn: targetColumn, preview: false });
}
