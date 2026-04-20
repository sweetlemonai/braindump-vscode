import * as vscode from 'vscode';
import { parseMarkers, type Marker } from '../lib/parser';

export class BraindumpDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(document: vscode.TextDocument): vscode.DocumentSymbol[] {
    const markers = parseMarkers(document.getText());
    return buildSymbolTree(document, markers);
  }
}

function buildSymbolTree(
  document: vscode.TextDocument,
  markers: Marker[]
): vscode.DocumentSymbol[] {
  const topLevel: vscode.DocumentSymbol[] = [];
  const stacks: Record<'heading' | 'category' | 'section', Array<{ symbol: vscode.DocumentSymbol; level: number }>> = {
    heading: [],
    category: [],
    section: [],
  };

  for (const m of markers) {
    const lineRange = document.lineAt(m.lineNumber).range;

    if (m.family === 'heading' || m.family === 'category' || m.family === 'section') {
      const symbol = new vscode.DocumentSymbol(
        m.content,
        '',
        vscode.SymbolKind.Namespace,
        lineRange,
        lineRange
      );
      const stack = stacks[m.family];
      while (stack.length > 0 && stack[stack.length - 1].level >= m.level) {
        stack.pop();
      }
      const parent = stack[stack.length - 1];
      if (parent) {
        parent.symbol.children.push(symbol);
        parent.symbol.range = new vscode.Range(parent.symbol.range.start, lineRange.end);
      } else {
        topLevel.push(symbol);
      }
      stack.push({ symbol, level: m.level });
    } else if (m.family === 'question' || m.family === 'admiration') {
      const prefix = m.family === 'question' ? '?'.repeat(m.level) : '!';
      const symbol = new vscode.DocumentSymbol(
        `${prefix} ${m.content}`,
        '',
        vscode.SymbolKind.Event,
        lineRange,
        lineRange
      );
      topLevel.push(symbol);
    }
  }

  extendHeadingRangesToEnd(document, topLevel, stacks);
  return topLevel;
}

function extendHeadingRangesToEnd(
  document: vscode.TextDocument,
  _topLevel: vscode.DocumentSymbol[],
  stacks: Record<'heading' | 'category' | 'section', Array<{ symbol: vscode.DocumentSymbol; level: number }>>
): void {
  const docEnd = document.lineAt(document.lineCount - 1).range.end;
  for (const family of Object.keys(stacks) as Array<keyof typeof stacks>) {
    for (const { symbol } of stacks[family]) {
      symbol.range = new vscode.Range(symbol.range.start, docEnd);
    }
  }
}
