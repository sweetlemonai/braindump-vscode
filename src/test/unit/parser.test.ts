import { describe, expect, it } from 'vitest';
import {
  aggregateMentions,
  parseConstructs,
  parseMarkerLine,
  parseMarkers,
  parseMentions,
} from '../../lib/parser';

describe('parseMarkerLine', () => {
  it('matches heading levels 1 / 2 / 3', () => {
    expect(parseMarkerLine('# One', 0)).toMatchObject({ family: 'heading', level: 1, content: 'One' });
    expect(parseMarkerLine('## Two', 0)).toMatchObject({ family: 'heading', level: 2, content: 'Two' });
    expect(parseMarkerLine('### Three', 0)).toMatchObject({ family: 'heading', level: 3, content: 'Three' });
  });

  it('matches category family', () => {
    expect(parseMarkerLine('= One', 0)).toMatchObject({ family: 'category', level: 1 });
    expect(parseMarkerLine('=== Three', 0)).toMatchObject({ family: 'category', level: 3 });
  });

  it('matches section family', () => {
    expect(parseMarkerLine('+ One', 0)).toMatchObject({ family: 'section', level: 1 });
    expect(parseMarkerLine('+++ Three', 0)).toMatchObject({ family: 'section', level: 3 });
  });

  it('matches question and admiration', () => {
    expect(parseMarkerLine('? why', 0)).toMatchObject({ family: 'question', level: 1, content: 'why' });
    expect(parseMarkerLine('??? deep', 0)).toMatchObject({ family: 'question', level: 3 });
    expect(parseMarkerLine('! urgent', 0)).toMatchObject({ family: 'admiration', level: 1 });
  });

  it('matches starred family at levels 1 / 2 / 3', () => {
    expect(parseMarkerLine('* pin', 0)).toMatchObject({ family: 'starred', level: 1, content: 'pin' });
    expect(parseMarkerLine('** big', 0)).toMatchObject({ family: 'starred', level: 2 });
    expect(parseMarkerLine('*** huge', 0)).toMatchObject({ family: 'starred', level: 3 });
  });

  it('trims trailing whitespace from content', () => {
    expect(parseMarkerLine('# Title   ', 0)?.content).toBe('Title');
  });

  it('allows leading whitespace', () => {
    expect(parseMarkerLine('  ## Indented', 0)).toMatchObject({ family: 'heading', level: 2, content: 'Indented' });
  });

  it('returns null for non-marker lines', () => {
    expect(parseMarkerLine('just prose', 0)).toBeNull();
    expect(parseMarkerLine('- list item', 0)).toBeNull();
    expect(parseMarkerLine('// comment', 0)).toBeNull();
    expect(parseMarkerLine('', 0)).toBeNull();
    expect(parseMarkerLine('#', 0)).toBeNull();
    expect(parseMarkerLine('# ', 0)).toBeNull();
  });

  it('does not match mid-line markers', () => {
    expect(parseMarkerLine('see # one', 0)).toBeNull();
  });
});

