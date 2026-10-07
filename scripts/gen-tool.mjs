#!/usr/bin/env node
// Scaffold a new tool from src/tools/_template.
// Usage: pnpm gen:tool <kebab-slug> [--category encoding]
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const templateDir = join(root, 'src', 'tools', '_template')
const toolsDir = join(root, 'src', 'tools')

const slug = process.argv[2]
const categoryIndex = process.argv.indexOf('--category')
const category = categoryIndex > -1 ? (process.argv[categoryIndex + 1] ?? 'encoding') : 'encoding'

if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error('Usage: pnpm gen:tool <kebab-slug> [--category encoding]')
  process.exit(1)
}

const targetDir = join(toolsDir, slug)
if (existsSync(targetDir)) {
  console.error(`Tool already exists: ${targetDir}`)
  process.exit(1)
}

mkdirSync(targetDir, { recursive: true })
cpSync(templateDir, targetDir, { recursive: true })

const pascal = slug
  .split('-')
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join('')
const toolName = pascal
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/\b\w/g, (c) => c.toUpperCase())

for (const file of ['index.ts', 'logic.ts', 'logic.spec.ts', 'Tool.vue']) {
  const path = join(targetDir, file)
  const content = readFileSync(path, 'utf8')
    .replaceAll('__PASCAL__', pascal)
    .replaceAll('__SLUG__', slug)
    .replaceAll('__TOOL_NAME__', toolName)
    .replaceAll('__CATEGORY__', category)
  writeFileSync(path, content)
}

console.log(`Created src/tools/${slug}/`)
console.log('Next steps:')
console.log(`  1. Implement logic in src/tools/${slug}/logic.ts (+ tests)`)
console.log(`  2. Build the UI in src/tools/${slug}/Tool.vue`)
console.log(`  3. Register it in src/tools/index.ts:`)
console.log(`       import { ${pascal} } from './${slug}'`)
console.log(`       export const tools: ToolMeta[] = [demoEcho, ${pascal}]`)
