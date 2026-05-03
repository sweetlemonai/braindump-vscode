import * as vscode from 'vscode';

// Same shape as the grammar's mention rule: @ preceded by whitespace or
// line-start (so emails like foo@bar.com don't match), optional single space
// between @ and the name, then a Unicode-letter/digit-leading word.
const MENTION_RE = /(?<!\S)@\s?([\p{L}\p{N}][\p{L}\p{N}_-]*)/gu;

class BraindumpMentionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    _position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext
  ): vscode.CompletionItem[] {
    const counts = new Map<string, number>();
    const text = document.getText();

    MENTION_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = MENTION_RE.exec(text)) !== null) {
      const name = match[1];
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }

    if (counts.size === 0) return [];

    const sorted = [...counts.entries()].sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]; // frequency desc
      return a[0].localeCompare(b[0]); // alpha asc as tiebreak
    });

    return sorted.map(([name, count], index) => {
      const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.User);
      item.detail = `${count} use${count === 1 ? '' : 's'}`;
      // Preserve frequency order; default sort would be alphabetical.
      item.sortText = String(index).padStart(5, '0');
      return item;
    });
  }
}

export function registerMentionCompletion(): vscode.Disposable {
  return vscode.languages.registerCompletionItemProvider(
    { scheme: 'file', language: 'braindump' },
    new BraindumpMentionProvider(),
    '@'
  );
}
