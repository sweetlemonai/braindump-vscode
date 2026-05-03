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
  if (!match) return; // silent no-op on non-task lines

  const innerColumn = match[1].length + 1;
  const newChar = match[2] === ' ' ? 'x' : ' ';

  const range = new vscode.Range(lineNum, innerColumn, lineNum, innerColumn + 1);
  await editor.edit((builder) => builder.replace(range, newChar), {
    undoStopBefore: false,
    undoStopAfter: false,
  });
}

/**
 * Provides Cmd/Ctrl+Click toggle on the body text of a task line. The bracket
 * itself is handled by the selection-change listener below (single-click).
 *
 * If we put a link on the bracket too, single-click would still work via the
 * listener AND the link, double-toggling. Splitting them keeps the two paths
 * disjoint.
 */
export class BraindumpTaskBodyLinkProvider implements vscode.DocumentLinkProvider {
  provideDocumentLinks(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.DocumentLink[] {
    const links: vscode.DocumentLink[] = [];

    for (let n = 0; n < document.lineCount; n++) {
      const text = document.lineAt(n).text;
      const match = TASK_RE.exec(text);
      if (!match) continue;

      const bodyStart = match[1].length + 3; // after "[c]"
      if (bodyStart >= text.length) continue; // empty body, nothing to link

      const range = new vscode.Range(n, bodyStart, n, text.length);
      const args = encodeURIComponent(JSON.stringify({ line: n }));
      const link = new vscode.DocumentLink(
        range,
        vscode.Uri.parse(`command:${TOGGLE_COMMAND}?${args}`)
      );
      link.tooltip = 'Toggle task (Cmd/Ctrl+Click)';
      links.push(link);
    }

    return links;
  }
}

/**
 * Single-click on the bracket trio toggles the task. We listen to selection
 * changes filtered by Mouse origin: when the user clicks (collapsing the
 * selection to a caret) and the caret lands inside [start..start+3], we toggle.
 *
 * Keyboard navigation onto the bracket does NOT toggle — only mouse clicks do.
 */
export function registerBracketClickToggle(): vscode.Disposable {
  return vscode.window.onDidChangeTextEditorSelection((event) => {
    if (event.kind !== vscode.TextEditorSelectionChangeKind.Mouse) return;
    if (event.textEditor.document.languageId !== 'braindump') return;

    const sel = event.selections[0];
    if (!sel.isEmpty) return; // ignore drag-selects

    const lineNum = sel.active.line;
    const col = sel.active.character;
    const lineText = event.textEditor.document.lineAt(lineNum).text;

    const match = TASK_RE.exec(lineText);
    if (!match) return;

    const bracketStart = match[1].length;
    const bracketEnd = bracketStart + 3; // covers '[', char, ']'

    if (col >= bracketStart && col <= bracketEnd) {
      void toggleTask({ line: lineNum });
    }
  });
}
