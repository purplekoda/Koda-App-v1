#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SUMMARY_PATH = path.resolve(process.cwd(), 'coverage/coverage-summary.json');
const BASELINE_PATH = path.resolve(process.cwd(), '.coverage-baseline.json');

export function extractPcts(summary) {
  if (!summary || !summary.total) {
    throw new Error('Coverage summary missing required "total" field');
  }
  return {
    lines: summary.total.lines.pct,
    branches: summary.total.branches.pct,
  };
}

export function compareCoverage(current, baseline) {
  const linesDropped = current.lines < baseline.lines;
  const branchesDropped = current.branches < baseline.branches;

  if (linesDropped || branchesDropped) {
    const parts = [];
    if (linesDropped) parts.push(`lines ${current.lines}% < baseline ${baseline.lines}%`);
    if (branchesDropped)
      parts.push(`branches ${current.branches}% < baseline ${baseline.branches}%`);
    return { status: 'regression', details: parts.join(', ') };
  }

  if (current.lines > baseline.lines || current.branches > baseline.branches) {
    return {
      status: 'improvement',
      newBaseline: {
        lines: Math.max(current.lines, baseline.lines),
        branches: Math.max(current.branches, baseline.branches),
      },
    };
  }

  return { status: 'equal' };
}

function readJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

function main() {
  if (!existsSync(SUMMARY_PATH)) {
    console.error(
      `coverage-ratchet: ${SUMMARY_PATH} not found. Run "vitest run --coverage" first.`,
    );
    process.exit(1);
  }
  if (!existsSync(BASELINE_PATH)) {
    console.error(
      `coverage-ratchet: ${BASELINE_PATH} not found. Seed it with {"lines":0,"branches":0}.`,
    );
    process.exit(1);
  }

  const current = extractPcts(readJson(SUMMARY_PATH));
  const baseline = readJson(BASELINE_PATH);
  const result = compareCoverage(current, baseline);

  if (result.status === 'equal') {
    console.log(`coverage-ratchet: OK (lines=${current.lines}% branches=${current.branches}%)`);
    process.exit(0);
  }

  if (result.status === 'regression') {
    console.error(`coverage-ratchet: REGRESSION (${result.details})`);
    process.exit(1);
  }

  writeFileSync(BASELINE_PATH, `${JSON.stringify(result.newBaseline, null, 2)}\n`);
  console.error(
    `coverage-ratchet: Coverage increased to lines=${current.lines}% branches=${current.branches}%. ` +
      'Baseline updated. Commit .coverage-baseline.json and push again.',
  );
  process.exit(1);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) main();
