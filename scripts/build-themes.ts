import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

type Palette = {
  'fg.default': string;
  'fg.muted': string;
  'bg.default': string;
  'bg.subtle': string;
  heading: string;
  'heading.category': string;
  'heading.section': string;
  'annotation.question': string;
  'annotation.important': string;
  'annotation.starred': string;
  'command.in': string;
  'command.out': string;
  mention: string;
  comment: string;
  'string.quoted': string;
  'string.raw': string;
  key: string;
  value: string;
  'bracket.paren.line': string;
  'bracket.square.line': string;
  'bracket.curly.line': string;
  link: string;
  'list.numbered': string;
  'list.unnumbered': string;
};

// Palette iteration 1 — still expecting rounds of visual tweaks. Source of
// truth for every role is here; theme JSONs are derived output.

const DARK: Palette = {
  'fg.default': '#e4e4e4',
  'fg.muted': '#7a7a7a',
  'bg.default': '#1b1b1f',
  'bg.subtle': '#232329',
  heading: '#e47a0a',
  'heading.category': '#d47ac6',
  'heading.section': '#f356aa', // ported from old ++ (distinctive section hue)
  'annotation.question': '#49e9a6',
  'annotation.important': '#ff8c4a', // coral; distinct from heading orange
  'annotation.starred': '#f5d547', // yellow marker; content stays fg.default
  'command.in': '#7e8cc4', // slate-blue, clearly not URL cyan
  'command.out': '#ffb86c',
  mention: '#bd93f9',
  comment: '#6b7893',
  'string.quoted': '#e0d48a',
  'string.raw': '#50d27b',
  key: '#a497c4', // muted violet; not blue, distinct from link
  value: '#e4e4e4',
  'bracket.paren.line': '#e09770', // bumped saturation/lightness
  'bracket.square.line': '#b58af0',
  'bracket.curly.line': '#70d4a2',
  link: '#8be9fd',
  'list.numbered': '#d4d4d4',
  'list.unnumbered': '#db8fee', // ported exact hex from old minus
};

const LIGHT: Palette = {
  'fg.default': '#24292e',
  'fg.muted': '#8a8a8a',
  'bg.default': '#fdfdfb',
  'bg.subtle': '#f4f4f0',
  heading: '#b85f0a', // vivid warm orange
  'heading.category': '#5e3aa7', // deep violet — was pink, collided with section
  'heading.section': '#c73f88', // hot pink, from old ++
  'annotation.question': '#0f7a42',
  'annotation.important': '#c85a1f', // coral
  'annotation.starred': '#a07b00', // yellow (darker for readability on white)
  'command.in': '#4a5e94', // slate-blue; distinct from URL cyan-blue
  'command.out': '#b4541e',
  mention: '#8a4ad4', // brighter violet — keeps distinct from category's deeper violet
  comment: '#6a737d',
  'string.quoted': '#6b5d00',
  'string.raw': '#145a32',
  key: '#2d7a88', // dim cyan — structural, distinct from link and command.in
  value: '#24292e',
  'bracket.paren.line': '#8a5a2b', // warm brown
  'bracket.square.line': '#6a4096', // muted purple
  'bracket.curly.line': '#2d7a3a', // muted green
  link: '#0366d6',
  'list.numbered': '#3a3a3a',
  'list.unnumbered': '#b34d8c', // pink-violet; distinct from heading.category
};

