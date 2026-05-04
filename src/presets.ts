// Token registry, palette loading, and color math for the color settings panel.

export type TokenId =
  | 'heading'
  | 'category'
  | 'section'
  | 'bullet'
  | 'bulletPrimary'
  | 'listAlt'
  | 'important'
  | 'forward'
  | 'back'
  | 'numbered'
  | 'numberedAlt'
  | 'lettered'
  | 'letteredAlt'
  | 'key'
  | 'value'
  | 'keyEquals'
  | 'valueEquals'
  | 'keyArrow'
  | 'valueArrow'
  | 'keyDashArrow'
  | 'valueDashArrow'
  | 'sepColon'
  | 'sepEquals'
  | 'sepArrow'
  | 'sepDashArrow'
  | 'question'
  | 'alert'
  | 'mention'
  | 'comment'
  | 'url'
  | 'flag'
  | 'string'
  | 'paren'
  | 'bracket'
  | 'brace';

export type ColorMap = Record<TokenId, string>;

export type GroupId = 'containers' | 'items' | 'annotations' | 'inline';

export interface TokenDef {
  id: TokenId;
  label: string;
  group: GroupId;
  // The depth-1 scope (or sole scope, for non-depth tokens) — the value users edit.
  scope: string;
  // True if this token has depth-2 and depth-3 variants auto-derived from depth-1.
  depthAware: boolean;
  // A short preview string that hints at what the token looks like in a .bd file.
  preview: string;
  // Whether the preview marker color should fill the entire preview ("line"-style)
  // or only color the leading marker glyph ("marker"-style).
  previewMode: 'line' | 'marker';
}

export const GROUPS: { id: GroupId; label: string }[] = [
  { id: 'containers', label: 'Containers' },
  { id: 'items', label: 'Items' },
  { id: 'annotations', label: 'Annotations' },
  { id: 'inline', label: 'Inline' },
];

