import * as vscode from 'vscode';
import type { CalloutKind } from '../lib/parser';
import type { CalloutOccurrence, WorkspaceIndex } from '../lib/workspaceIndex';

type Track = 'questions' | 'important' | 'starred' | 'off';
type Scope = 'file' | 'workspace' | 'off';

const TRACK_TO_KIND: Record<Exclude<Track, 'off'>, CalloutKind> = {
  questions: 'question',
  important: 'admiration',
  starred: 'starred',
};

const ICON: Record<CalloutKind, string> = {
  question: '$(question)',
  admiration: '$(alert)',
  starred: '$(star)',
};

const MARKER_CHAR: Record<CalloutKind, string> = {
  question: '?',
  admiration: '!',
  starred: '*',
};

const LABEL: Record<Track, { singular: string; plural: string }> = {
  questions: { singular: 'open question', plural: 'open questions' },
  important: { singular: 'important item', plural: 'important items' },
  starred: { singular: 'starred item', plural: 'starred items' },
  off: { singular: '', plural: '' },
};

const DEBOUNCE_MS = 250;
export const STATUS_BAR_COMMAND = 'braindump.showCallouts';

export class BraindumpStatusBar implements vscode.Disposable {
  private readonly item: vscode.StatusBarItem;
  private readonly disposables: vscode.Disposable[] = [];
  private debounceTimer?: ReturnType<typeof setTimeout>;

  constructor(private readonly index: WorkspaceIndex) {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.item.command = STATUS_BAR_COMMAND;
    this.disposables.push(
      this.item,
      vscode.window.onDidChangeActiveTextEditor(() => this.update()),
      vscode.workspace.onDidChangeTextDocument((e) => {
        if (e.document.languageId !== 'braindump') return;
        this.scheduleUpdate();
      }),
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('braindump.statusBar')) this.update();
      }),
      this.index.onDidChange(() => this.update())
    );
    this.update();
  }

  dispose(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    for (const d of this.disposables) d.dispose();
    this.disposables.length = 0;
  }

  private scheduleUpdate(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined;
      this.update();
    }, DEBOUNCE_MS);
  }

  private update(): void {
    const config = vscode.workspace.getConfiguration('braindump.statusBar');
    const track = config.get<Track>('track', 'questions');
    const scope = config.get<Scope>('scope', 'file');
    const editor = vscode.window.activeTextEditor;
    const isBd = editor?.document.languageId === 'braindump';

    if (!isBd || track === 'off' || scope === 'off') {
      this.item.hide();
      return;
    }

    const kind = TRACK_TO_KIND[track];
    const fileCount = this.index.getCallouts(kind, { uri: editor.document.uri }).length;

    if (scope === 'workspace') {
      const wsCount = this.index.getCallouts(kind).length;
      this.item.text = `${ICON[kind]} ${fileCount} / ${wsCount}`;
      this.item.tooltip = buildWorkspaceTooltip(track, fileCount, wsCount);
    } else {
      this.item.text = `${ICON[kind]} ${fileCount}`;
      this.item.tooltip = buildFileTooltip(track, fileCount);
    }
    this.item.show();
  }
}

function buildFileTooltip(track: Track, count: number): string {
  const label = count === 1 ? LABEL[track].singular : LABEL[track].plural;
  return `${count} ${label} in this file`;
}

function buildWorkspaceTooltip(track: Track, fileCount: number, wsCount: number): string {
  const fileLabel = fileCount === 1 ? LABEL[track].singular : LABEL[track].plural;
  return `${fileCount} ${fileLabel} in this file, ${wsCount} in workspace`;
}

interface CalloutPickItem extends vscode.QuickPickItem {
  uri: vscode.Uri;
  lineNumber: number;
}

export async function showCalloutsCommand(index: WorkspaceIndex): Promise<void> {
  const config = vscode.workspace.getConfiguration('braindump.statusBar');
  const track = config.get<Track>('track', 'questions');
  const scope = config.get<Scope>('scope', 'file');
  if (track === 'off' || scope === 'off') return;

  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'braindump') return;

  const kind = TRACK_TO_KIND[track];
  const callouts =
    scope === 'file'
      ? index.getCallouts(kind, { uri: editor.document.uri })
      : index.getCallouts(kind);

  if (callouts.length === 0) {
    const where = scope === 'file' ? 'this file' : 'the workspace';
    vscode.window.showInformationMessage(`No ${LABEL[track].plural} in ${where}.`);
    return;
  }

  const items: CalloutPickItem[] = callouts.map((c) => pickItem(c, kind, scope));

  const picked = await vscode.window.showQuickPick(items, {
    matchOnDescription: true,
    placeHolder: `${callouts.length} ${callouts.length === 1 ? LABEL[track].singular : LABEL[track].plural}`,
  });
  if (!picked) return;

  await jumpToLine(picked.uri, picked.lineNumber);
}

function pickItem(c: CalloutOccurrence, kind: CalloutKind, scope: Scope): CalloutPickItem {
  const marker = MARKER_CHAR[kind].repeat(c.level);
  return {
    label: `${marker} ${c.content}`,
    description: scope === 'workspace' ? vscode.workspace.asRelativePath(c.uri) : undefined,
    uri: c.uri,
    lineNumber: c.lineNumber,
  };
}

async function jumpToLine(uri: vscode.Uri, lineNumber: number): Promise<void> {
  const doc = await vscode.workspace.openTextDocument(uri);
  const editor = await vscode.window.showTextDocument(doc);
  const line = doc.lineAt(Math.min(lineNumber, doc.lineCount - 1));
  editor.selection = new vscode.Selection(line.range.start, line.range.start);
  editor.revealRange(line.range, vscode.TextEditorRevealType.InCenter);
}
