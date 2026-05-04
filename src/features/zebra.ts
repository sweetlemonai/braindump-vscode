import * as vscode from 'vscode';

// Each family matches at line start; marker must end with whitespace or EOL.
const BULLET_RE = /^(\s*)(-{1,3})(?=\s|$)/;
const NUMBERED_RE = /^(\s*)(\d+\.)(?=\s)/;
const LETTERED_RE = /^(\s*)([A-Za-z]\.)(?=\s)/;

// Inline token regexes — kept in sync with the grammar's inline-overlays.
// A foreground decoration would otherwise paint over the grammar-applied color
// for these tokens, so we carve them out of the decorated ranges.
const INLINE_PATTERNS: RegExp[] = [
  /"[^"]*"/g,
  /(?<![\w/])https?:\/\/[^\s)\]]+/g,
  /(?<!\S)--[A-Za-z][\w-]*(?:=\S+)?/g,
  /(?<!\S)@[\p{L}\p{N}][\p{L}\p{N}_-]*/gu,
  /(?<!\S)@\s+\S[^\n]*?(?=\s+\/\/(?!\/)|\s*$)/g,
  /(?<=\s)\/\/(?!\/).*$/g,
];

type Family = 'bullet' | 'numbered' | 'lettered';

interface FamilySpec {
  re: RegExp;
  primaryScope: string;
  altScope: string;
  primaryDefault: string;
  altDefault: string;
}

const FAMILIES: Record<Family, FamilySpec> = {
  bullet: {
    re: BULLET_RE,
    primaryScope: 'meta.list.bullet.body.braindump',
    altScope: 'meta.list.alt.braindump',
    primaryDefault: '#C5C2D6',
    altDefault: '#A693C0',
  },
  numbered: {
    re: NUMBERED_RE,
    primaryScope: 'markup.list.numbered.braindump',
    altScope: 'meta.list.numbered.alt.braindump',
    primaryDefault: '#DAA520',
    altDefault: '#C4951D',
  },
  lettered: {
    re: LETTERED_RE,
    primaryScope: 'markup.list.lettered.braindump',
    altScope: 'meta.list.lettered.alt.braindump',
    primaryDefault: '#DAA520',
    altDefault: '#C4951D',
  },
};

interface FamilyState {
  primary: vscode.TextEditorDecorationType | undefined;
  alt: vscode.TextEditorDecorationType | undefined;
  primaryColor: string;
  altColor: string;
}

const state: Record<Family, FamilyState> = {
  bullet: { primary: undefined, alt: undefined, primaryColor: '', altColor: '' },
  numbered: { primary: undefined, alt: undefined, primaryColor: '', altColor: '' },
  lettered: { primary: undefined, alt: undefined, primaryColor: '', altColor: '' },
};

function readScopeColor(scope: string, fallback: string): string {
  const config = vscode.workspace.getConfiguration('editor', { languageId: 'braindump' });
  const tcc = config.get<{ textMateRules?: { scope?: string; settings?: { foreground?: string } }[] }>(
    'tokenColorCustomizations'
  );
  const rules = tcc?.textMateRules ?? [];
  for (const rule of rules) {
    if (rule.scope === scope && rule.settings?.foreground) {
      return rule.settings.foreground;
    }
  }
  return fallback;
}

function ensureDecorations(family: Family): { primary: vscode.TextEditorDecorationType; alt: vscode.TextEditorDecorationType } {
  const s = state[family];
  const spec = FAMILIES[family];
  const primaryColor = readScopeColor(spec.primaryScope, spec.primaryDefault);
  const altColor = readScopeColor(spec.altScope, spec.altDefault);

  if (!s.primary || s.primaryColor !== primaryColor) {
    s.primary?.dispose();
    s.primary = vscode.window.createTextEditorDecorationType({ color: primaryColor });
    s.primaryColor = primaryColor;
  }
  if (!s.alt || s.altColor !== altColor) {
    s.alt?.dispose();
    s.alt = vscode.window.createTextEditorDecorationType({ color: altColor });
    s.altColor = altColor;
  }
  return { primary: s.primary, alt: s.alt };
}