function parseHex(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function toHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

// Mix foreground toward background by `amount` ∈ [0,1]. 0 = full fg,
// 1 = full bg. Used to build tier-2/tier-3 intensity variants from the
// base palette role.
function dim(fg: string, bg: string, amount: number): string {
  const f = parseHex(fg);
  const b = parseHex(bg);
  return toHex({
    r: f.r * (1 - amount) + b.r * amount,
    g: f.g * (1 - amount) + b.g * amount,
    b: f.b * (1 - amount) + b.b * amount,
  });
}

type TokenRule = {
  name?: string;
  scope: string | string[];
  settings: { foreground?: string; background?: string; fontStyle?: string };
};

function buildTokenColors(p: Palette, dimTarget: string): TokenRule[] {
  const fg = p['fg.default'];
  const d2 = (c: string) => dim(c, dimTarget, 0.25); // level 2 → 75% intensity
  const d3 = (c: string) => dim(c, dimTarget, 0.5); //  level 3 → 50% intensity
  // Muted-family level-3: take d3 and mix 5% toward fg so ---/___
  // don't collapse visually into the comment grey.
  const d3Bumped = (c: string) => dim(d3(c), fg, 0.05);
  // Underscore lines: start from fg.muted and mix 20% toward fg so they
  // read as soft structural markers rather than comments.
  const underscoreFg = dim(p['fg.muted'], fg, 0.2);

  return [
    // Headings — primary accent, bold; levels 2/3 dim toward background.
    { scope: 'markup.heading.1.bd', settings: { foreground: p.heading, fontStyle: 'bold' } },
    { scope: 'markup.heading.2.bd', settings: { foreground: d2(p.heading), fontStyle: 'bold' } },
    { scope: 'markup.heading.3.bd', settings: { foreground: d3(p.heading), fontStyle: 'bold' } },
    { scope: 'punctuation.definition.heading.bd', settings: { foreground: p['fg.muted'] } },

    // Category — secondary accent.
    { scope: 'markup.heading.category.bd', settings: { foreground: p['heading.category'], fontStyle: 'bold' } },
    { scope: 'markup.heading.category.2.bd', settings: { foreground: d2(p['heading.category']), fontStyle: 'bold' } },
    { scope: 'markup.heading.category.3.bd', settings: { foreground: d3(p['heading.category']), fontStyle: 'bold' } },

    // Section — tertiary accent.
    { scope: 'markup.heading.section.bd', settings: { foreground: p['heading.section'], fontStyle: 'bold' } },
    { scope: 'markup.heading.section.2.bd', settings: { foreground: d2(p['heading.section']), fontStyle: 'bold' } },
    { scope: 'markup.heading.section.3.bd', settings: { foreground: d3(p['heading.section']), fontStyle: 'bold' } },

    // Unordered items.
    { scope: 'markup.list.unnumbered.bd', settings: { foreground: p['list.unnumbered'] } },
    { scope: 'markup.list.unnumbered.2.bd', settings: { foreground: d2(p['list.unnumbered']) } },
    { scope: 'markup.list.unnumbered.3.bd', settings: { foreground: d3Bumped(p['list.unnumbered']) } },
    {
      scope: [
        'punctuation.definition.list.begin.bd',
        'punctuation.definition.list.begin.2.bd',
        'punctuation.definition.list.begin.3.bd',
      ],
      settings: { foreground: p['fg.muted'] },
    },

    // Question — visually strongest (bold italic), preserving the old
    // dark theme convention.
    {
      scope: ['markup.other.callout.question.line.bd', 'keyword.other.annotation.question.bd'],
      settings: { foreground: p['annotation.question'], fontStyle: 'bold italic' },
    },
    { scope: 'keyword.other.annotation.question.2.bd', settings: { foreground: d2(p['annotation.question']), fontStyle: 'bold italic' } },
    { scope: 'keyword.other.annotation.question.3.bd', settings: { foreground: d3(p['annotation.question']), fontStyle: 'bold italic' } },

    // Admiration (!) — attention accent.
    {
      scope: ['markup.other.callout.important.line.bd', 'keyword.other.annotation.important.bd'],
      settings: { foreground: p['annotation.important'], fontStyle: 'bold' },
    },

    // Starred (*).
    { scope: 'keyword.other.annotation.starred.bd', settings: { foreground: p['annotation.starred'], fontStyle: 'bold' } },
    { scope: 'keyword.other.annotation.starred.2.bd', settings: { foreground: d2(p['annotation.starred']), fontStyle: 'bold' } },
    { scope: 'keyword.other.annotation.starred.3.bd', settings: { foreground: d3(p['annotation.starred']), fontStyle: 'bold' } },

    // Commands (<, >).
    { scope: 'keyword.other.command.out.bd', settings: { foreground: p['command.out'] } },
    { scope: 'keyword.other.command.out.2.bd', settings: { foreground: d2(p['command.out']) } },
    { scope: 'keyword.other.command.out.3.bd', settings: { foreground: d3(p['command.out']) } },
    { scope: 'keyword.other.command.in.bd', settings: { foreground: p['command.in'] } },
    { scope: 'keyword.other.command.in.2.bd', settings: { foreground: d2(p['command.in']) } },
    { scope: 'keyword.other.command.in.3.bd', settings: { foreground: d3(p['command.in']) } },

    // Mention.
    { scope: ['meta.mention.line.bd', 'variable.other.mention.bd'], settings: { foreground: p.mention } },

    // Comment.
    { scope: 'comment.line.double-slash.bd', settings: { foreground: p.comment, fontStyle: 'italic' } },
    { scope: 'punctuation.definition.comment.bd', settings: { foreground: p['fg.muted'] } },

    // Strings.
    {
      scope: ['string.quoted.double.bd', 'string.quoted.single.bd'],
      settings: { foreground: p['string.quoted'] },
    },
    { scope: 'markup.inline.raw.bd', settings: { foreground: p['string.raw'] } },
    {
      scope: ['punctuation.definition.string.bd', 'punctuation.definition.raw.bd'],
      settings: { foreground: p['fg.muted'] },
    },

    // Key: value.
    { scope: 'variable.other.key.bd', settings: { foreground: p.key } },
    { scope: 'punctuation.separator.key-value.bd', settings: { foreground: p['fg.muted'] } },
    { scope: 'string.unquoted.value.bd', settings: { foreground: p.value } },

    // Numbered / alpha lists.
    { scope: 'markup.list.numbered.bd', settings: { foreground: p['list.numbered'] } },
    { scope: 'punctuation.definition.list.begin.numbered.bd', settings: { foreground: p['fg.muted'] } },
    { scope: 'markup.list.alpha.bd', settings: { foreground: p['list.unnumbered'] } },

    // Line-level parens/brackets/braces (label-style, not delimiters).
    { scope: 'meta.parens.line.bd', settings: { foreground: p['bracket.paren.line'] } },
    { scope: 'meta.brackets.line.bd', settings: { foreground: p['bracket.square.line'] } },
    { scope: 'meta.braces.line.bd', settings: { foreground: p['bracket.curly.line'] } },

    // Links.
    { scope: 'markup.underline.link.bd', settings: { foreground: p.link, fontStyle: 'underline' } },

    // Underscore lines (tokenised but low-polish per Tier 2). Brightened
    // away from comment grey so they don't read as commented-out.
    { scope: 'markup.other.underscore.bd', settings: { foreground: underscoreFg, fontStyle: 'italic' } },
    { scope: 'markup.other.double-underscore.bd', settings: { foreground: underscoreFg, fontStyle: 'italic' } },

    // Escape sequences inside strings.
    { scope: 'constant.character.escape.bd', settings: { foreground: p['fg.muted'] } },
  ];
}

function buildColors(p: Palette) {
  return {
    'editor.background': p['bg.default'],
    'editor.foreground': p['fg.default'],
    'editor.lineHighlightBackground': p['bg.subtle'],
    'editorLineNumber.foreground': p['fg.muted'],
    'editorCursor.foreground': p['fg.default'],
  };
}

function buildTheme(name: string, type: 'dark' | 'light', palette: Palette) {
  // Dim target varies by theme: dark themes dim level-2/3 toward the
  // (very dark) bg, which darkens while preserving hue. Light themes
  // can't dim toward white — that washes saturated hues into pastels
  // that all look alike on paper — so we mix toward fg.muted (a mid
  // grey) instead. Same directional idea ("less intense sibling"),
  // adapted to the surface.
  const dimTarget = type === 'dark' ? palette['bg.default'] : palette['fg.muted'];
  return {
    name,
    type,
    colors: buildColors(palette),
    tokenColors: buildTokenColors(palette, dimTarget),
    semanticTokenColors: {},
  };
}

function writeTheme(outPath: string, theme: object) {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(theme, null, 2) + '\n');
  console.log(`wrote ${outPath}`);
}

const root = resolve(__dirname, '..');
writeTheme(resolve(root, 'themes/braindump-dark.json'), buildTheme('Braindump Dark', 'dark', DARK));
writeTheme(resolve(root, 'themes/braindump-light.json'), buildTheme('Braindump Light', 'light', LIGHT));
