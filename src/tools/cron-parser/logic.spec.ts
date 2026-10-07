import { describe, expect, it } from 'vitest'
import { CRON_PRESETS, describeCron, MAX_RUNS, nextRuns } from './logic'

describe('describeCron', () => {
  it('describes a stepped expression case-insensitively', () => {
    const result = describeCron('*/5 * * * *')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.description.toLowerCase()).toContain('every 5 minutes')
  })

  it('describes a daily expression', () => {
    const result = describeCron('0 0 * * *')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.description.toLowerCase()).toContain('12:00 am')
  })

  it('returns a friendly error for an invalid expression', () => {
    const result = describeCron('not a cron')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/cannot describe/i)
  })

  it('returns a friendly error for empty input', () => {
    expect(describeCron('')).toEqual({ ok: false, error: 'Enter a cron expression.' })
    expect(describeCron('   ')).toEqual({ ok: false, error: 'Enter a cron expression.' })
  })
})

describe('nextRuns', () => {
  const base = new Date('2026-01-01T00:03:00')

  it('computes evenly spaced runs for every 5 minutes', () => {
    const result = nextRuns('*/5 * * * *', 3, { currentDate: base })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.runs).toHaveLength(3)
    expect(result.runs[0]?.getTime()).toBe(new Date('2026-01-01T00:05:00').getTime())
    expect(result.runs[1]?.getTime()).toBe(new Date('2026-01-01T00:10:00').getTime())
    expect(result.runs[2]?.getTime()).toBe(new Date('2026-01-01T00:15:00').getTime())
  })

  it('computes strictly increasing run times with correct spacing', () => {
    const result = nextRuns('*/15 * * * *', 4, { currentDate: base })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    for (let i = 1; i < result.runs.length; i++) {
      const prev = result.runs[i - 1]
      const curr = result.runs[i]
      if (!prev || !curr) continue
      expect(curr.getTime() - prev.getTime()).toBe(15 * 60_000)
    }
  })

  it('starts strictly after the current date', () => {
    const result = nextRuns('* * * * *', 2, { currentDate: base })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    for (const run of result.runs) {
      expect(run.getTime()).toBeGreaterThan(base.getTime())
    }
  })

  it('respects count bounds', () => {
    expect(nextRuns('* * * * *', 0, { currentDate: base }).ok).toBe(false)
    expect(nextRuns('* * * * *', MAX_RUNS + 1, { currentDate: base }).ok).toBe(false)
    expect(nextRuns('* * * * *', 2.5, { currentDate: base }).ok).toBe(false)
    const ok = nextRuns('* * * * *', 1, { currentDate: base })
    expect(ok.ok).toBe(true)
  })

  it('rejects expressions with the wrong number of fields', () => {
    const tooFew = nextRuns('* * *', 1, { currentDate: base })
    expect(tooFew).toEqual({ ok: false, error: expect.stringContaining('Expected 5 fields') })
    const tooMany = nextRuns('0 0 0 * * *', 1, { currentDate: base })
    expect(tooMany.ok).toBe(false)
  })

  it('rejects invalid field values with a friendly message', () => {
    const result = nextRuns('99 * * * *', 1, { currentDate: base })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/invalid cron expression/i)
  })

  it('rejects empty input', () => {
    expect(nextRuns('', 1)).toEqual({ ok: false, error: 'Enter a cron expression.' })
  })
})

describe('CRON_PRESETS', () => {
  it('contains the required presets with 5-field expressions', () => {
    const labels = CRON_PRESETS.map((p) => p.label)
    expect(labels).toEqual([
      'Custom',
      'Every minute',
      'Every hour',
      'Daily at midnight',
      'Weekdays at 09:00',
      'Every 15 minutes',
      'First day of month',
    ])
    for (const preset of CRON_PRESETS) {
      if (preset.value === 'custom') {
        expect(preset.expr).toBe('')
      } else {
        expect(preset.expr.split(/\s+/)).toHaveLength(5)
        expect(nextRuns(preset.expr, 1, { currentDate: new Date('2026-06-01T12:00:00') }).ok).toBe(
          true,
        )
      }
    }
  })
})
