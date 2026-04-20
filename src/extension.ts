import * as vscode from 'vscode';
import { BraindumpDocumentSymbolProvider } from './features/outline';
import { cycleLines } from './features/callout';
import { BraindumpDecorator } from './features/decorations';
import { BraindumpMentionCompletionProvider } from './features/mentionComplete';
import { BraindumpStatusBar, STATUS_BAR_COMMAND, showCalloutsCommand } from './features/statusBar';
import { WorkspaceIndex } from './lib/workspaceIndex';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const index = new WorkspaceIndex();
  context.subscriptions.push(index);
  await index.initialize();

  const statusBar = new BraindumpStatusBar(index);
  context.subscriptions.push(statusBar);

  context.subscriptions.push(new BraindumpDecorator());

  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider(
      { language: 'braindump' },
      new BraindumpDocumentSymbolProvider()
    ),
    vscode.commands.registerCommand('braindump.cycleAnnotation', cycleAnnotationCommand),
    vscode.commands.registerCommand(STATUS_BAR_COMMAND, () => showCalloutsCommand(index)),
    vscode.languages.registerCompletionItemProvider(
      { language: 'braindump' },
      new BraindumpMentionCompletionProvider(index),
      '@'
    )
  );
}

export function deactivate(): void {}

async function cycleAnnotationCommand(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'braindump') return;

  const lineNumbers = collectSelectedLines(editor);
  if (lineNumbers.length === 0) return;

  const originals = lineNumbers.map((n) => editor.document.lineAt(n).text);
  const cycled = cycleLines(originals);

  const edit = new vscode.WorkspaceEdit();
  for (let i = 0; i < lineNumbers.length; i++) {
    if (originals[i] !== cycled[i]) {
      edit.replace(editor.document.uri, editor.document.lineAt(lineNumbers[i]).range, cycled[i]);
    }
  }
  await vscode.workspace.applyEdit(edit);
}

function collectSelectedLines(editor: vscode.TextEditor): number[] {
  const set = new Set<number>();
  for (const sel of editor.selections) {
    const start = sel.start.line;
    const rawEnd = sel.end.line;
    const end = sel.isEmpty || sel.end.character > 0 ? rawEnd : Math.max(start, rawEnd - 1);
    for (let i = start; i <= end; i++) set.add(i);
  }
  return [...set].sort((a, b) => a - b);
}