export const TOKENS: TokenDef[] = [
  { id: 'heading',   label: 'Heading',       group: 'containers',  scope: 'markup.heading.depth-1.braindump',   depthAware: true,  preview: '# Heading',     previewMode: 'line'   },
  { id: 'category',  label: 'Category',      group: 'containers',  scope: 'markup.category.depth-1.braindump',  depthAware: true,  preview: '= Category',    previewMode: 'line'   },
  { id: 'section',   label: 'Section',       group: 'containers',  scope: 'markup.section.depth-1.braindump',   depthAware: true,  preview: '+ Section',     previewMode: 'line'   },

  { id: 'bullet',        label: 'Bullet marker',     group: 'items', scope: 'keyword.bullet.depth-1.braindump',     depthAware: true,  preview: '- bullet',      previewMode: 'marker' },
  { id: 'bulletPrimary', label: 'Bullet primary',    group: 'items', scope: 'meta.list.bullet.body.braindump',      depthAware: false, preview: '- bullet body', previewMode: 'line'   },
  { id: 'listAlt',       label: 'Bullet alt',        group: 'items', scope: 'meta.list.alt.braindump',              depthAware: false, preview: '- alt row',     previewMode: 'line'   },
  { id: 'important',     label: 'Important',         group: 'items', scope: 'keyword.priority.depth-1.braindump',   depthAware: true,  preview: '* important',   previewMode: 'marker' },
  { id: 'forward',       label: 'Forward',           group: 'items', scope: 'markup.forward.depth-1.braindump',     depthAware: true,  preview: '> forward',     previewMode: 'line'   },
  { id: 'back',          label: 'Back',              group: 'items', scope: 'keyword.back.depth-1.braindump',       depthAware: true,  preview: '< back',        previewMode: 'line'   },
  { id: 'numbered',      label: 'Numbered primary',  group: 'items', scope: 'markup.list.numbered.braindump',       depthAware: false, preview: '1. item',       previewMode: 'line'   },
  { id: 'numberedAlt',   label: 'Numbered alt',      group: 'items', scope: 'meta.list.numbered.alt.braindump',     depthAware: false, preview: '2. alt item',   previewMode: 'line'   },
  { id: 'lettered',      label: 'Lettered primary',  group: 'items', scope: 'markup.list.lettered.braindump',       depthAware: false, preview: 'a. item',       previewMode: 'line'   },
  { id: 'letteredAlt',   label: 'Lettered alt',      group: 'items', scope: 'meta.list.lettered.alt.braindump',     depthAware: false, preview: 'b. alt item',   previewMode: 'line'   },
  { id: 'key',             label: 'Key (:)',           group: 'items', scope: 'keyword.field.braindump',                    depthAware: false, preview: 'name:',         previewMode: 'marker' },
  { id: 'value',           label: 'Value (:)',         group: 'items', scope: 'meta.field.value.braindump',                 depthAware: false, preview: 'value',         previewMode: 'line'   },
  { id: 'sepColon',        label: 'Separator :',       group: 'items', scope: 'punctuation.separator.colon.braindump',      depthAware: false, preview: ':',             previewMode: 'line'   },
  { id: 'keyEquals',       label: 'Key (=)',           group: 'items', scope: 'keyword.field.equals.braindump',             depthAware: false, preview: 'name =',        previewMode: 'marker' },
  { id: 'valueEquals',     label: 'Value (=)',         group: 'items', scope: 'meta.field.value.equals.braindump',          depthAware: false, preview: 'value',         previewMode: 'line'   },
  { id: 'sepEquals',       label: 'Separator =',       group: 'items', scope: 'punctuation.separator.equals.braindump',     depthAware: false, preview: '=',             previewMode: 'line'   },
  { id: 'keyArrow',        label: 'Key (=>)',          group: 'items', scope: 'keyword.field.arrow.braindump',              depthAware: false, preview: 'name =>',       previewMode: 'marker' },
  { id: 'valueArrow',      label: 'Value (=>)',        group: 'items', scope: 'meta.field.value.arrow.braindump',           depthAware: false, preview: 'value',         previewMode: 'line'   },
  { id: 'sepArrow',        label: 'Separator =>',      group: 'items', scope: 'punctuation.separator.arrow.braindump',      depthAware: false, preview: '=>',            previewMode: 'line'   },
  { id: 'keyDashArrow',    label: 'Key (->)',          group: 'items', scope: 'keyword.field.dash-arrow.braindump',         depthAware: false, preview: 'name ->',       previewMode: 'marker' },
  { id: 'valueDashArrow',  label: 'Value (->)',        group: 'items', scope: 'meta.field.value.dash-arrow.braindump',      depthAware: false, preview: 'value',         previewMode: 'line'   },
  { id: 'sepDashArrow',    label: 'Separator ->',      group: 'items', scope: 'punctuation.separator.dash-arrow.braindump', depthAware: false, preview: '->',            previewMode: 'line'   },

  { id: 'question',  label: 'Question',      group: 'annotations', scope: 'markup.question.depth-1.braindump',  depthAware: true,  preview: '? question',    previewMode: 'line'   },
  { id: 'alert',     label: 'Alert',         group: 'annotations', scope: 'markup.alert.braindump',             depthAware: false, preview: '! alert',       previewMode: 'line'   },
  { id: 'mention',   label: 'Mention',       group: 'annotations', scope: 'keyword.mention.braindump',          depthAware: false, preview: '@alice',        previewMode: 'marker' },
  { id: 'comment',   label: 'Comment',       group: 'annotations', scope: 'comment.line.double-slash.braindump',depthAware: false, preview: '// comment',    previewMode: 'line'   },

  { id: 'url',       label: 'URL',           group: 'inline',      scope: 'markup.underline.link.braindump',    depthAware: false, preview: 'https://x.com', previewMode: 'marker' },
  { id: 'flag',      label: 'Flag',          group: 'inline',      scope: 'keyword.flag.braindump',             depthAware: false, preview: '--flag',        previewMode: 'marker' },
  { id: 'string',    label: 'String',        group: 'inline',      scope: 'string.quoted.double.braindump',     depthAware: false, preview: '"quoted"',      previewMode: 'marker' },
  { id: 'paren',     label: 'Paren label',   group: 'inline',      scope: 'markup.paren.line.content.braindump',depthAware: false, preview: '(label)',       previewMode: 'marker' },
  { id: 'bracket',   label: 'Bracket label', group: 'inline',      scope: 'markup.bracket.line.content.braindump', depthAware: false, preview: '[label]',    previewMode: 'marker' },
  { id: 'brace',     label: 'Brace label',   group: 'inline',      scope: 'markup.brace.line.braindump',        depthAware: false, preview: '{label}',       previewMode: 'line'   },
];

