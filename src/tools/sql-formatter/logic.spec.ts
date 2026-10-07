import { describe, expect, it } from 'vitest'
import { formatSql } from './logic'

describe('formatSql', () => {
  it('formats a simple query with 2-space indent', () => {
    const result = formatSql('select a, b from t where x = 1', {
      language: 'postgresql',
      indent: '2',
      keywordCase: 'upper',
    })
    expect(result).toEqual({
      ok: true,
      result: 'SELECT\n  a,\n  b\nFROM\n  t\nWHERE\n  x = 1',
    })
  })

  it('formats with 4-space indent', () => {
    const result = formatSql('select a from t', {
      language: 'postgresql',
      indent: '4',
      keywordCase: 'upper',
    })
    expect(result).toEqual({ ok: true, result: 'SELECT\n    a\nFROM\n    t' })
  })

  it('formats with tab indent', () => {
    const result = formatSql('select a from t', {
      language: 'postgresql',
      indent: 'tab',
      keywordCase: 'upper',
    })
    expect(result).toEqual({ ok: true, result: 'SELECT\n\ta\nFROM\n\tt' })
  })

  it('preserves keyword case when asked', () => {
    const result = formatSql('select a from t', {
      language: 'postgresql',
      indent: '2',
      keywordCase: 'preserve',
    })
    expect(result).toEqual({ ok: true, result: 'select\n  a\nfrom\n  t' })
  })

  it('supports every advertised dialect without throwing', () => {
    const languages = [
      'postgresql',
      'mysql',
      'mariadb',
      'sqlite',
      'tsql',
      'bigquery',
      'snowflake',
    ] as const
    for (const language of languages) {
      const result = formatSql('select 1', { language, indent: '2', keywordCase: 'upper' })
      expect(result.ok).toBe(true)
    }
  })

  it('formats multiple statements', () => {
    const result = formatSql('select 1; select 2;', {
      language: 'postgresql',
      indent: '2',
      keywordCase: 'upper',
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.result).toContain('SELECT\n  2;')
  })

  it('returns empty output for empty input', () => {
    expect(formatSql('', { language: 'postgresql', indent: '2', keywordCase: 'upper' })).toEqual({
      ok: true,
      result: '',
    })
    expect(
      formatSql('   \n\t', { language: 'mysql', indent: '4', keywordCase: 'preserve' }),
    ).toEqual({
      ok: true,
      result: '',
    })
  })

  it('returns a friendly error on invalid SQL', () => {
    const result = formatSql('select ??? ### ((( from', {
      language: 'postgresql',
      indent: '2',
      keywordCase: 'upper',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/^Could not format SQL —/)
  })
})