// Find inline-token ranges in `text`, sorted and merged.
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

// Carve a single-line range [bodyStart, text.length) into segments that skip
// inline-token ranges, so grammar colors win for those tokens.
function carveBodyRanges(line: number, text: string, bodyStart: number): vscode.Range[] {
  const out: vscode.Range[] = [];
  if (bodyStart >= text.length) return out;
  const skips = inlineTokenRanges(text);
  let cursor = bodyStart;
  for (const [s, e] of skips) {
    if (e <= bodyStart) continue;
    const segStart = Math.max(s, bodyStart);
    if (segStart > cursor) {
      out.push(new vscode.Range(line, cursor, line, segStart));
    }
    cursor = Math.max(cursor, e);
    if (cursor >= text.length) break;
  }
  if (cursor < text.length) {
    out.push(new vscode.Range(line, cursor, line, text.length));
  }
  return out;
}

interface FamilyRanges {
  primary: vscode.Range[];
  alt: vscode.Range[];
}

function refresh(editor: vscode.TextEditor | undefined): void {
  if (!editor) return;
  const decorations: Record<Family, { primary: vscode.TextEditorDecorationType; alt: vscode.TextEditorDecorationType }> = {
    bullet: ensureDecorations('bullet'),
    numbered: ensureDecorations('numbered'),
    lettered: ensureDecorations('lettered'),
  };

  if (editor.document.languageId !== 'braindump') {
    for (const f of ['bullet', 'numbered', 'lettered'] as Family[]) {
      editor.setDecorations(decorations[f].primary, []);
      editor.setDecorations(decorations[f].alt, []);
    }
    return;
  }

  const ranges: Record<Family, FamilyRanges> = {
    bullet: { primary: [], alt: [] },
    numbered: { primary: [], alt: [] },
    lettered: { primary: [], alt: [] },
  };
  const counters: Record<Family, number> = { bullet: 0, numbered: 0, lettered: 0 };

  for (let n = 0; n < editor.document.lineCount; n++) {
    const text = editor.document.lineAt(n).text;
    let matchedFamily: Family | null = null;
    let markerEnd = 0;

    for (const f of ['bullet', 'numbered', 'lettered'] as Family[]) {
      const m = FAMILIES[f].re.exec(text);
      if (m) {
        matchedFamily = f;
        markerEnd = m[0].length;
        break;
      }
    }

    if (!matchedFamily) {
      counters.bullet = 0;
      counters.numbered = 0;
      counters.lettered = 0;
      continue;
    }

    // Reset other families' runs.
    for (const f of ['bullet', 'numbered', 'lettered'] as Family[]) {
      if (f !== matchedFamily) counters[f] = 0;
    }

    counters[matchedFamily]++;
    const isAlt = counters[matchedFamily] % 2 === 0;

    let bodyStart = markerEnd;
    while (bodyStart < text.length && /\s/.test(text[bodyStart])) bodyStart++;
    if (bodyStart >= text.length) continue;

    const segs = carveBodyRanges(n, text, bodyStart);
    (isAlt ? ranges[matchedFamily].alt : ranges[matchedFamily].primary).push(...segs);
  }

  for (const f of ['bullet', 'numbered', 'lettered'] as Family[]) {
    editor.setDecorations(decorations[f].primary, ranges[f].primary);
    editor.setDecorations(decorations[f].alt, ranges[f].alt);
  }
}

export function registerBulletZebra(context: vscode.ExtensionContext): void {
  ensureDecorations('bullet');
  ensureDecorations('numbered');
  ensureDecorations('lettered');
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
      ensureDecorations('bullet');
      ensureDecorations('numbered');
      ensureDecorations('lettered');
      vscode.window.visibleTextEditors.forEach((ed) => refresh(ed));
    }),
    {
      dispose: () => {
        for (const f of ['bullet', 'numbered', 'lettered'] as Family[]) {
          state[f].primary?.dispose();
          state[f].alt?.dispose();
          state[f].primary = undefined;
          state[f].alt = undefined;
        }
      },
    }
  );
}
