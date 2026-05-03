import * as vscode from 'vscode';
import { SHOW_CHEAT_SHEET_COMMAND, showCheatSheet } from './features/cheatSheet';
import { OPEN_COLOR_SETTINGS_COMMAND, migrateLegacyRules, openColorSettings } from './features/colorSettings';
import { BraindumpFoldingProvider } from './features/folding';
import { registerMentionCompletion } from './features/mentionComplete';
import { BraindumpOutlineProvider } from './features/outline';
import { registerStatusBar } from './features/statusBar';
import {
  BraindumpTaskBodyLinkProvider,
  TOGGLE_COMMAND,
  registerBracketClickToggle,
  registerBracketHoverCursor,
  toggleTask,
} from './features/tasks';
import { registerBulletZebra } from './features/zebra';

const SELECTOR: vscode.DocumentSelector = { scheme: 'file', language: 'braindump' };

export function activate(context: vscode.ExtensionContext): void {
  console.log('[Braindump] extension activated');

  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider(SELECTOR, new BraindumpOutlineProvider()),
    vscode.languages.registerFoldingRangeProvider(SELECTOR, new BraindumpFoldingProvider()),
    vscode.languages.registerDocumentLinkProvider(SELECTOR, new BraindumpTaskBodyLinkProvider()),
    vscode.commands.registerCommand(TOGGLE_COMMAND, toggleTask),
    vscode.commands.registerCommand(SHOW_CHEAT_SHEET_COMMAND, showCheatSheet),
    vscode.commands.registerCommand(OPEN_COLOR_SETTINGS_COMMAND, () => {
      const ext = context.extension;
      openColorSettings(ext);
    }),
    registerBracketClickToggle(),
    registerMentionCompletion()
  );
  registerBracketHoverCursor(context);
  registerStatusBar(context);
  registerBulletZebra(context);

  void migrateLegacyRules(context.extension.packageJSON);
}

export function deactivate(): void {}
