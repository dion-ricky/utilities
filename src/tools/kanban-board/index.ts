import type { ToolMeta } from '../types'

export const kanbanBoard: ToolMeta = {
  slug: 'kanban-board',
  name: 'Kanban Board',
  description:
    'Local-first kanban board with To do, In progress and Done columns; drag cards to reorder or move.',
  category: 'productivity',
  keywords: [
    'kanban',
    'board',
    'task',
    'todo',
    'in progress',
    'done',
    'drag',
    'productivity',
    'local storage',
  ],
  component: () => import('./Tool.vue').then((m) => m.default),
}
