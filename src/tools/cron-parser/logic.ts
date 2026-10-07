import { CronExpressionParser } from 'cron-parser'
import cronstrue from 'cronstrue'

export interface CronPreset {
  value: string
  label: string
  expr: string
}

/** Presets for the Select control; 'custom' means the user types their own expression. */
export const CRON_PRESETS: CronPreset[] = [
  { value: 'custom', label: 'Custom', expr: '' },
  { value: 'every-minute', label: 'Every minute', expr: '* * * * *' },
  { value: 'every-hour', label: 'Every hour', expr: '0 * * * *' },
  { value: 'daily-midnight', label: 'Daily at midnight', expr: '0 0 * * *' },
  { value: 'weekdays-9am', label: 'Weekdays at 09:00', expr: '0 9 * * 1-5' },
  { value: 'every-15-minutes', label: 'Every 15 minutes', expr: '*/15 * * * *' },
  { value: 'first-of-month', label: 'First day of month', expr: '0 0 1 * *' },
]

export const MAX_RUNS = 20

export type DescribeResult = { ok: true; description: string } | { ok: false; error: string }

export type NextRunsResult = { ok: true; runs: Date[] } | { ok: false; error: string }

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Human-readable description of a cron expression via cronstrue. */
export function describeCron(expr: string): DescribeResult {
  const trimmed = expr.trim()
  if (trimmed === '') {
    return { ok: false, error: 'Enter a cron expression.' }
  }
  try {
    const description = cronstrue.toString(trimmed, { throwExceptionOnParseError: true })
    return { ok: true, description }
  } catch (error) {
    return { ok: false, error: `Cannot describe expression: ${toErrorMessage(error)}` }
  }
}

/** Validate the 5-field format up front so the error message is friendly and precise. */
function validateFiveFields(expr: string): string | null {
  const fields = expr.trim().split(/\s+/)
  if (fields.length !== 5) {
    return `Expected 5 fields (minute hour day-of-month month day-of-week), got ${fields.length}.`
  }
  return null
}

/**
 * Compute the next `count` (1–20) run times of a 5-field cron expression.
 * Pass options.currentDate to anchor the iteration (used by tests); defaults to now.
 */
export function nextRuns(
  expr: string,
  count: number,
  options?: { currentDate?: Date },
): NextRunsResult {
  const trimmed = expr.trim()
  if (trimmed === '') {
    return { ok: false, error: 'Enter a cron expression.' }
  }
  const fieldError = validateFiveFields(trimmed)
  if (fieldError) return { ok: false, error: fieldError }
  if (!Number.isInteger(count) || count < 1 || count > MAX_RUNS) {
    return { ok: false, error: `Count must be a whole number between 1 and ${MAX_RUNS}.` }
  }
  try {
    const expression = CronExpressionParser.parse(trimmed, {
      currentDate: options?.currentDate,
    })
    const runs: Date[] = []
    for (let i = 0; i < count; i++) {
      runs.push(expression.next().toDate())
    }
    return { ok: true, runs }
  } catch (error) {
    return { ok: false, error: `Invalid cron expression: ${toErrorMessage(error)}` }
  }
}

/** Format a run Date as a readable local-time string. */
export function formatRun(date: Date): string {
  return date.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
