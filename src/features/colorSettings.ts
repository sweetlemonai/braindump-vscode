import * as vscode from 'vscode';
import { getHtml } from '../colorSettingsHtml';
import {
  ColorMap,
  PresetId,
  buildAllPresets,
  buildTextMateRules,
  colorsFromRules,
  matchPreset,
} from '../presets';

export const OPEN_COLOR_SETTINGS_COMMAND = 'braindump.openColorSettings';

let panel: vscode.WebviewPanel | undefined;

export function openColorSettings(extension: vscode.Extension<unknown>): void {
  if (panel) {
    panel.reveal();
    return;
  }

  const presets = buildAllPresets(extension.packageJSON);
  const initialColors = readEffectiveColors(presets.original);

  panel = vscode.window.createWebviewPanel(
    'braindumpColors',
    'Braindump Colors',
    vscode.ViewColumn.Active,
    { enableScripts: true, retainContextWhenHidden: true }
  );

  panel.webview.html = renderHtml(panel.webview, initialColors, presets);

  panel.onDidDispose(() => { panel = undefined; });

  panel.webview.onDidReceiveMessage(async (msg: { type: string; colors?: ColorMap }) => {
    if (msg.type === 'save' && msg.colors) {
      await writeColors(msg.colors);
      panel?.webview.postMessage({ type: 'savedConfirmation' });
    } else if (msg.type === 'resetToOriginal') {
      const ok = await vscode.window.showWarningMessage(
        'Reset all braindump colors to Original palette?',
        { modal: true },
        'Reset'
      );
      if (ok !== 'Reset') return;
      await writeColors(presets.original);
      panel?.webview.postMessage({
        type: 'colorsUpdated',
        colors: presets.original,
        activePreset: 'original' satisfies PresetId,
      });
    }
  });
}

function renderHtml(
  webview: vscode.Webview,
  colors: ColorMap,
  presets: Record<PresetId, ColorMap>
): string {
  const nonce = makeNonce();
  return getHtml({
    colors,
    presets,
    activePreset: matchPreset(colors, presets),
    cspSource: webview.cspSource,
    nonce,
  });
}

// Reads what VS Code currently uses for braindump tokens — user setting wins,
// extension default fills the gaps.
function readEffectiveColors(defaults: ColorMap): ColorMap {
  const config = vscode.workspace.getConfiguration('editor', { languageId: 'braindump' });
  const tcc = config.get<{ textMateRules?: { scope?: string; settings?: { foreground?: string } }[] }>(
    'tokenColorCustomizations'
  );
  return colorsFromRules(tcc?.textMateRules, defaults);
}

async function writeColors(colors: ColorMap): Promise<void> {
  const rules = buildTextMateRules(colors);
  const config = vscode.workspace.getConfiguration('editor', { languageId: 'braindump' });
  await config.update(
    'tokenColorCustomizations',
    { textMateRules: rules },
    vscode.ConfigurationTarget.Global
  );
}

function makeNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 32; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// Future: add a "show preview .bd file" toggle that opens a synthesized buffer.
// Future: support exporting/importing the current palette as JSON.
