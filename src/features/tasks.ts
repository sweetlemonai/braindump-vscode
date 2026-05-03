import * as vscode from 'vscode';

const TASK_RE = /^(\s*)\[([ xX])\](?=\s|$)/;

export const TOGGLE_COMMAND = 'braindump.toggleTask';

interface ToggleArgs {
  line?: number;
}

export async function toggleTask(args?: ToggleArgs): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  if (editor.document.languageId !== 'braindump') return;

  const lineNum = args?.line ?? editor.selection.active.line;
  if (lineNum < 0 || lineNum >= editor.document.lineCount) return;

  const lineText = editor.document.lineAt(lineNum).text;
  const match = TASK_RE.exec(lineText);
  if (!match) return; // no-op on non-task lines

  const innerColumn = match[1].length + 1; // [ is at indent.length, inner char follows
  const newChar = match[2] === ' ' ? 'x' : ' ';

  const range = new vscode.Range(lineNum, innerColumn, lineNum, innerColumn + 1);
  await editor.edit((builder) => builder.replace(range, newChar), {
    undoStopBefore: false,
    undoStopAfter: false,
  });
}

export class BraindumpTaskLinkProvider implements vscode.DocumentLinkProvider {
  provideDocumentLinks(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.DocumentLink[] {
    const links: vscode.DocumentLink[] = [];

    for (let n = 0; n < document.lineCount; n++) {
      const text = document.lineAt(n).text;
      const match = TASK_RE.exec(text);
      if (!match) continue;

      const start = match[1].length;
      const end = start + 3; // [, char, ]
      const range = new vscode.Range(n, start, n, end);

      const args = encodeURIComponent(JSON.stringify({ line: n }));
      const link = new vscode.DocumentLink(
        range,
        vscode.Uri.parse(`command:${TOGGLE_COMMAND}?${args}`)
      );
      link.tooltip = 'Toggle task';
      links.push(link);
    }

    return links;
  }
}
