import * as vscode from 'vscode';
import { parseConstructs, type ConstructKind } from '../lib/parser';
import {
  buildStyleMap,
  selectPalette,
  type ConstructStyle,
  type PaletteKind,
} from '../lib/palette';

const DEBOUNCE_MS = 100;

export class BraindumpDecorator implements vscode.Disposable {
  private decorationTypes: Map<ConstructKind, vscode.TextEditorDecorationType> = new Map();
  private currentKind: PaletteKind | null = null;
  private readonly disposables: vscode.Disposable[] = [];
  private readonly pendingUris: Set<string> = new Set();
  private debounceTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.rebuildDecorationTypes();

    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) this.apply(editor);
      }),
      vscode.workspace.onDidChangeTextDocument((e) => {
        if (e.document.languageId !== 'braindump') return;
        this.scheduleApply(e.document.uri);
      }),
      vscode.window.onDidChangeActiveColorTheme(() => {
        if (this.rebuildDecorationTypes()) this.applyAll();
      })
    );

    this.applyAll();
  }

  dispose(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.disposeDecorationTypes();
    for (const d of this.disposables) d.dispose();
    this.disposables.length = 0;
  }

  private scheduleApply(uri: vscode.Uri): void {
    this.pendingUris.add(uri.toString());
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined;
      const uris = new Set(this.pendingUris);
      this.pendingUris.clear();
      for (const editor of vscode.window.visibleTextEditors) {
        if (uris.has(editor.document.uri.toString())) this.apply(editor);
      }
    }, DEBOUNCE_MS);
  }

  private applyAll(): void {
    for (const editor of vscode.window.visibleTextEditors) this.apply(editor);
  }

  private apply(editor: vscode.TextEditor): void {
    if (editor.document.languageId !== 'braindump') return;
    const constructs = parseConstructs(editor.document.getText());
    const byKind = new Map<ConstructKind, vscode.Range[]>();
    for (const c of constructs) {
      const range = new vscode.Range(c.line, c.startChar, c.line, c.endChar);
      const arr = byKind.get(c.kind);
      if (arr) arr.push(range);
      else byKind.set(c.kind, [range]);
    }
    for (const [kind, dec] of this.decorationTypes) {
      editor.setDecorations(dec, byKind.get(kind) ?? []);
    }
  }

  private rebuildDecorationTypes(): boolean {
    const themeKind = vscode.window.activeColorTheme.kind as unknown as number;
    const { palette, kind } = selectPalette(themeKind);
    if (this.currentKind === kind && this.decorationTypes.size > 0) return false;
    this.disposeDecorationTypes();
    const styleMap = buildStyleMap(palette, kind);
    for (const key of Object.keys(styleMap) as ConstructKind[]) {
      this.decorationTypes.set(
        key,
        vscode.window.createTextEditorDecorationType(toRenderOptions(styleMap[key]))
      );
    }
    this.currentKind = kind;
    return true;
  }

  private disposeDecorationTypes(): void {
    for (const dec of this.decorationTypes.values()) dec.dispose();
    this.decorationTypes.clear();
  }
}

function toRenderOptions(style: ConstructStyle): vscode.DecorationRenderOptions {
  const opts: vscode.DecorationRenderOptions = { color: style.color };
  switch (style.fontStyle) {
    case 'bold':
      opts.fontWeight = 'bold';
      break;
    case 'italic':
      opts.fontStyle = 'italic';
      break;
    case 'bold italic':
      opts.fontWeight = 'bold';
      opts.fontStyle = 'italic';
      break;
    case 'underline':
      opts.textDecoration = 'underline';
      break;
  }
  return opts;
}
