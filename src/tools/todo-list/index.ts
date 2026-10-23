import type { ToolMeta } from '../types'

export const todoList: ToolMeta = {
  slug: 'todo-list',
  name: 'Todo List',
  description: 'Local-first todo list with filters; tasks stay in this browser.',
  category: 'productivity',
  keywords: ['todo', 'task', 'checklist', 'productivity', 'local storage'],
  component: () => import('./Tool.vue').then((m) => m.default),
}
