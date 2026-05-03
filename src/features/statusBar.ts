import * as vscode from 'vscode';

const QUESTION_RE = /^\s*\?{1,3}\s+\S/;
const TASK_OPEN_OR_DONE_RE = /^\s*\[[ xX]\](?=\s|$)/;
const TASK_DONE_RE = /^\s*\[[xX]\](?=\s|$)/;
const FENCE_RE = /^```/;
const COMMENT_RE = /^\s*\/\/(?!\/)/;
const WORD_RE = /[\w']+/g;

interface DocStats {
  words: number;
  questions: number;
  tasksTotal: number;
  tasksDone: number;
}

export function registerStatusBar(context: vscode.ExtensionContext): void {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  item.name = 'Braindump';
  context.subscriptions.push(item);

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  const refresh = (): void => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'braindump') {
      item.hide();
      return;
    }
    const stats = computeStats(editor.document);
    item.text = formatText(stats);
    item.show();
  };

  const refreshDebounced = (): void => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(refresh, 200);
  };

  refresh();

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => refresh()),
    vscode.workspace.onDidChangeTextDocument((event) => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document === event.document) {
        refreshDebounced();
      }
    }),
    {
      dispose: () => {
        if (debounceTimer) clearTimeout(debounceTimer);
      },
    }
  );
}

function computeStats(document: vscode.TextDocument): DocStats {
  let words = 0;
  let questions = 0;
  let tasksTotal = 0;
  let tasksDone = 0;
  let inFence = false;

  for (let n = 0; n < document.lineCount; n++) {
    const text = document.lineAt(n).text;

    if (FENCE_RE.test(text)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const wordMatches = text.match(WORD_RE);
    if (wordMatches) words += wordMatches.length;

    if (COMMENT_RE.test(text)) continue;

    if (QUESTION_RE.test(text)) questions++;
    if (TASK_OPEN_OR_DONE_RE.test(text)) {
      tasksTotal++;
      if (TASK_DONE_RE.test(text)) tasksDone++;
    }
  }

  return { words, questions, tasksTotal, tasksDone };
}

function formatText(stats: DocStats): string {
  const segments: string[] = [`${stats.words}w`];
  if (stats.questions > 0) segments.push(`?${stats.questions}`);
  if (stats.tasksTotal > 0) segments.push(`√${stats.tasksDone}/${stats.tasksTotal}`);
  return segments.join('  ');
}
