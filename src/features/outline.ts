import * as vscode from 'vscode';

const HEADING_RE = /^\s*#{1,3}\s+\S/;
const COMMENT_RE = /^\s*\/\/(?!\/)/;
const FENCE_RE = /^```/;

export class BraindumpOutlineProvider implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.DocumentSymbol[] {
    const lines = collectRelevantLines(document);
    return buildOutline(lines);
  }
}

interface LineInfo {
  lineNum: number;
  text: string;
  trimmed: string;
  indent: number;
  isHeading: boolean;
}

function collectRelevantLines(document: vscode.TextDocument): LineInfo[] {
  const lines: LineInfo[] = [];
  let inFence = false;

  for (let n = 0; n < document.lineCount; n++) {
    const text = document.lineAt(n).text;

    if (FENCE_RE.test(text)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const trimmed = text.trim();
    if (trimmed === '') continue;
    if (COMMENT_RE.test(text)) continue;

    lines.push({
      lineNum: n,
      text,
      trimmed,
      indent: countIndent(text),
      isHeading: HEADING_RE.test(text),
    });
  }

  return lines;
}

function countIndent(text: string): number {
  let indent = 0;
  for (const ch of text) {
    if (ch === ' ') indent++;
    else if (ch === '\t') indent += 4;
    else break;
  }
  return indent;
}

function buildOutline(lines: LineInfo[]): vscode.DocumentSymbol[] {
  const result: vscode.DocumentSymbol[] = [];

  let i = 0;
  while (i < lines.length) {
    if (!lines[i].isHeading) {
      i++;
      continue;
    }

    const heading = lines[i];
    const body: LineInfo[] = [];
    let j = i + 1;
    while (j < lines.length && !lines[j].isHeading) {
      body.push(lines[j]);
      j++;
    }

    // Determine the two outline indent depths inside this section.
    const distinct = new Set<number>();
    for (const line of body) {
      if (line.indent > 0) distinct.add(line.indent);
    }
    const sorted = [...distinct].sort((a, b) => a - b);
    const level2Indent = sorted[0];
    const level3Indent = sorted[1];

    const headingSym = makeSymbol(heading, vscode.SymbolKind.String);
    let currentLevel2: vscode.DocumentSymbol = headingSym;

    for (const line of body) {
      if (level2Indent !== undefined && line.indent === level2Indent) {
        const sym = makeSymbol(line, vscode.SymbolKind.Object);
        headingSym.children.push(sym);
        currentLevel2 = sym;
      } else if (level3Indent !== undefined && line.indent === level3Indent) {
        const sym = makeSymbol(line, vscode.SymbolKind.Variable);
        currentLevel2.children.push(sym);
      }
      // Anything else (deeper indent, or indent 0) is excluded.
    }

    result.push(headingSym);
    i = j;
  }

  return result;
}

function makeSymbol(line: LineInfo, kind: vscode.SymbolKind): vscode.DocumentSymbol {
  const range = new vscode.Range(line.lineNum, 0, line.lineNum, line.text.length);
  return new vscode.DocumentSymbol(line.trimmed, '', kind, range, range);
}
