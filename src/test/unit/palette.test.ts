import { describe, expect, it } from 'vitest';
import {
  DARK,
  LIGHT,
  buildStyleMap,
  paletteKindFor,
  selectPalette,
} from '../../lib/palette';

// ColorThemeKind values per VS Code API:
//   Light = 1, Dark = 2, HighContrast = 3, HighContrastLight = 4
const ColorThemeKind = {
  Light: 1,
  Dark: 2,
  HighContrast: 3,
  HighContrastLight: 4,
} as const;

describe('paletteKindFor', () => {
  it('returns dark for Dark themes', () => {
    expect(paletteKindFor(ColorThemeKind.Dark)).toBe('dark');
  });

  it('returns light for Light themes', () => {
    expect(paletteKindFor(ColorThemeKind.Light)).toBe('light');
  });

  it('returns dark for HighContrast themes', () => {
    expect(paletteKindFor(ColorThemeKind.HighContrast)).toBe('dark');
  });

  it('returns light for HighContrastLight themes', () => {
    expect(paletteKindFor(ColorThemeKind.HighContrastLight)).toBe('light');
  });
});

describe('selectPalette', () => {
  it('picks DARK for Dark themes', () => {
    expect(selectPalette(ColorThemeKind.Dark).palette).toBe(DARK);
  });

  it('picks LIGHT for Light themes', () => {
    expect(selectPalette(ColorThemeKind.Light).palette).toBe(LIGHT);
  });

  it('picks DARK for HighContrast', () => {
    expect(selectPalette(ColorThemeKind.HighContrast).palette).toBe(DARK);
  });

  it('picks LIGHT for HighContrastLight', () => {
    expect(selectPalette(ColorThemeKind.HighContrastLight).palette).toBe(LIGHT);
  });
});

describe('buildStyleMap', () => {
  it('returns bold for heading levels', () => {
    const map = buildStyleMap(DARK, 'dark');
    expect(map.heading1.fontStyle).toBe('bold');
    expect(map.heading2.fontStyle).toBe('bold');
    expect(map.heading3.fontStyle).toBe('bold');
  });

  it('returns bold italic for question levels', () => {
    const map = buildStyleMap(DARK, 'dark');
    expect(map.question1.fontStyle).toBe('bold italic');
    expect(map.question2.fontStyle).toBe('bold italic');
    expect(map.question3.fontStyle).toBe('bold italic');
  });

  it('returns italic for comment and underline for link', () => {
    const map = buildStyleMap(DARK, 'dark');
    expect(map.comment.fontStyle).toBe('italic');
    expect(map.link.fontStyle).toBe('underline');
  });

  it('assigns the DARK heading color for heading1 in dark mode', () => {
    const map = buildStyleMap(DARK, 'dark');
    expect(map.heading1.color).toBe(DARK.heading);
  });

  it('assigns the LIGHT heading color for heading1 in light mode', () => {
    const map = buildStyleMap(LIGHT, 'light');
    expect(map.heading1.color).toBe(LIGHT.heading);
  });

  it('produces progressively dimmer hex for heading levels', () => {
    const map = buildStyleMap(DARK, 'dark');
    expect(map.heading1.color).not.toBe(map.heading2.color);
    expect(map.heading2.color).not.toBe(map.heading3.color);
    expect(map.heading1.color).not.toBe(map.heading3.color);
  });
});
