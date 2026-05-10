import { describe, it, expect } from 'vitest';
import { extractPcts, compareCoverage } from './coverage-ratchet.js';

describe('extractPcts', () => {
  it('reads lines and branches pct from a coverage-summary shape', () => {
    const summary = {
      total: {
        lines: { pct: 73.42 },
        branches: { pct: 60.1 },
        statements: { pct: 73.42 },
        functions: { pct: 80 },
      },
    };
    expect(extractPcts(summary)).toEqual({ lines: 73.42, branches: 60.1 });
  });

  it('throws if summary is missing total', () => {
    expect(() => extractPcts({})).toThrow(/total/);
  });
});

describe('compareCoverage', () => {
  it('returns "equal" when current matches baseline', () => {
    expect(compareCoverage({ lines: 80, branches: 70 }, { lines: 80, branches: 70 })).toEqual({
      status: 'equal',
    });
  });

  it('returns "regression" with details when any value drops', () => {
    const r = compareCoverage({ lines: 79, branches: 70 }, { lines: 80, branches: 70 });
    expect(r.status).toBe('regression');
    expect(r.details).toContain('lines');
    expect(r.details).toContain('79');
    expect(r.details).toContain('80');
  });

  it('returns "regression" when only branches drops', () => {
    const r = compareCoverage({ lines: 80, branches: 69 }, { lines: 80, branches: 70 });
    expect(r.status).toBe('regression');
    expect(r.details).toContain('branches');
  });

  it('returns "improvement" with new baseline when any value rises', () => {
    const r = compareCoverage({ lines: 81, branches: 70 }, { lines: 80, branches: 70 });
    expect(r.status).toBe('improvement');
    expect(r.newBaseline).toEqual({ lines: 81, branches: 70 });
  });

  it('treats partial improvement (one up, one equal) as improvement', () => {
    const r = compareCoverage({ lines: 80, branches: 71 }, { lines: 80, branches: 70 });
    expect(r.status).toBe('improvement');
    expect(r.newBaseline).toEqual({ lines: 80, branches: 71 });
  });
});
