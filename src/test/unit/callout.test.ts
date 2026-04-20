import { describe, expect, it } from 'vitest';
import { applyTarget, cycleLine, cycleLines, detectFamily, nextFamily } from '../../features/callout';

describe('detectFamily', () => {
  it('recognizes every level of each family', () => {
    expect(detectFamily('? x')).toBe('question');
    expect(detectFamily('?? x')).toBe('question');
    expect(detectFamily('??? x')).toBe('question');
    expect(detectFamily('! x')).toBe('admiration');
    expect(detectFamily('* x')).toBe('starred');
    expect(detectFamily('** x')).toBe('starred');
    expect(detectFamily('*** x')).toBe('starred');
  });

  it('returns none for unmarked lines', () => {
    expect(detectFamily('plain text')).toBe('none');
    expect(detectFamily('')).toBe('none');
    expect(detectFamily('  indented prose')).toBe('none');
    expect(detectFamily('# heading')).toBe('none');
    expect(detectFamily('- item')).toBe('none');
  });

  it('ignores leading whitespace when detecting', () => {
    expect(detectFamily('  ? x')).toBe('question');
    expect(detectFamily('\t! x')).toBe('admiration');
  });
});

describe('nextFamily', () => {
  it('cycles none → question → admiration → starred → none', () => {
    expect(nextFamily('none')).toBe('question');
    expect(nextFamily('question')).toBe('admiration');
    expect(nextFamily('admiration')).toBe('starred');
    expect(nextFamily('starred')).toBe('none');
  });
});

describe('cycleLine', () => {
  it('single-line transitions around the full cycle', () => {
    expect(cycleLine('foo')).toBe('? foo');
    expect(cycleLine('? foo')).toBe('! foo');
    expect(cycleLine('! foo')).toBe('* foo');
    expect(cycleLine('* foo')).toBe('foo');
  });

  it('preserves leading whitespace', () => {
    expect(cycleLine('  ? foo')).toBe('  ! foo');
    expect(cycleLine('    plain')).toBe('    ? plain');
    expect(cycleLine('\t* done')).toBe('\tdone');
  });

  it('collapses level markers (??, ??? → !) when moving to the next family', () => {
    expect(cycleLine('?? foo')).toBe('! foo');
    expect(cycleLine('??? foo')).toBe('! foo');
    expect(cycleLine('** foo')).toBe('foo');
    expect(cycleLine('*** foo')).toBe('foo');
  });

  it('is a no-op on blank lines', () => {
    expect(cycleLine('')).toBe('');
    expect(cycleLine('   ')).toBe('   ');
  });
});

describe('applyTarget', () => {
  it('applies a given target family directly', () => {
    expect(applyTarget('foo', 'question')).toBe('? foo');
    expect(applyTarget('? foo', 'starred')).toBe('* foo');
    expect(applyTarget('* foo', 'none')).toBe('foo');
  });
});

describe('cycleLines', () => {
  it('picks transition from the first non-blank line and applies uniformly', () => {
    const input = ['? alpha', '! beta', 'gamma', '* delta'];
    // first line is question → target is admiration; every non-blank line becomes '! content'.
    expect(cycleLines(input)).toEqual(['! alpha', '! beta', '! gamma', '! delta']);
  });

  it('skips past leading blank lines when selecting the driver line', () => {
    const input = ['', '  ', 'plain', '? other'];
    // first non-blank is 'plain' (none) → target is question.
    expect(cycleLines(input)).toEqual(['', '  ', '? plain', '? other']);
  });

  it('leaves blank lines untouched', () => {
    const input = ['? a', '', '? b'];
    expect(cycleLines(input)).toEqual(['! a', '', '! b']);
  });

  it('returns an unchanged copy when every selected line is blank', () => {
    const input = ['', '  ', '\t'];
    expect(cycleLines(input)).toEqual(['', '  ', '\t']);
  });

  it('preserves leading whitespace on every transitioned line', () => {
    expect(cycleLines(['  ? a', '    * b'])).toEqual(['  ! a', '    ! b']);
  });
});
