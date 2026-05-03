import * as vscode from 'vscode';

// Matches any depth of dash bullet (-, --, ---) at line start. The marker must
// be followed by whitespace or end-of-line so things like --flag don't match.
const BULLET_RE = /^(\s*)(-{1,3})(?=\s|$)/;

// Inline token regexes — kept in sync with the grammar's inline-overlays.
// We use these to find ranges that already have their own color so the zebra
// decoration can skip over them (a TextEditorDecoration foreground would
// otherwise clobber the grammar-applied color).
const INLINE_PATTERNS: RegExp[] = [
  /"[^"]*"/g,
  /(?<![\w/])https?:\/\/[^\s)\]]+/g,
  /(?<!\S)--[A-Za-z][\w-]*(?:=\S+)?/g,
  // @ word-form mention
  /(?<!\S)@[\p{L}\p{N}][\p{L}\p{N}_-]*/gu,
  // @ space-form mention: @, whitespace, content up to // or EOL
  /(?<!\S)@\s+\S[^\n]*?(?=\s+\/\/(?!\/)|\s*$)/g,
  // // comment that follows whitespace mid-line (only relevant inside the
  // @-space mention edge case, but harmless elsewhere — bullet bodies
  // rarely contain '//' otherwise).
  /(?<=\s)\/\/(?!\/).*$/g,
];

const META_LIST_ALT_SCOPE = 'meta.list.alt.braindump';
const DEFAULT_ALT_COLOR = '#A693C0';

let evenRowDecoration: vscode.TextEditorDecorationType | undefined;
let currentColor = DEFAULT_ALT_COLOR;

function readListAltColor(): string {
  const config = vscode.workspace.getConfiguration('editor', { languageId: 'braindump' });
  const tcc = config.get<{ textMateRules?: { scope?: string; settings?: { foreground?: string } }[] }>(
    'tokenColorCustomizations'
  );
  const rules = tcc?.textMateRules ?? [];
  for (const rule of rules) {
    if (rule.scope === META_LIST_ALT_SCOPE && rule.settings?.foreground) {
      return rule.settings.foreground;
    }
  }
  return DEFAULT_ALT_COLOR;
}

function ensureDecoration(): vscode.TextEditorDecorationType {
  if (!evenRowDecoration) {
    evenRowDecoration = vscode.window.createTextEditorDecorationType({
      color: currentColor,
    });
  }
  return evenRowDecoration;
}

function recreateDecoration(): void {
  if (evenRowDecoration) {
    evenRowDecoration.dispose();
    evenRowDecoration = undefined;
  }
  ensureDecoration();
}

// Find ranges of inline tokens in `text`, sorted and merged.
function inlineTokenRanges(text: string): [number, number][] {
  const out: [number, number][] = [];
  for (const re of INLINE_PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m[0].length === 0) {
        re.lastIndex++;
        continue;
      }
      out.push([m.index, m.index + m[0].length]);
    }
  }
  out.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [s, e] of out) {
    if (merged.length && merged[merged.length - 1][1] >= s) {
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], e);
    } else {
      merged.push([s, e]);
    }
  }
  return merged;
}

function refresh(editor: vscode.TextEditor | undefined): void {
  if (!editor) return;
  const decoration = ensureDecoration();
  if (editor.document.languageId !== 'braindump') {
    editor.setDecorations(decoration, []);
    return;
  }

  const ranges: vscode.Range[] = [];
  let countInRun = 0;

  for (let n = 0; n < editor.document.lineCount; n++) {
    const text = editor.document.lineAt(n).text;
    const match = BULLET_RE.exec(text);

    if (!match) {
      countInRun = 0;
      continue;
    }

    countInRun++;
    if (countInRun % 2 !== 0) continue;

    let bodyStart = match[0].length;
    while (bodyStart < text.length && /\s/.test(text[bodyStart])) {
      bodyStart++;
    }
    if (bodyStart >= text.length) continue;

    // Carve out inline-token ranges so their own grammar color survives.
    const skips = inlineTokenRanges(text);
    let cursor = bodyStart;
    for (const [s, e] of skips) {
      if (e <= bodyStart) continue;
      const segStart = Math.max(s, bodyStart);
      if (segStart > cursor) {
        ranges.push(new vscode.Range(n, cursor, n, segStart));
      }
      cursor = Math.max(cursor, e);
      if (cursor >= text.length) break;
    }
    if (cursor < text.length) {
      ranges.push(new vscode.Range(n, cursor, n, text.length));
    }
  }

  editor.setDecorations(decoration, ranges);
}

export function registerBulletZebra(context: vscode.ExtensionContext): void {
  currentColor = readListAltColor();
  ensureDecoration();
  refresh(vscode.window.activeTextEditor);

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => refresh(editor)),
    vscode.workspace.onDidChangeTextDocument((event) => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document === event.document) {
        refresh(editor);
      }
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration('editor.tokenColorCustomizations')) return;
      const next = readListAltColor();
      if (next === currentColor) return;
      currentColor = next;
      recreateDecoration();
      vscode.window.visibleTextEditors.forEach((ed) => refresh(ed));
    }),
    {
      dispose: () => {
        evenRowDecoration?.dispose();
        evenRowDecoration = undefined;
      },
    }
  );
}
