import { describe, expect, it } from 'vitest'
import {
  toCamel,
  toConstant,
  toKebab,
  toLowerSentence,
  toPascal,
  toSnake,
  toTitle,
  toUpperSentence,
  toWords,
} from './logic'

describe('toWords', () => {
  it('returns empty array for empty or separator-only input', () => {
    expect(toWords('')).toEqual([])
    expect(toWords('   ')).toEqual([])
    expect(toWords('---___')).toEqual([])
  })

  it('splits snake_case and kebab-case', () => {
    expect(toWords('user_id')).toEqual(['user', 'id'])
    expect(toWords('user-id')).toEqual(['user', 'id'])
  })

  it('splits camelCase and PascalCase', () => {
    expect(toWords('getUserName')).toEqual(['get', 'user', 'name'])
    expect(toWords('GetUserName')).toEqual(['get', 'user', 'name'])
  })

  it('splits spaces and punctuation', () => {
    expect(toWords('Hello, world!')).toEqual(['hello', 'world'])
  })

  it('handles acronyms: HTTPServer -> http/server', () => {
    expect(toWords('HTTPServer')).toEqual(['http', 'server'])
    expect(toWords('parseHTTPResponse')).toEqual(['parse', 'http', 'response'])
  })

  it('creates word boundaries at letter->digit', () => {
    expect(toWords('foo2bar')).toEqual(['foo', '2', 'bar'])
    expect(toWords('v2')).toEqual(['v', '2'])
  })

  it('creates digit->letter boundaries only before lowercase letters', () => {
    expect(toWords('2fast')).toEqual(['2', 'fast'])
    expect(toWords('HTML5test')).toEqual(['html', '5', 'test'])
    // letter->digit boundary always splits (HTML5 -> html, 5)...
    expect(toWords('HTML5')).toEqual(['html', '5'])
    // ...but digit followed by an uppercase letter stays together ('5X' keeps going
    // through the letter->digit rule on the next pass of the acronym, e.g. x86X64).
    expect(toWords('x86X64')).toEqual(['x', '86', 'x', '64'])
  })

  it('handles a messy mix of conventions', () => {
    expect(toWords('XMLHttpRequest_v2-final')).toEqual([
      'xml',
      'http',
      'request',
      'v',
      '2',
      'final',
    ])
  })
})

describe('converters', () => {
  it('toCamel', () => {
    expect(toCamel('user name field')).toBe('userNameField')
    expect(toCamel('HTTP-server')).toBe('httpServer')
    expect(toCamel('')).toBe('')
  })

  it('toPascal', () => {
    expect(toPascal('user name field')).toBe('UserNameField')
    expect(toPascal('getUserName')).toBe('GetUserName')
  })

  it('toSnake', () => {
    expect(toSnake('UserNameField')).toBe('user_name_field')
    expect(toSnake('foo2bar')).toBe('foo_2_bar')
  })

  it('toKebab', () => {
    expect(toKebab('UserNameField')).toBe('user-name-field')
    expect(toKebab('  spaced  out ')).toBe('spaced-out')
  })

  it('toConstant', () => {
    expect(toConstant('max retry count')).toBe('MAX_RETRY_COUNT')
    expect(toConstant('user-id')).toBe('USER_ID')
  })

  it('toTitle', () => {
    expect(toTitle('user name field')).toBe('User Name Field')
    expect(toTitle('HTTP-server')).toBe('Http Server')
  })

  it('toUpperSentence', () => {
    expect(toUpperSentence('user name')).toBe('USER NAME')
  })

  it('toLowerSentence', () => {
    expect(toLowerSentence('User NAME')).toBe('user name')
  })

  it('round-trips a mixed input through all conversions', () => {
    const input = 'backgroundColor2Fast'
    expect(toCamel(input)).toBe('backgroundColor2Fast')
    expect(toSnake(input)).toBe('background_color_2_fast')
    expect(toKebab(input)).toBe('background-color-2-fast')
  })
})