describe('parseMarkers', () => {
  it('returns empty for an empty document', () => {
    expect(parseMarkers('')).toEqual([]);
  });

  it('collects markers across lines with correct line numbers', () => {
    const input = ['# H1', 'body', '## H2', '? q'].join('\n');
    expect(parseMarkers(input)).toEqual([
      { family: 'heading', level: 1, lineNumber: 0, content: 'H1' },
      { family: 'heading', level: 2, lineNumber: 2, content: 'H2' },
      { family: 'question', level: 1, lineNumber: 3, content: 'q' },
    ]);
  });

  it('handles CRLF line endings', () => {
    const input = '# H1\r\n## H2\r\n';
    const markers = parseMarkers(input);
    expect(markers).toHaveLength(2);
    expect(markers[0].content).toBe('H1');
    expect(markers[1].content).toBe('H2');
  });

  it('extracts mentions independently via parseMentions', () => {
    const input = 'Contact @alice and @bob about the report.';
    const mentions = parseMentions(input);
    expect(mentions).toEqual([
      { name: 'alice', lineNumber: 0, column: 8 },
      { name: 'bob', lineNumber: 0, column: 19 },
    ]);
  });

  it('extracts headings, categories, sections, and callouts from a realistic doc', () => {
    const input = [
      '# Trip',
      '## Logistics',
      '### Flights',
      '',
      '= People',
      '== Core',
      '',
      '+ Day 1',
      '++ Morning',
      '',
      '? should we rebook?',
      '! deadline Friday',
      '- not a marker',
    ].join('\n');
    const families = parseMarkers(input).map((m) => `${m.family}:${m.level}`);
    expect(families).toEqual([
      'heading:1',
      'heading:2',
      'heading:3',
      'category:1',
      'category:2',
      'section:1',
      'section:2',
      'question:1',
      'admiration:1',
    ]);
  });
});

describe('parseMentions', () => {
  it('matches a simple inline mention at line start', () => {
    expect(parseMentions('@alice')).toEqual([{ name: 'alice', lineNumber: 0, column: 0 }]);
  });

  it('matches mid-line mentions after whitespace', () => {
    expect(parseMentions('Ping @bob please')).toEqual([
      { name: 'bob', lineNumber: 0, column: 5 },
    ]);
  });

  it('matches multiple mentions on the same line', () => {
    expect(parseMentions('cc @alice and @bob')).toEqual([
      { name: 'alice', lineNumber: 0, column: 3 },
      { name: 'bob', lineNumber: 0, column: 14 },
    ]);
  });

  it('matches line-start mention with trailing space form', () => {
    expect(parseMentions('@ alice')).toEqual([
      { name: 'alice', lineNumber: 0, column: 0 },
    ]);
  });

  it('matches mentions preceded by guard punctuation', () => {
    expect(parseMentions('(@alice)')).toEqual([{ name: 'alice', lineNumber: 0, column: 1 }]);
    expect(parseMentions('"@alice"')).toEqual([{ name: 'alice', lineNumber: 0, column: 1 }]);
    expect(parseMentions("'@alice'")).toEqual([{ name: 'alice', lineNumber: 0, column: 1 }]);
    expect(parseMentions('{@alice}')).toEqual([{ name: 'alice', lineNumber: 0, column: 1 }]);
    expect(parseMentions(',@alice')).toEqual([{ name: 'alice', lineNumber: 0, column: 1 }]);
  });

  it('supports hyphenated names', () => {
    expect(parseMentions('@carol-smith')).toEqual([
      { name: 'carol-smith', lineNumber: 0, column: 0 },
    ]);
  });

  it('does not match email addresses', () => {
    expect(parseMentions('foo@bar.com')).toEqual([]);
    expect(parseMentions('contact foo@bar.com today')).toEqual([]);
  });

  it('reports the correct line number for multi-line input', () => {
    const input = 'line zero\nPing @bob\n@carol\n';
    expect(parseMentions(input)).toEqual([
      { name: 'bob', lineNumber: 1, column: 5 },
      { name: 'carol', lineNumber: 2, column: 0 },
    ]);
  });
});