const TOKEN_BY_SCOPE = new Map(TOKENS.map((t) => [t.scope, t]));

interface RawRule {
  scope?: string;
  settings?: { foreground?: string; fontStyle?: string };
}

export interface OutRule {
  scope: string;
  settings: { foreground?: string; fontStyle?: string };
}

// Walk a textMateRules array (from package.json or from user settings) and
// pull out the foreground color for each editable token's depth-1 scope.
// Falls back to `defaults` for any scope that isn't present.
export function colorsFromRules(rules: RawRule[] | undefined, defaults: ColorMap): ColorMap {
  const out: ColorMap = { ...defaults };
  if (!rules) return out;
  for (const rule of rules) {
    const def = rule.scope ? TOKEN_BY_SCOPE.get(rule.scope) : undefined;
    const fg = rule.settings?.foreground;
    if (def && fg) out[def.id] = normalizeHex(fg);
  }
  return out;
}

// Pulls the dark and light palettes out of the bundled package.json so the
// "Original" and "Light" presets always match what the extension ships.
export function readBundledPalettes(packageJSON: unknown): { dark: ColorMap; light: ColorMap } {
  const seed = TOKENS.reduce<ColorMap>((acc, t) => {
    acc[t.id] = '#000000';
    return acc;
  }, {} as ColorMap);

  const root = (packageJSON as { contributes?: { configurationDefaults?: Record<string, unknown> } }).contributes
    ?.configurationDefaults as Record<string, unknown> | undefined;
  const tcc = (root?.['editor.tokenColorCustomizations'] as Record<string, unknown>) ?? {};
  const darkRules = tcc.textMateRules as RawRule[] | undefined;
  const lightRules = (tcc['[*Light*]'] as { textMateRules?: RawRule[] } | undefined)?.textMateRules;

  return {
    dark: colorsFromRules(darkRules, seed),
    light: colorsFromRules(lightRules, seed),
  };
}

// ---------- color math ----------

function normalizeHex(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  return m ? '#' + m[1].toUpperCase() : hex;
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return [0, 0, 0];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return ('#' + c(r) + c(g) + c(b)).toUpperCase();
}

// Multiply each RGB channel by (1 - percent/100). Used for depth-2/3 gradients.
export function darken(hex: string, percent: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = 1 - percent / 100;
  return rgbToHex(r * f, g * f, b * f);
}

// Hand-tuned alternative palettes. All three are calibrated for dark themes;
// light-theme users get the bundled "Light" preset instead.

