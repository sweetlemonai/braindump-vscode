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
