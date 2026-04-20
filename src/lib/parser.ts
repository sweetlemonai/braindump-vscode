export type MarkerFamily =
  | 'heading'
  | 'category'
  | 'section'
  | 'question'
  | 'admiration'
  | 'starred';

export type CalloutKind = 'question' | 'admiration' | 'starred';

export interface Marker {
  family: MarkerFamily;
  level: number;
  lineNumber: number;
  content: string;
}

export interface MentionOccurrence {
  name: string;
  lineNumber: number;
  column: number;
}

export interface MentionSummary {
  name: string;
  count: number;
}

export type ConstructKind =
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'category1'
  | 'category2'
  | 'category3'
  | 'section1'
  | 'section2'
  | 'section3'
  | 'question1'
  | 'question2'
  | 'question3'
  | 'admiration'
  | 'starred1'
  | 'starred2'
  | 'starred3'
  | 'commandIn1'
  | 'commandIn2'
  | 'commandIn3'
  | 'commandOut1'
  | 'commandOut2'
  | 'commandOut3'
  | 'mention'
  | 'comment'
  | 'link';

export interface ConstructRange {
  kind: ConstructKind;
  line: number;
  startChar: number;
  endChar: number;
}

const LINE_START_MENTION = /^(\s*)@\s+([\w-]+)/;
const INLINE_MENTION_GUARD = /(?<=^|[\s([{"',.:;])@([\w-]+)/g;

const MARKER_PATTERNS: ReadonlyArray<readonly [MarkerFamily, RegExp]> = [
  ['heading', /^\s*(#{1,3})\s+(.+?)\s*$/],
  ['category', /^\s*(={1,3})\s+(.+?)\s*$/],
  ['section', /^\s*(\+{1,3})\s+(.+?)\s*$/],
  ['question', /^\s*(\?{1,3})\s+(.+?)\s*$/],
  ['admiration', /^\s*(!)\s+(.+?)\s*$/],
  ['starred', /^\s*(\*{1,3})\s+(.+?)\s*$/],
];

export function parseMarkers(text: string): Marker[] {
  const lines = text.split(/\r?\n/);
  const markers: Marker[] = [];
  for (let i = 0; i < lines.length; i++) {
    const marker = parseMarkerLine(lines[i], i);
    if (marker) markers.push(marker);
  }
  return markers;
}

export function parseMarkerLine(line: string, lineNumber: number): Marker | null {
  for (const [family, regex] of MARKER_PATTERNS) {
    const match = line.match(regex);
    if (match) {
      return {
        family,
        level: match[1].length,
        lineNumber,
        content: match[2],
      };
    }
  }
  return null;
}

export function parseMentions(text: string): MentionOccurrence[] {
  const lines = text.split(/\r?\n/);
  const out: MentionOccurrence[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const lineStart = LINE_START_MENTION.exec(line);
    if (lineStart) {
      out.push({ name: lineStart[2], lineNumber: i, column: lineStart[1].length });
      continue;
    }

    INLINE_MENTION_GUARD.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = INLINE_MENTION_GUARD.exec(line)) !== null) {
      out.push({ name: m[1], lineNumber: i, column: m.index });
    }
  }
  return out;
}

const LINE_STARTER_PATTERNS: ReadonlyArray<readonly [ConstructKind, RegExp]> = [
  ['heading3', /^\s*###[ \t]+\S.*$/],
  ['heading2', /^\s*##[ \t]+\S.*$/],
  ['heading1', /^\s*#[ \t]+\S.*$/],
  ['category3', /^\s*===[ \t]+\S.*$/],
  ['category2', /^\s*==[ \t]+\S.*$/],
  ['category1', /^\s*=[ \t]+\S.*$/],
  ['section3', /^\s*\+\+\+[ \t]+\S.*$/],
  ['section2', /^\s*\+\+[ \t]+\S.*$/],
  ['section1', /^\s*\+[ \t]+\S.*$/],
  ['question3', /^\s*\?\?\?[ \t]+\S.*$/],
  ['question2', /^\s*\?\?[ \t]+\S.*$/],
  ['question1', /^\s*\?[ \t]+\S.*$/],
  ['admiration', /^\s*![ \t]+\S.*$/],
  ['starred3', /^\s*\*\*\*[ \t]+\S.*$/],
  ['starred2', /^\s*\*\*[ \t]+\S.*$/],
  ['starred1', /^\s*\*[ \t]+\S.*$/],
  ['commandOut3', /^\s*>>>[ \t]+\S.*$/],
  ['commandOut2', /^\s*>>[ \t]+\S.*$/],
  ['commandOut1', /^\s*>[ \t]+\S.*$/],
  ['commandIn3', /^\s*<<<[ \t]+\S.*$/],
  ['commandIn2', /^\s*<<[ \t]+\S.*$/],
  ['commandIn1', /^\s*<[ \t]+\S.*$/],
  ['comment', /^\s*\/\/(?!\/).*$/],
];

const URL_PATTERN = /\bhttps?:\/\/[^\s<>"')]+/g;

export function parseConstructs(text: string): ConstructRange[] {
  const lines = text.split(/\r?\n/);
  const out: ConstructRange[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    let lineKind: ConstructKind | null = null;
    for (const [kind, regex] of LINE_STARTER_PATTERNS) {
      if (regex.test(line)) {
        lineKind = kind;
        break;
      }
    }

    if (!lineKind && /^\s*@[ \t]+\S.*$/.test(line)) {
      lineKind = 'mention';
    }

    if (lineKind) {
      out.push({ kind: lineKind, line: i, startChar: 0, endChar: line.length });
    }

    INLINE_MENTION_GUARD.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = INLINE_MENTION_GUARD.exec(line)) !== null) {
      out.push({
        kind: 'mention',
        line: i,
        startChar: m.index,
        endChar: m.index + m[0].length,
      });
    }

    URL_PATTERN.lastIndex = 0;
    let u: RegExpExecArray | null;
    while ((u = URL_PATTERN.exec(line)) !== null) {
      out.push({
        kind: 'link',
        line: i,
        startChar: u.index,
        endChar: u.index + u[0].length,
      });
    }
  }

  return out;
}

export function aggregateMentions(
  perFileMentions: Iterable<readonly MentionOccurrence[]>
): MentionSummary[] {
  const counts = new Map<string, MentionSummary>();
  for (const mentions of perFileMentions) {
    for (const m of mentions) {
      const key = m.name.toLowerCase();
      const existing = counts.get(key);
      if (existing) {
        existing.count++;
      } else {
        counts.set(key, { name: m.name, count: 1 });
      }
    }
  }
  return [...counts.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name)
  );
}