// Mono — minimal grayscale with two accents (warm for alarms, cool for
// metadata/links). For users who want sigils to do the talking and color to
// stay out of the way.
const MONO: ColorMap = {
  heading:       '#D8D8D8',
  category:      '#B8B8B8',
  section:       '#B8B8B8',
  bullet:        '#989898',
  bulletPrimary: '#C5C2D6',
  listAlt:       '#787878',
  important:     '#D8A058',
  forward:       '#989898',
  back:          '#989898',
  numbered:      '#989898',
  numberedAlt:   '#787878',
  lettered:      '#989898',
  letteredAlt:   '#787878',
  key:             '#98AAC8',
  value:           '#B8B8B8',
  keyEquals:       '#98AAC8',
  valueEquals:     '#B8B8B8',
  keyArrow:        '#98AAC8',
  valueArrow:      '#B8B8B8',
  keyDashArrow:    '#98AAC8',
  valueDashArrow:  '#B8B8B8',
  sepColon:        '#787878',
  sepEquals:       '#787878',
  sepArrow:        '#787878',
  sepDashArrow:    '#787878',
  question:      '#989898',
  alert:         '#D8A058',
  mention:       '#98AAC8',
  comment:       '#787878',
  url:           '#98AAC8',
  flag:          '#787878',
  string:        '#B8B8B8',
  paren:         '#989898',
  bracket:       '#989898',
  brace:         '#989898',
};

// Sunset — single-family warm palette: oranges, ambers, terracottas, peach.
// Important breaks to a brighter red so it still reads as alarm.
const SUNSET: ColorMap = {
  heading:       '#E8782A',
  category:      '#D89A40',
  section:       '#C85838',
  bullet:        '#C8A068',
  bulletPrimary: '#E8D0A8',
  listAlt:       '#A88858',
  important:     '#E03820',
  forward:       '#D8B068',
  back:          '#A88858',
  numbered:      '#DAA520',
  numberedAlt:   '#C4951D',
  lettered:      '#DAA520',
  letteredAlt:   '#C4951D',
  key:             '#E8C078',
  value:           '#F0D8A0',
  keyEquals:       '#E8C078',
  valueEquals:     '#F0D8A0',
  keyArrow:        '#E8C078',
  valueArrow:      '#F0D8A0',
  keyDashArrow:    '#E8C078',
  valueDashArrow:  '#F0D8A0',
  sepColon:        '#A88858',
  sepEquals:       '#A88858',
  sepArrow:        '#A88858',
  sepDashArrow:    '#A88858',
  question:      '#B89058',
  alert:         '#F0B820',
  mention:       '#D88060',
  comment:       '#886850',
  url:           '#C8A888',
  flag:          '#A08868',
  string:        '#E8B048',
  paren:         '#B0905C',
  bracket:       '#D8A858',
  brace:         '#C85838',
};

// Ocean — single-family cool palette: blues, teals, sea-greens, sage. One
// red break for important so warnings don't disappear into the cool wash.
const OCEAN: ColorMap = {
  heading:       '#58A8D8',
  category:      '#209BC8',
  section:       '#5078A8',
  bullet:        '#80B098',
  bulletPrimary: '#B8C8D8',
  listAlt:       '#5C7A88',
  important:     '#D85858',
  forward:       '#2A9097',
  back:          '#6B9080',
  numbered:      '#5C8F50',
  numberedAlt:   '#538148',
  lettered:      '#5C8F50',
  letteredAlt:   '#538148',
  key:             '#50B0C8',
  value:           '#A0D0E0',
  keyEquals:       '#50B0C8',
  valueEquals:     '#A0D0E0',
  keyArrow:        '#50B0C8',
  valueArrow:      '#A0D0E0',
  keyDashArrow:    '#50B0C8',
  valueDashArrow:  '#A0D0E0',
  sepColon:        '#6080A0',
  sepEquals:       '#6080A0',
  sepArrow:        '#6080A0',
  sepDashArrow:    '#6080A0',
  question:      '#50A878',
  alert:         '#98B048',
  mention:       '#8090D0',
  comment:       '#6080A0',
  url:           '#80A0D8',
  flag:          '#5878A0',
  string:        '#98B0A8',
  paren:         '#5C8F50',
  bracket:       '#6B9080',
  brace:     '#5078A8',
};

export type PresetId = 'original' | 'minimal' | 'sunset' | 'ocean' | 'light';

export const PRESET_LABELS: Record<PresetId, string> = {
  original: 'Original',
  minimal: 'Minimal',
  sunset: 'Sunset',
  ocean: 'Ocean',
  light: 'Light',
};

