import * as vscode from 'vscode';

// Matches any depth of dash bullet (-, --, ---) at line start. The marker must
// be followed by whitespace or end-of-line so things like --flag don't match.
const BULLET_RE = /^(\s*)(-{1,3})(?=\s|$)/;

const evenRowDecoration = vscode.window.createTextEditorDecorationType({
  light: { color: '#5B5475' }, // muted plum-gray
  dark: { color: '#B8B0D8' }, // desaturated lavender
});

function refresh(editor: vscode.TextEditor | undefined): void {
  if (!editor) return;
  if (editor.document.languageId !== 'braindump') {
    editor.setDecorations(evenRowDecoration, []);
    return;
  }

  const ranges: vscode.Range[] = [];
  let countInRun = 0;

  for (let n = 0; n < editor.document.lineCount; n++) {
    const text = editor.document.lineAt(n).text;
    const match = BULLET_RE.exec(text);

    if (!match) {
      // Blank line, non-bullet line, or numbered/lettered/task — all reset the run.
      countInRun = 0;
      continue;
    }

    countInRun++;
    if (countInRun % 2 !== 0) continue; // 1st, 3rd, 5th, … keep default color

    // Body starts after the marker and any trailing whitespace.
    let bodyStart = match[0].length;
    while (bodyStart < text.length && /\s/.test(text[bodyStart])) {
      bodyStart++;
    }
    if (bodyStart < text.length) {
      ranges.push(new vscode.Range(n, bodyStart, n, text.length));
    }
  }

  editor.setDecorations(evenRowDecoration, ranges);
}

export function registerBulletZebra(context: vscode.ExtensionContext): void {
  refresh(vscode.window.activeTextEditor);

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => refresh(editor)),
    vscode.workspace.onDidChangeTextDocument((event) => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document === event.document) {
        refresh(editor);
      }
    }),
    { dispose: () => evenRowDecoration.dispose() }
  );
}
