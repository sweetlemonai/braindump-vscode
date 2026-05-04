import * as vscode from 'vscode';
import { getHtml } from '../colorSettingsHtml';
import {
  ColorMap,
  PresetId,
  buildAllPresets,
  buildTextMateRules,
  bundledFixedRules,
  colorsFromRules,
  matchPreset,
} from '../presets';

export const OPEN_COLOR_SETTINGS_COMMAND = 'braindump.openColorSettings';

// Scopes added across 1.5.0 / 1.6.0 that older saved customizations are
// missing. If we see a non-empty user textMateRules but any of these scopes
// is absent, we rewrite the rules with the user's existing colors plus the
// full set of bundled scopes so previously-uneditable colors come back
// without the user having to click Reset.
const REQUIRED_SCOPES = [
  // 1.5.0
  'markup.task.bracket.braindump',
  'meta.list.alt.braindump',
  'punctuation.paren.line.braindump',
  'punctuation.bracket.line.braindump',
  // 1.6.0
  'meta.list.bullet.body.braindump',
  'meta.list.numbered.alt.braindump',
  'meta.list.lettered.alt.braindump',
  'punctuation.separator.colon.braindump',
  'punctuation.separator.equals.braindump',
  'punctuation.separator.arrow.braindump',
  'punctuation.separator.dash-arrow.braindump',
  'keyword.field.equals.braindump',
  'keyword.field.arrow.braindump',
  'keyword.field.dash-arrow.braindump',
  'meta.field.value.equals.braindump',
  'meta.field.value.arrow.braindump',
  'meta.field.value.dash-arrow.braindump',
];

export async function migrateLegacyRules(packageJSON: unknown): Promise<void> {
  const config = vscode.workspace.getConfiguration('editor', { languageId: 'braindump' });
  const tcc = config.get<{ textMateRules?: { scope?: string; settings?: { foreground?: string } }[] }>(
    'tokenColorCustomizations'
  );
  const rules = tcc?.textMateRules;
  if (!rules || rules.length === 0) return;

  const scopes = new Set(rules.map((r) => r.scope).filter(Boolean));
  const missingRequired = !REQUIRED_SCOPES.every((s) => scopes.has(s));

  // Detect a stale paren/bracket mirror: the swap convention is
  // paren-punct == bracket-content, paren-content == bracket-punct. If a
  // previous save matched punctuation to its own content (no swap), rewrite.
  const fg = (scope: string): string | undefined =>
    rules.find((r) => r.scope === scope)?.settings?.foreground?.toLowerCase();
  const parenPunct = fg('punctuation.paren.line.braindump');
  const parenContent = fg('markup.paren.line.content.braindump');
  const bracketPunct = fg('punctuation.bracket.line.braindump');
  const bracketContent = fg('markup.bracket.line.content.braindump');
  const swapWrong =
    !!parenPunct && !!parenContent && !!bracketPunct && !!bracketContent &&
    (parenPunct === parenContent || bracketPunct === bracketContent);

  if (!missingRequired && !swapWrong) return;

  const presets = buildAllPresets(packageJSON);
  const defaults = currentThemeKind() === 'light' ? presets.light : presets.original;
  const colors = colorsFromRules(rules, defaults);
  await writeColorsTo(colors, packageJSON);
}

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
      await writeColorsTo(msg.colors, extension.packageJSON);
      panel?.webview.postMessage({ type: 'savedConfirmation' });
    } else if (msg.type === 'resetToOriginal') {
      const ok = await vscode.window.showWarningMessage(
        'Reset all braindump colors to Original palette?',
        { modal: true },
        'Reset'
      );
      if (ok !== 'Reset') return;
      await writeColorsTo(presets.original, extension.packageJSON);
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

async function writeColorsTo(colors: ColorMap, packageJSON: unknown): Promise<void> {
  const fixed = bundledFixedRules(packageJSON, currentThemeKind());
  const rules = buildTextMateRules(colors, fixed);
  const config = vscode.workspace.getConfiguration('editor', { languageId: 'braindump' });
  await config.update(
    'tokenColorCustomizations',
    { textMateRules: rules },
    vscode.ConfigurationTarget.Global
  );
}

function currentThemeKind(): 'dark' | 'light' {
  return vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Light ? 'light' : 'dark';
}

function makeNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 32; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// Future: add a "show preview .bd file" toggle that opens a synthesized buffer.
// Future: support exporting/importing the current palette as JSON.