export function buildAllPresets(packageJSON: unknown): Record<PresetId, ColorMap> {
  const { dark, light } = readBundledPalettes(packageJSON);
  return {
    original: dark,
    minimal: MONO,
    sunset: SUNSET,
    ocean: OCEAN,
    light,
  };
}

// Returns the matching preset id if the given colors match one exactly,
// otherwise null. Comparison is case-insensitive on hex.
export function matchPreset(
  colors: ColorMap,
  presets: Record<PresetId, ColorMap>
): PresetId | null {
  for (const id of Object.keys(presets) as PresetId[]) {
    if (TOKENS.every((t) => sameHex(colors[t.id], presets[id][t.id]))) return id;
  }
  return null;
}

function sameHex(a: string, b: string): boolean {
  return normalizeHex(a) === normalizeHex(b);
}

// Build the full textMateRules array for user settings: depth-1 from the user's
// picked colors, depth-2/3 auto-derived for depth-aware tokens, plus any
// bundled non-editable scopes (task brackets, key value, priority bold, etc.)
// so saving the panel doesn't strip them.
export function buildTextMateRules(colors: ColorMap, fixed: OutRule[] = []): OutRule[] {
  const rules: OutRule[] = [];
  for (const t of TOKENS) {
    const c = colors[t.id];
    rules.push({ scope: t.scope, settings: { foreground: c } });
    if (t.depthAware) {
      const base = t.scope.replace('depth-1', 'depth-2');
      const deeper = t.scope.replace('depth-1', 'depth-3');
      rules.push({ scope: base, settings: { foreground: darken(c, 10) } });
      rules.push({ scope: deeper, settings: { foreground: darken(c, 20) } });
    }
    // Paren and bracket lines use a swapped two-color scheme: a paren line's
    // brackets share the bracket-content color and vice-versa. So the panel's
    // "Paren label" color is written to paren content + bracket punctuation;
    // "Bracket label" color is written to bracket content + paren punctuation.
    if (t.id === 'paren') {
      rules.push({ scope: 'punctuation.bracket.line.braindump', settings: { foreground: c } });
    } else if (t.id === 'bracket') {
      rules.push({ scope: 'punctuation.paren.line.braindump', settings: { foreground: c } });
    }
  }
  rules.push(...fixed);
  return rules;
}

// Pull bundled rules for scopes that the panel does NOT expose (task bracket,
// key value, priority bold, source default, etc.) so they survive a save.
// `kind` picks the bundled palette: dark uses top-level rules, light uses the
// [*Light*] override block.
export function bundledFixedRules(packageJSON: unknown, kind: 'dark' | 'light'): OutRule[] {
  const root = (packageJSON as { contributes?: { configurationDefaults?: Record<string, unknown> } }).contributes
    ?.configurationDefaults as Record<string, unknown> | undefined;
  const tcc = (root?.['editor.tokenColorCustomizations'] as Record<string, unknown>) ?? {};
  const allRules =
    kind === 'dark'
      ? (tcc.textMateRules as RawRule[] | undefined)
      : (tcc['[*Light*]'] as { textMateRules?: RawRule[] } | undefined)?.textMateRules;
  if (!allRules) return [];

  const editableScopes = new Set<string>();
  for (const t of TOKENS) {
    editableScopes.add(t.scope);
    if (t.depthAware) {
      editableScopes.add(t.scope.replace('depth-1', 'depth-2'));
      editableScopes.add(t.scope.replace('depth-1', 'depth-3'));
    }
  }
  // Punctuation scopes are also handled by buildTextMateRules (mirrored from
  // the paren/bracket content color), so exclude them too.
  editableScopes.add('punctuation.paren.line.braindump');
  editableScopes.add('punctuation.bracket.line.braindump');

  const out: OutRule[] = [];
  for (const r of allRules) {
    if (!r.scope || editableScopes.has(r.scope)) continue;
    out.push({ scope: r.scope, settings: { ...r.settings } });
  }
  return out;
}
