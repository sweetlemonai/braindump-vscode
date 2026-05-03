import * as vscode from 'vscode';

const HASH_RE = /^\s*(#{1,3})(?=\s|$)/;
const EQ_RE = /^\s*(=+)(?=\s|$)/;

type LineInfo =
  | { kind: 'hash'; depth: number }
  | { kind: 'eq1' }
  | { kind: 'other' };

export class BraindumpFoldingProvider implements vscode.FoldingRangeProvider {
  provideFoldingRanges(
    document: vscode.TextDocument,
    _context: vscode.FoldingContext,
    _token: vscode.CancellationToken
  ): vscode.FoldingRange[] {
    const infos: LineInfo[] = [];
    for (let i = 0; i < document.lineCount; i++) {
      infos.push(classify(document.lineAt(i).text));
    }

    const ranges: vscode.FoldingRange[] = [];
    for (let i = 0; i < infos.length; i++) {
      const info = infos[i];
      let endLine = -1;

      if (info.kind === 'hash') {
        endLine = infos.length - 1;
        for (let j = i + 1; j < infos.length; j++) {
          const next = infos[j];
          if (next.kind === 'hash' && next.depth <= info.depth) {
            endLine = j - 1;
            break;
          }
        }
      } else if (info.kind === 'eq1') {
        endLine = infos.length - 1;
        for (let j = i + 1; j < infos.length; j++) {
          const next = infos[j];
          if (next.kind === 'eq1' || next.kind === 'hash') {
            endLine = j - 1;
            break;
          }
        }
      }

      if (endLine > i) ranges.push(new vscode.FoldingRange(i, endLine));
    }

    return ranges;
  }
}

function classify(text: string): LineInfo {
  const h = HASH_RE.exec(text);
  if (h) return { kind: 'hash', depth: h[1].length };
  const e = EQ_RE.exec(text);
  if (e && e[1].length === 1) return { kind: 'eq1' };
  return { kind: 'other' };
}
