import { ColorMap, GROUPS, PRESET_LABELS, PresetId, TOKENS } from './presets';

interface BuildArgs {
  colors: ColorMap;
  presets: Record<PresetId, ColorMap>;
  activePreset: PresetId | null;
  cspSource: string;
  nonce: string;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function getHtml(args: BuildArgs): string {
  const { colors, presets, activePreset, cspSource, nonce } = args;
  const activeLabel = activePreset ? PRESET_LABELS[activePreset] : 'Custom';

  const presetCardsHtml = (Object.keys(PRESET_LABELS) as PresetId[])
    .map((id) => {
      const checked = id === activePreset ? 'checked' : '';
      return `<label class="preset"><input type="radio" name="preset" value="${id}" ${checked}><span class="preset-name">${escapeHtml(PRESET_LABELS[id])}</span><span class="preset-swatches">${swatchesFor(presets[id])}</span></label>`;
    })
    .join('');

  const groupsHtml = GROUPS.map((g) => {
    const rows = TOKENS.filter((t) => t.group === g.id)
      .map((t) => {
        const color = colors[t.id];
        const previewStyle =
          t.previewMode === 'line'
            ? `color:${color}`
            : `color:var(--vscode-foreground)`;
        const markerOnly = t.previewMode === 'marker';
        const previewInner = markerOnly
          ? renderMarkerPreview(t.preview, color)
          : escapeHtml(t.preview);
        const extraClass = t.id === 'comment' || t.id === 'question' ? ' italic' : '';
        return `<div class="row" data-token="${t.id}">
            <div class="row-label">${escapeHtml(t.label)}</div>
            <div class="row-preview${extraClass}" style="${previewStyle}" data-preview-mode="${t.previewMode}">${previewInner}</div>
            <input class="row-color" type="color" value="${color}" data-token="${t.id}" aria-label="${escapeHtml(t.label)} color">
            <code class="row-hex">${escapeHtml(color)}</code>
          </div>`;
      })
      .join('');
    return `<section class="group"><h3 class="group-label">${escapeHtml(g.label)}</h3><div class="rows">${rows}</div></section>`;
  }).join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${cspSource};">
<title>Braindump Colors</title>
<style>
  body { font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); color: var(--vscode-foreground); background: var(--vscode-editor-background); margin: 0; padding: 16px 20px 80px; }
  h1 { font-size: 1.3em; margin: 0 0 4px; font-weight: 600; }
  h2 { font-size: 1em; margin: 24px 0 8px; font-weight: 600; opacity: 0.85; text-transform: uppercase; letter-spacing: 0.04em; }
  h3.group-label { font-size: 0.85em; margin: 16px 0 6px; font-weight: 600; opacity: 0.7; }
  .header-status { opacity: 0.75; font-size: 0.9em; margin-bottom: 16px; }
  .header-status strong { font-weight: 600; opacity: 1; }