describe('aggregateMentions', () => {
  it('returns an empty array when no mentions are provided', () => {
    expect(aggregateMentions([])).toEqual([]);
  });

  it('deduplicates case-insensitively and preserves first-seen casing', () => {
    const fileA = [{ name: 'Alice', lineNumber: 0, column: 0 }];
    const fileB = [
      { name: 'alice', lineNumber: 0, column: 0 },
      { name: 'ALICE', lineNumber: 1, column: 0 },
    ];
    expect(aggregateMentions([fileA, fileB])).toEqual([{ name: 'Alice', count: 3 }]);
  });

  it('sorts by frequency descending, then alphabetical', () => {
    const fileA = [
      { name: 'alice', lineNumber: 0, column: 0 },
      { name: 'alice', lineNumber: 1, column: 0 },
      { name: 'bob', lineNumber: 2, column: 0 },
    ];
    const fileB = [
      { name: 'carol', lineNumber: 0, column: 0 },
      { name: 'carol', lineNumber: 1, column: 0 },
    ];
    expect(aggregateMentions([fileA, fileB])).toEqual([
      { name: 'alice', count: 2 },
      { name: 'carol', count: 2 },
      { name: 'bob', count: 1 },
    ]);
  });

  it('treats case-variant spellings as one mention with combined count', () => {
    const fileA = [
      { name: 'Alice', lineNumber: 0, column: 0 },
      { name: 'alice', lineNumber: 1, column: 0 },
    ];
    expect(aggregateMentions([fileA])).toEqual([{ name: 'Alice', count: 2 }]);
  });
});

describe('parseConstructs', () => {
  it('returns an empty array for empty input', () => {
    expect(parseConstructs('')).toEqual([]);
  });

  it('emits a heading1 range spanning the whole line', () => {
    const line = '# Hello';
    const ranges = parseConstructs(line);
    expect(ranges).toContainEqual({
      kind: 'heading1',
      line: 0,
      startChar: 0,
      endChar: line.length,
    });
  });

  it('distinguishes heading levels by level suffix', () => {
    const input = '# one\n## two\n### three';
    const kinds = parseConstructs(input).map((r) => r.kind);
    expect(kinds).toEqual(['heading1', 'heading2', 'heading3']);
  });

  it('matches categories, sections, and callouts', () => {
    const input = '= cat\n+ sec\n? q\n! im\n* star';
    const kinds = parseConstructs(input).map((r) => r.kind);
    expect(kinds).toEqual(['category1', 'section1', 'question1', 'admiration', 'starred1']);
  });

  it('matches three-level command.in and command.out', () => {
    const input = '> one\n>> two\n>>> three\n< four\n<< five\n<<< six';
    const kinds = parseConstructs(input).map((r) => r.kind);
    expect(kinds).toEqual([
      'commandOut1',
      'commandOut2',
      'commandOut3',
      'commandIn1',
      'commandIn2',
      'commandIn3',
    ]);
  });

  it('matches comments with correct line range', () => {
    const line = '  // a note';
    const ranges = parseConstructs(line);
    expect(ranges).toEqual([
      { kind: 'comment', line: 0, startChar: 0, endChar: line.length },
    ]);
  });

  it('emits inline mentions with column-accurate ranges', () => {
    const line = 'Ping @bob please';
    const mentions = parseConstructs(line).filter((r) => r.kind === 'mention');
    expect(mentions).toEqual([
      { kind: 'mention', line: 0, startChar: 5, endChar: 9 },
    ]);
  });

  it('emits a mention range for line-start @ name form', () => {
    const line = '@ alice';
    const ranges = parseConstructs(line);
    expect(ranges).toEqual([
      { kind: 'mention', line: 0, startChar: 0, endChar: line.length },
    ]);
  });

  it('emits link ranges covering the URL only', () => {
    const line = 'see http://example.com/x for details';
    const links = parseConstructs(line).filter((r) => r.kind === 'link');
    expect(links).toEqual([
      { kind: 'link', line: 0, startChar: 4, endChar: 24 },
    ]);
  });

  it('tracks line numbers across CRLF input', () => {
    const input = '# one\r\n## two\r\n';
    const ranges = parseConstructs(input);
    expect(ranges[0].line).toBe(0);
    expect(ranges[1].line).toBe(1);
  });

  it('does not emit any construct for plain prose', () => {
    expect(parseConstructs('just regular text on a line')).toEqual([]);
  });

  it('does not match mid-line markers', () => {
    expect(parseConstructs('see # inline')).toEqual([]);
  });
});
