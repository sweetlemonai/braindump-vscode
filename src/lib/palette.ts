import type { ConstructKind } from './parser';

export type PaletteRole =
  | 'fg.default'
  | 'fg.muted'
  | 'bg.default'
  | 'bg.subtle'
  | 'heading'
  | 'heading.category'
  | 'heading.section'
  | 'annotation.question'
  | 'annotation.important'
  | 'annotation.starred'
  | 'command.in'
  | 'command.out'
  | 'mention'
  | 'comment'
  | 'string.quoted'
  | 'string.raw'
  | 'key'
  | 'value'
  | 'bracket.paren.line'
  | 'bracket.square.line'
  | 'bracket.curly.line'
  | 'link'
  | 'list.numbered'
  | 'list.unnumbered';

export type Palette = Record<PaletteRole, string>;

export type PaletteKind = 'dark' | 'light';

export const DARK: Palette = {
  'fg.default': '#e4e4e4',
  'fg.muted': '#7a7a7a',
  'bg.default': '#1b1b1f',
  'bg.subtle': '#232329',
  heading: '#e47a0a',
  'heading.category': '#d47ac6',
  'heading.section': '#f356aa',
  'annotation.question': '#49e9a6',
  'annotation.important': '#ff8c4a',
  'annotation.starred': '#f5d547',
  'command.in': '#7e8cc4',
  'command.out': '#ffb86c',
  mention: '#bd93f9',
  comment: '#6b7893',
  'string.quoted': '#e0d48a',
  'string.raw': '#50d27b',
  key: '#a497c4',
  value: '#e4e4e4',
  'bracket.paren.line': '#e09770',
  'bracket.square.line': '#b58af0',
  'bracket.curly.line': '#70d4a2',
  link: '#8be9fd',
  'list.numbered': '#d4d4d4',
  'list.unnumbered': '#db8fee',
};

export const LIGHT: Palette = {
  'fg.default': '#24292e',
  'fg.muted': '#8a8a8a',
  'bg.default': '#fdfdfb',
  'bg.subtle': '#f4f4f0',
  heading: '#b85f0a',
  'heading.category': '#5e3aa7',
  'heading.section': '#c73f88',
  'annotation.question': '#0f7a42',
  'annotation.important': '#c85a1f',
  'annotation.starred': '#a07b00',
  'command.in': '#4a5e94',
  'command.out': '#b4541e',
  mention: '#8a4ad4',
  comment: '#6a737d',
  'string.quoted': '#6b5d00',
  'string.raw': '#145a32',
  key: '#2d7a88',
  value: '#24292e',
  'bracket.paren.line': '#8a5a2b',
  'bracket.square.line': '#6a4096',
  'bracket.curly.line': '#2d7a3a',
  link: '#0366d6',
  'list.numbered': '#3a3a3a',
  'list.unnumbered': '#b34d8c',
};

function parseHex(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function toHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const h = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

// Mix foreground toward a target by `amount` ∈ [0,1]. Dark palettes dim
// toward bg (hue-preserving darken); light palettes dim toward fg.muted
// (a mid grey) so saturated hues don't wash into pastels on white.
export function dim(fg: string, target: string, amount: number): string {
  const f = parseHex(fg);
  const t = parseHex(target);
  return toHex({
    r: f.r * (1 - amount) + t.r * amount,
    g: f.g * (1 - amount) + t.g * amount,
    b: f.b * (1 - amount) + t.b * amount,
  });
}

export type FontStyle = 'bold' | 'italic' | 'bold italic' | 'underline';

export interface ConstructStyle {
  color: string;
  fontStyle?: FontStyle;
}

export type ConstructStyleMap = Record<ConstructKind, ConstructStyle>;

export function buildStyleMap(palette: Palette, kind: PaletteKind): ConstructStyleMap {
  const dimTarget = kind === 'dark' ? palette['bg.default'] : palette['fg.muted'];
  const d2 = (c: string) => dim(c, dimTarget, 0.25);
  const d3 = (c: string) => dim(c, dimTarget, 0.5);

  return {
    heading1: { color: palette.heading, fontStyle: 'bold' },
    heading2: { color: d2(palette.heading), fontStyle: 'bold' },
    heading3: { color: d3(palette.heading), fontStyle: 'bold' },

    category1: { color: palette['heading.category'], fontStyle: 'bold' },
    category2: { color: d2(palette['heading.category']), fontStyle: 'bold' },
    category3: { color: d3(palette['heading.category']), fontStyle: 'bold' },

    section1: { color: palette['heading.section'], fontStyle: 'bold' },
    section2: { color: d2(palette['heading.section']), fontStyle: 'bold' },
    section3: { color: d3(palette['heading.section']), fontStyle: 'bold' },

    question1: { color: palette['annotation.question'], fontStyle: 'bold italic' },
    question2: { color: d2(palette['annotation.question']), fontStyle: 'bold italic' },
    question3: { color: d3(palette['annotation.question']), fontStyle: 'bold italic' },

    admiration: { color: palette['annotation.important'], fontStyle: 'bold' },

    starred1: { color: palette['annotation.starred'], fontStyle: 'bold' },
    starred2: { color: d2(palette['annotation.starred']), fontStyle: 'bold' },
    starred3: { color: d3(palette['annotation.starred']), fontStyle: 'bold' },

    commandOut1: { color: palette['command.out'] },
    commandOut2: { color: d2(palette['command.out']) },
    commandOut3: { color: d3(palette['command.out']) },

    commandIn1: { color: palette['command.in'] },
    commandIn2: { color: d2(palette['command.in']) },
    commandIn3: { color: d3(palette['command.in']) },

    mention: { color: palette.mention },
    comment: { color: palette.comment, fontStyle: 'italic' },
    link: { color: palette.link, fontStyle: 'underline' },
  };
}

// ColorThemeKind values per VS Code API:
//   Light = 1, Dark = 2, HighContrast = 3, HighContrastLight = 4
export function paletteKindFor(themeKind: number): PaletteKind {
  return themeKind === 1 || themeKind === 4 ? 'light' : 'dark';
}

export function selectPalette(themeKind: number): { palette: Palette; kind: PaletteKind } {
  const kind = paletteKindFor(themeKind);
  return { palette: kind === 'dark' ? DARK : LIGHT, kind };
}