  .presets { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; }
  .preset { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border: 1px solid var(--vscode-panel-border, var(--vscode-editorWidget-border, #444)); border-radius: 4px; cursor: pointer; background: var(--vscode-editor-background); }
  .preset input[type="radio"] { margin: 0; }
  .preset:hover { background: var(--vscode-list-hoverBackground); }
  .preset input:checked ~ .preset-name { font-weight: 600; }
  .preset.is-active { border-color: var(--vscode-focusBorder); }
  .preset-name { flex: 1; }
  .preset-swatches { display: inline-flex; gap: 2px; }
  .swatch { width: 10px; height: 14px; display: inline-block; border-radius: 1px; }

  .group { margin-top: 12px; }
  .rows { display: flex; flex-direction: column; gap: 4px; }
  .row { display: grid; grid-template-columns: 130px 1fr 28px 80px; align-items: center; gap: 12px; padding: 4px 6px; border-radius: 3px; }
  .row:hover { background: var(--vscode-list-hoverBackground); }
  .row-label { opacity: 0.85; font-size: 0.92em; }
  .row-preview { font-family: var(--vscode-editor-font-family, monospace); font-size: 0.95em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .row-preview.italic { font-style: italic; }
  .row-color { width: 28px; height: 22px; padding: 0; border: 1px solid var(--vscode-input-border, transparent); background: transparent; cursor: pointer; }
  .row-hex { font-size: 0.82em; opacity: 0.6; font-family: var(--vscode-editor-font-family, monospace); }

  .actions { position: fixed; left: 0; right: 0; bottom: 0; padding: 12px 20px; background: var(--vscode-editor-background); border-top: 1px solid var(--vscode-panel-border, var(--vscode-editorWidget-border, #333)); display: flex; align-items: center; gap: 12px; }
  button { font: inherit; color: var(--vscode-button-foreground); background: var(--vscode-button-background); border: 1px solid transparent; padding: 6px 14px; border-radius: 2px; cursor: pointer; }
  button:hover { background: var(--vscode-button-hoverBackground); }
  button.secondary { color: var(--vscode-button-secondaryForeground); background: var(--vscode-button-secondaryBackground); }
  button.secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }
  .saved-msg { opacity: 0; color: var(--vscode-charts-green, var(--vscode-foreground)); font-size: 0.88em; }
  .saved-msg.show { opacity: 1; }
</style>
</head>
<body>
  <h1>Braindump Colors</h1>
  <div class="header-status">Active: <strong id="active-label">${escapeHtml(activeLabel)}</strong></div>

  <h2>Presets</h2>
  <div class="presets" id="presets">${presetCardsHtml}</div>

  <h2>Per-token</h2>
  ${groupsHtml}

  <div class="actions">
    <button id="save">Save</button>
    <button id="reset" class="secondary">Reset to Original</button>
    <span class="saved-msg" id="saved-msg">Saved</span>
  </div>

<script nonce="${nonce}">
(function () {
  const vscode = acquireVsCodeApi();
  const PRESETS = ${JSON.stringify(presets)};
  const PRESET_LABELS = ${JSON.stringify(PRESET_LABELS)};
  const TOKEN_IDS = ${JSON.stringify(TOKENS.map((t) => t.id))};
  const PREVIEWS = ${JSON.stringify(
    Object.fromEntries(TOKENS.map((t) => [t.id, { text: t.preview, mode: t.previewMode }]))
  )};

  let colors = ${JSON.stringify(colors)};
  let activePreset = ${JSON.stringify(activePreset)};

  const activeLabelEl = document.getElementById('active-label');
  const savedMsg = document.getElementById('saved-msg');

  function sameHex(a, b) { return (a || '').toLowerCase() === (b || '').toLowerCase(); }

  function detectPreset() {
    for (const id of Object.keys(PRESETS)) {
      const p = PRESETS[id];
      if (TOKEN_IDS.every((t) => sameHex(colors[t], p[t]))) return id;
    }
    return null;
  }

  function updateHeader() {
    const detected = detectPreset();
    if (detected) {
      activePreset = detected;
      activeLabelEl.textContent = PRESET_LABELS[detected];
    } else if (activePreset) {
      activeLabelEl.textContent = 'Custom (based on ' + PRESET_LABELS[activePreset] + ')';
    } else {
      activeLabelEl.textContent = 'Custom';
    }
    document.querySelectorAll('input[name="preset"]').forEach((el) => {
      el.checked = el.value === detected;
      el.parentElement.classList.toggle('is-active', el.value === detected);
    });
  }

  function renderPreview(row, color) {
    const preview = row.querySelector('.row-preview');
    const tokenId = row.getAttribute('data-token');
    const info = PREVIEWS[tokenId];
    if (info.mode === 'line') {
      preview.style.color = color;
      preview.textContent = info.text;
    } else {
      preview.style.color = '';
      // Marker mode: color the leading non-space token, leave the rest default.
      const text = info.text;
      const m = text.match(/^(\\S+)(.*)$/);
      if (!m) { preview.textContent = text; return; }
      preview.innerHTML = '<span style="color:' + escAttr(color) + '">' + escHtml(m[1]) + '</span>' + escHtml(m[2]);
    }
    const hex = row.querySelector('.row-hex');
    if (hex) hex.textContent = color.toUpperCase();
  }

  function escHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function escAttr(s) { return s.replace(/"/g, '&quot;'); }

  function applyColors(next, presetId) {
    colors = Object.assign({}, colors, next);
    activePreset = presetId;
    document.querySelectorAll('.row').forEach((row) => {
      const id = row.getAttribute('data-token');
      const input = row.querySelector('.row-color');
      input.value = colors[id];
      renderPreview(row, colors[id]);
    });
    updateHeader();
  }

  document.querySelectorAll('.row-color').forEach((input) => {
    input.addEventListener('input', (e) => {
      const id = e.target.getAttribute('data-token');
      colors[id] = e.target.value.toUpperCase();
      renderPreview(e.target.closest('.row'), colors[id]);
      updateHeader();
    });
  });

  document.querySelectorAll('input[name="preset"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      const id = e.target.value;
      applyColors(PRESETS[id], id);
    });
    radio.parentElement.addEventListener('click', (e) => {
      if (e.target !== radio) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change'));
      }
    });
  });

  document.getElementById('save').addEventListener('click', () => {
    vscode.postMessage({ type: 'save', colors });
  });

  document.getElementById('reset').addEventListener('click', () => {
    vscode.postMessage({ type: 'resetToOriginal' });
  });

  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg.type === 'savedConfirmation') {
      savedMsg.classList.add('show');
      setTimeout(() => savedMsg.classList.remove('show'), 1500);
    } else if (msg.type === 'colorsUpdated') {
      applyColors(msg.colors, msg.activePreset);
      savedMsg.classList.add('show');
      setTimeout(() => savedMsg.classList.remove('show'), 1500);
    }
  });

  // Initialize previews for marker-mode rows so the leading glyph is colored.
  document.querySelectorAll('.row').forEach((row) => {
    const id = row.getAttribute('data-token');
    renderPreview(row, colors[id]);
  });
  updateHeader();
})();
</script>
</body>
</html>`;
}

function swatchesFor(palette: ColorMap): string {
  // Show 5 representative tokens as little color bars in the preset card.
  const ids: (keyof ColorMap)[] = ['heading', 'category', 'section', 'bullet', 'question'];
  return ids.map((id) => `<span class="swatch" style="background:${palette[id]}"></span>`).join('');
}

function renderMarkerPreview(text: string, color: string): string {
  const m = /^(\S+)(.*)$/.exec(text);
  if (!m) return escapeHtml(text);
  return `<span style="color:${color}">${escapeHtml(m[1])}</span>${escapeHtml(m[2])}`;
}
