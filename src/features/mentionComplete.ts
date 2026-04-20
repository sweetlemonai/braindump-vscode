import * as vscode from 'vscode';
import type { WorkspaceIndex } from '../lib/workspaceIndex';

const GUARD_CHARS = /[\s([{"',.:;]/;

export class BraindumpMentionCompletionProvider implements vscode.CompletionItemProvider {
  constructor(private readonly index: WorkspaceIndex) {}

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] {
    const lineText = document.lineAt(position.line).text;
    const prefix = lineText.substring(0, position.character);
    const atIndex = prefix.lastIndexOf('@');
    if (atIndex === -1) return [];

    // Same guard as the grammar's mention-inline rule: '@' preceded by SOL
    // or one of [space ( [ { " ' , . : ;]. Anything else (e.g. an email
    // address 'foo@bar.com') is not a mention insertion site.
    if (atIndex > 0) {
      const prev = prefix[atIndex - 1];
      if (!GUARD_CHARS.test(prev)) return [];
    }

    // The typed-so-far name (everything between '@' and cursor) must itself
    // look like a valid mention fragment. Anything else means we're not in
    // a mention context any more (e.g. '@alice ' with cursor past a space).
    const typedName = prefix.substring(atIndex + 1);
    if (!/^[\w-]*$/.test(typedName)) return [];

    // Replace the name fragment; keep the user-typed '@'.
    const range = new vscode.Range(position.with(undefined, atIndex + 1), position);

    const mentions = this.index.getAllMentions();
    return mentions.map((m, idx) => {
      const item = new vscode.CompletionItem(m.name, vscode.CompletionItemKind.User);
      item.detail = `mentioned ${m.count} time${m.count === 1 ? '' : 's'}`;
      item.insertText = m.name;
      item.range = range;
      item.sortText = String(idx).padStart(6, '0');
      return item;
    });
  }
}
