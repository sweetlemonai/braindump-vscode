import * as vscode from 'vscode';
import { BraindumpOutlineProvider } from './features/outline';

const SELECTOR: vscode.DocumentSelector = { language: 'braindump' };

export function activate(context: vscode.ExtensionContext): void {
  console.log('[Braindump] extension activated');

  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider(SELECTOR, new BraindumpOutlineProvider())
  );
}

export function deactivate(): void {}
