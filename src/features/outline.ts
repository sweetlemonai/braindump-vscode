import * as vscode from 'vscode';

const HEADING_RE = /^\s*(#{1,3})\s+(.+?)\s*$/;
const CATEGORY_RE = /^\s*(={1,3})\s+(.+?)\s*$/;
const QUESTION_RE = /^\s*\?{1,3}\s+(.+?)\s*$/;
const STARRED_RE = /^\s*\*{1,3}\s+(.+?)\s*$/;

type StructuralMarker = 'heading' | 'category';

interface OutlineNode {
  depth: number;
  text: string;
  marker: StructuralMarker;
  range: vscode.Range;
  children: OutlineNode[];
}

interface FlatItem {
  text: string;
  range: vscode.Range;
}

export class BraindumpOutlineProvider implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.DocumentSymbol[] {
    const tree: OutlineNode[] = [];
    const stack: OutlineNode[] = [];
    const questions: FlatItem[] = [];
    const starred: FlatItem[] = [];

    for (let lineNum = 0; lineNum < document.lineCount; lineNum++) {
      const lineText = document.lineAt(lineNum).text;
      const range = new vscode.Range(lineNum, 0, lineNum, lineText.length);

      const headingMatch = HEADING_RE.exec(lineText);
      if (headingMatch) {
        attach(
          { depth: headingMatch[1].length, text: headingMatch[2], marker: 'heading', range, children: [] },
          tree,
          stack
        );
        continue;
      }

      const categoryMatch = CATEGORY_RE.exec(lineText);
      if (categoryMatch) {
        attach(
          { depth: categoryMatch[1].length, text: categoryMatch[2], marker: 'category', range, children: [] },
          tree,
          stack
        );
        continue;
      }

      const questionMatch = QUESTION_RE.exec(lineText);
      if (questionMatch) {
        questions.push({ text: questionMatch[1], range });
        continue;
      }

      const starredMatch = STARRED_RE.exec(lineText);
      if (starredMatch) {
        starred.push({ text: starredMatch[1], range });
      }
    }

    const result: vscode.DocumentSymbol[] = tree.map(toSymbol);

    for (const q of questions) {
      result.push(new vscode.DocumentSymbol(q.text, '?', vscode.SymbolKind.Event, q.range, q.range));
    }
    for (const s of starred) {
      result.push(new vscode.DocumentSymbol(s.text, '*', vscode.SymbolKind.Constant, s.range, s.range));
    }

    return result;
  }
}

function attach(node: OutlineNode, tree: OutlineNode[], stack: OutlineNode[]): void {
  while (stack.length > 0 && stack[stack.length - 1].depth >= node.depth) {
    stack.pop();
  }
  if (stack.length === 0) {
    tree.push(node);
  } else {
    stack[stack.length - 1].children.push(node);
  }
  stack.push(node);
}

function toSymbol(node: OutlineNode): vscode.DocumentSymbol {
  const kind = node.marker === 'heading' ? vscode.SymbolKind.String : vscode.SymbolKind.Class;
  const detail = node.marker === 'heading' ? '#'.repeat(node.depth) : '='.repeat(node.depth);
  const sym = new vscode.DocumentSymbol(node.text, detail, kind, node.range, node.range);
  sym.children = node.children.map(toSymbol);
  return sym;
}
