export type CalloutFamily = 'none' | 'question' | 'admiration' | 'starred';

const CYCLE: Record<CalloutFamily, CalloutFamily> = {
  none: 'question',
  question: 'admiration',
  admiration: 'starred',
  starred: 'none',
};

const MARKER: Record<CalloutFamily, string> = {
  none: '',
  question: '?',
  admiration: '!',
  starred: '*',
};

export function detectFamily(line: string): CalloutFamily {
  const body = line.replace(/^\s*/, '');
  if (/^\?{1,3}\s/.test(body)) return 'question';
  if (/^!\s/.test(body)) return 'admiration';
  if (/^\*{1,3}\s/.test(body)) return 'starred';
  return 'none';
}

export function nextFamily(family: CalloutFamily): CalloutFamily {
  return CYCLE[family];
}

function stripMarker(body: string, family: CalloutFamily): string {
  switch (family) {
    case 'question':
      return body.replace(/^\?{1,3}\s+/, '');
    case 'admiration':
      return body.replace(/^!\s+/, '');
    case 'starred':
      return body.replace(/^\*{1,3}\s+/, '');
    case 'none':
      return body;
  }
}

function isBlank(line: string): boolean {
  return line.trim() === '';
}

export function applyTarget(line: string, target: CalloutFamily): string {
  if (isBlank(line)) return line;
  const indent = /^(\s*)/.exec(line)?.[1] ?? '';
  const body = line.slice(indent.length);
  const current = detectFamily(line);
  const stripped = stripMarker(body, current);
  const marker = MARKER[target];
  return marker === '' ? `${indent}${stripped}` : `${indent}${marker} ${stripped}`;
}

export function cycleLine(line: string): string {
  return applyTarget(line, nextFamily(detectFamily(line)));
}

export function cycleLines(lines: readonly string[]): string[] {
  const firstNonBlank = lines.find((l) => !isBlank(l));
  if (firstNonBlank === undefined) return [...lines];
  const target = nextFamily(detectFamily(firstNonBlank));
  return lines.map((l) => (isBlank(l) ? l : applyTarget(l, target)));
}
