import * as vscode from 'vscode';
import { BraindumpOutlineProvider } from './features/outline';
import {
  BraindumpTaskBodyLinkProvider,
  TOGGLE_COMMAND,
  registerBracketClickToggle,
  registerBracketHoverCursor,
  toggleTask,
} from './features/tasks';

const SELECTOR: vscode.DocumentSelector = { scheme: 'file', language: 'braindump' };

export function activate(context: vscode.ExtensionContext): void {
  console.log('[Braindump] extension activated');

  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider(SELECTOR, new BraindumpOutlineProvider()),
    vscode.languages.registerDocumentLinkProvider(SELECTOR, new BraindumpTaskBodyLinkProvider()),
    vscode.commands.registerCommand(TOGGLE_COMMAND, toggleTask),
    registerBracketClickToggle()
  );
  registerBracketHoverCursor(context);
}

export function deactivate(): void {}
