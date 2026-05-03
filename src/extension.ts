import * as vscode from 'vscode';
import { BraindumpOutlineProvider } from './features/outline';
import { BraindumpTaskLinkProvider, TOGGLE_COMMAND, toggleTask } from './features/tasks';

const SELECTOR: vscode.DocumentSelector = { language: 'braindump' };

export function activate(context: vscode.ExtensionContext): void {
  console.log('[Braindump] extension activated');

  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider(SELECTOR, new BraindumpOutlineProvider()),
    vscode.languages.registerDocumentLinkProvider(SELECTOR, new BraindumpTaskLinkProvider()),
    vscode.commands.registerCommand(TOGGLE_COMMAND, toggleTask)
  );
}

export function deactivate(): void {}
