import { format } from 'sql-formatter'

export type SqlLanguage =
  | 'postgresql'
  | 'mysql'
  | 'mariadb'
  | 'sqlite'
  | 'tsql'
  | 'bigquery'
  | 'snowflake'

export type SqlIndent = '2' | '4' | 'tab'

export interface FormatSqlOptions {
  language: SqlLanguage
  indent: SqlIndent
  keywordCase: 'upper' | 'preserve'
}

export type SqlFormatResult = { ok: true; result: string } | { ok: false; error: string }

export function formatSql(input: string, options: FormatSqlOptions): SqlFormatResult {
  if (!input.trim()) {
    return { ok: true, result: '' }
  }

  try {
    const result = format(input, {
      language: options.language,
      tabWidth: options.indent === '4' ? 4 : 2,
      useTabs: options.indent === 'tab',
      keywordCase: options.keywordCase,
    })
    return { ok: true, result }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, error: `Could not format SQL — ${message}` }
  }
}
